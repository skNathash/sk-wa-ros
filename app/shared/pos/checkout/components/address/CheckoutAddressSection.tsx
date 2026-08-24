import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { useForm, useWatch } from "react-hook-form";
import { LocationEdit, MapPin } from "lucide-react";
import { AppInput, AppPincodeInput } from "~/components/core/form";
import StaticGMap from "~/components/core/map/StaticGMap";
import { Button } from "~/components/ui/button";
import useAppToast from "~/hooks/useAppToast";
import GMapLocModal from "~/modals/feature/geo-location/GeoLocationModal";
import { CustomerService } from "~/services/CustomerService";

type AddressRecord = {
  geolocation?: { type: "Point"; coordinates: [number, number] };
  name?: string;
  mobile?: string;
  type?: string;
  doorNo?: string;
  street?: string;
  city?: string;
  district?: string;
  state?: string;
  postcode?: string | number;
  landmark?: string;
  isDefault?: boolean;
  isActive?: boolean;
};

type FormVals = {
  pincode: string;
  doorNo: string;
  street: string;
  landmark: string;
  city: string;
  district: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
};

const emptyVals: FormVals = {
  pincode: "",
  doorNo: "",
  street: "",
  landmark: "",
  city: "",
  district: "",
  state: "",
  latitude: null,
  longitude: null,
};

/** The address the order ships to — the marked default, else the first. */
const pickDefaultIdx = (list: AddressRecord[]) => {
  if (!list?.length) return -1;
  const i = list.findIndex((a) => a?.isDefault);
  return i >= 0 ? i : 0;
};

export type AddressSectionHandle = {
  /** Saves against the customer. Resolves false when it couldn't. */
  save: () => Promise<boolean>;
};

type Props = {
  customer: Record<string, any> | null;
  /** Fires `{ action: "saved", data: { customer } }` once persisted. */
  callback?: (payload: { action: string; data?: any }) => void;
};

/**
 * Delivery address step of the assisted flow. The customer has to have a real
 * address on file before an assisted order can be raised, so this both shows
 * what is on file and writes back any correction.
 *
 * Saving is driven from the modal footer through the ref, keeping one primary
 * action across every step.
 */
const CheckoutAddressSection = forwardRef<AddressSectionHandle, Props>(
  ({ customer, callback }, ref) => {
    const appToast = useAppToast();
    const [showMap, setShowMap] = useState(false);
    const [saving, setSaving] = useState(false);

    const shippingAddress: AddressRecord[] = useMemo(
      () =>
        Array.isArray(customer?.shippingAddress)
          ? customer.shippingAddress
          : [],
      [customer],
    );
    const defaultIdx = useMemo(
      () => pickDefaultIdx(shippingAddress),
      [shippingAddress],
    );

    const { register, setValue, control, reset, getValues } = useForm<FormVals>(
      {
        defaultValues: emptyVals,
      },
    );

    useEffect(() => {
      if (defaultIdx < 0) {
        reset(emptyVals);
        return;
      }
      const address = shippingAddress[defaultIdx] || {};
      const coords = address.geolocation?.coordinates;
      reset({
        pincode: address.postcode ? String(address.postcode) : "",
        doorNo: address.doorNo || "",
        street: address.street || "",
        landmark: address.landmark || "",
        city: address.city || "",
        district: address.district || "",
        state: address.state || "",
        latitude: coords?.[1] ?? null,
        longitude: coords?.[0] ?? null,
      });
    }, [defaultIdx, shippingAddress, reset]);

    const lat = useWatch({ control, name: "latitude" });
    const lng = useWatch({ control, name: "longitude" });

    const handlePincodeSelect = (payload: {
      value: number | null;
      status?: string;
      data?: any;
    }) => {
      setValue("pincode", payload.value?.toString() || "");
      if (payload.status === "success" && payload.data) {
        setValue("city", payload.data.town || "");
        setValue("state", payload.data.state || "");
        setValue("district", payload.data.district || "");
      }
    };

    const handleMapCallback = (result: { action: string; address?: any }) => {
      if (result.action === "submit" && result.address) {
        const address = result.address;
        if (address.lat) setValue("latitude", address.lat);
        if (address.lng) setValue("longitude", address.lng);
        if (address.town) setValue("city", address.town);
        if (address.state) setValue("state", address.state);
        if (address.district) setValue("district", address.district);
        if (address.pincode) setValue("pincode", String(address.pincode));
        if (address.line1) setValue("street", address.line1);
      }
      setShowMap(false);
    };

    const save = async () => {
      const values = getValues();

      if (!customer?._id) {
        appToast.show({ msg: "No customer selected", color: "error" });
        return false;
      }

      const missing = !values.pincode
        ? "Pincode is required"
        : !values.doorNo
          ? "Door No is required"
          : !values.street
            ? "Address is required"
            : values.latitude == null || values.longitude == null
              ? "Location is required. Use 'Use current location' to set it."
              : "";

      if (missing) {
        appToast.show({ msg: missing, color: "error" });
        return false;
      }

      const record: AddressRecord = {
        geolocation: {
          type: "Point",
          coordinates: [values.longitude!, values.latitude!],
        },
        name: customer?.name || "",
        mobile: customer?.mobile || "",
        type: "home",
        doorNo: values.doorNo,
        street: values.street,
        city: values.city,
        district: values.district,
        state: values.state,
        postcode: values.pincode,
        landmark: values.landmark || "",
        isDefault: true,
        isActive: true,
      };

      const next: AddressRecord[] = shippingAddress.length
        ? shippingAddress.map((address, i) =>
            i === (defaultIdx >= 0 ? defaultIdx : 0)
              ? { ...address, ...record }
              : { ...address, isDefault: false },
          )
        : [record];

      setSaving(true);
      try {
        const resp = await CustomerService.updateCustomer(customer._id, {
          shippingAddress: next,
          address: {
            city: values.city,
            district: values.district,
            doorNo: values.doorNo,
            postcode: values.pincode,
            state: values.state,
            street: values.street,
          },
          geolocation: {
            type: "Point",
            coordinates: [values.longitude, values.latitude],
          },
        });

        if (resp?.statusCode !== 200) {
          appToast.show({
            msg: resp?.data?.message || "Failed to save address",
            color: "error",
          });
          return false;
        }

        appToast.show({ msg: "Address saved", color: "success" });
        callback?.({
          action: "saved",
          data: { customer: { ...customer, shippingAddress: next } },
        });
        return true;
      } catch (e) {
        console.error("Error saving customer address", e);
        appToast.show({ msg: "Failed to save address", color: "error" });
        return false;
      } finally {
        setSaving(false);
      }
    };

    useImperativeHandle(ref, () => ({ save }));

    return (
      <>
        <div className="tw:space-y-3">
          <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
            <div className="tw:flex tw:items-center tw:gap-2 tw:text-sm tw:font-semibold tw:text-slate-800">
              <MapPin className="tw:size-4 tw:text-emerald-700" />
              Delivery address
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowMap(true)}
            >
              <LocationEdit className="tw:size-3.5" />
              Use current location
            </Button>
          </div>

          <div className="tw:grid tw:grid-cols-12 tw:gap-x-2.5 tw:gap-y-2 tw:rounded-xl tw:bg-slate-50 tw:p-2.5">
            <div className="tw:col-span-12 tw:sm:col-span-4">
              <AppPincodeInput
                name="pincode"
                label="Pincode"
                placeholder="6 digit pincode"
                register={register}
                onPincodeSelect={handlePincodeSelect}
                showMultipleResult={false}
                isRequired
              />
            </div>
            <div className="tw:col-span-12 tw:sm:col-span-8">
              <AppInput
                name="doorNo"
                register={register}
                label="Door no"
                placeholder="Door no"
                inputClassName="tw:bg-white"
                isRequired
              />
            </div>
            <div className="tw:col-span-12">
              <AppInput
                name="street"
                register={register}
                label="Address"
                placeholder="Enter full address"
                inputClassName="tw:bg-white"
                isRequired
              />
            </div>
            <div className="tw:col-span-12">
              <AppInput
                name="landmark"
                register={register}
                label="Landmark"
                placeholder="Landmark (optional)"
                inputClassName="tw:bg-white"
              />
            </div>

            {typeof lat === "number" && typeof lng === "number" && (
              <div className="tw:col-span-12">
                <div className="tw:mb-1.5 tw:flex tw:items-center tw:justify-between tw:text-xs tw:text-slate-500">
                  <span>Location preview</span>
                  <span className="tw:tabular-nums">
                    {lat.toFixed(4)}, {lng.toFixed(4)}
                  </span>
                </div>
                <div className="tw:relative tw:h-32 tw:overflow-hidden tw:rounded-lg tw:border tw:border-slate-200">
                  <StaticGMap lat={lat} lng={lng} className="tw:size-full" />
                </div>
              </div>
            )}
          </div>

          {saving && (
            <p className="tw:text-xs tw:text-slate-500">Saving address…</p>
          )}
        </div>

        <GMapLocModal
          show={showMap}
          enableGeoLoc
          lat={typeof lat === "number" ? lat : undefined}
          lng={typeof lng === "number" ? lng : undefined}
          callback={handleMapCallback}
          title="Choose location"
        />
      </>
    );
  },
);

CheckoutAddressSection.displayName = "CheckoutAddressSection";

export default CheckoutAddressSection;
