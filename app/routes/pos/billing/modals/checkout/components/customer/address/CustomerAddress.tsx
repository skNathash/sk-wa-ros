import { ChevronLeft, LocationEdit, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import { AppInput, AppPincodeInput } from "~/components/core/form";
import StaticGMap from "~/components/core/map/StaticGMap";
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

const pickDefaultIdx = (list: AddressRecord[]) => {
  if (!list?.length) return -1;
  const i = list.findIndex((a) => a?.isDefault);
  return i >= 0 ? i : 0;
};

type Props = {
  callback?: (args: { action: string; data?: any }) => void;
};

const CustomerAddress = ({ callback }: Props) => {
  const { t } = useTranslation(["posbilling"]);
  const appToast = useAppToast();

  const parent = useFormContext();
  const customer = parent?.getValues?.("customer") || null;

  const shippingAddress: AddressRecord[] = useMemo(
    () => (Array.isArray(customer?.shippingAddress) ? customer.shippingAddress : []),
    [customer],
  );
  const defaultIdx = useMemo(() => pickDefaultIdx(shippingAddress), [shippingAddress]);

  const {
    register,
    setValue,
    getValues,
    control,
    reset,
    formState: { isSubmitting },
    handleSubmit,
  } = useForm<FormVals>({ defaultValues: emptyVals });

  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (defaultIdx < 0) {
      reset(emptyVals);
      return;
    }
    const a = shippingAddress[defaultIdx] || {};
    const coords = a.geolocation?.coordinates;
    reset({
      pincode: a.postcode ? String(a.postcode) : "",
      doorNo: a.doorNo || "",
      street: a.street || "",
      landmark: a.landmark || "",
      city: a.city || "",
      district: a.district || "",
      state: a.state || "",
      latitude: coords?.[1] ?? null,
      longitude: coords?.[0] ?? null,
    });
  }, [defaultIdx, shippingAddress, reset]);

  const lat = useWatch({ control, name: "latitude" });
  const lng = useWatch({ control, name: "longitude" });

  const handlePincodeSelect = (d: { value: number | null; status?: string; data?: any }) => {
    if (d.status === "success" && d.data) {
      setValue("pincode", d.value?.toString() || "");
      setValue("city", d.data.town || "");
      setValue("state", d.data.state || "");
      setValue("district", d.data.district || "");
    } else {
      setValue("pincode", d.value?.toString() || "");
    }
  };

  const handleMapCallback = (r: { action: string; address?: any }) => {
    if (r.action === "submit" && r.address) {
      const a = r.address;
      if (a.lat) setValue("latitude", a.lat);
      if (a.lng) setValue("longitude", a.lng);
      if (a.town) setValue("city", a.town);
      if (a.state) setValue("state", a.state);
      if (a.district) setValue("district", a.district);
      if (a.pincode) setValue("pincode", String(a.pincode));
      if (a.line1) setValue("street", a.line1);
    }
    setShowMap(false);
  };

  const onSave = handleSubmit(async (vals) => {
    if (!customer?._id) {
      appToast.show({ msg: "No customer selected", color: "error" });
      return;
    }
    if (!vals.pincode) {
      appToast.show({ msg: "Pincode is required", color: "error" });
      return;
    }
    if (!vals.doorNo) {
      appToast.show({ msg: "Door No is required", color: "error" });
      return;
    }
    if (!vals.street) {
      appToast.show({ msg: "Address is required", color: "error" });
      return;
    }
    if (vals.latitude == null || vals.longitude == null) {
      appToast.show({
        msg: "Location is required. Use 'Use Current Location' to set it.",
        color: "error",
      });
      return;
    }

    const record: AddressRecord = {
      geolocation:
        vals.latitude != null && vals.longitude != null
          ? { type: "Point", coordinates: [vals.longitude, vals.latitude] }
          : undefined,
      name: customer?.name || "",
      mobile: customer?.mobile || "",
      type: "home",
      doorNo: vals.doorNo,
      street: vals.street,
      city: vals.city,
      district: vals.district,
      state: vals.state,
      postcode: vals.pincode,
      landmark: vals.landmark || "",
      isDefault: true,
      isActive: true,
    };

    let next: AddressRecord[];
    if (shippingAddress.length === 0) {
      next = [record];
    } else {
      const targetIdx = defaultIdx >= 0 ? defaultIdx : 0;
      next = shippingAddress.map((a, i) =>
        i === targetIdx ? { ...a, ...record } : { ...a, isDefault: false },
      );
    }

    const resp = await CustomerService.updateCustomer(customer._id, {
      shippingAddress: next,
      address: {
        city: vals.city,
        district: vals.district,
        doorNo: vals.doorNo,
        postcode: vals.pincode,
        state: vals.state,
        street: vals.street,
      },
      geolocation: {
        type: "Point",
        coordinates: [vals.longitude, vals.latitude],
      },
    });

    if (resp?.statusCode === 200) {
      appToast.show({ msg: "Address saved", color: "success" });
      parent?.setValue?.("customer", { ...customer, shippingAddress: next });
      callback?.({ action: "next", data: { shippingAddress: next } });
    } else {
      appToast.show({
        msg: resp?.data?.message || "Failed to save address",
        color: "error",
      });
    }
  });

  return (
    <>
      <AppCard
        title={
          <div className="tw:flex tw:items-center tw:justify-between tw:w-full">
            <div className="tw:flex tw:items-center tw:gap-2">
              <MapPin className="tw:w-5 tw:h-5 tw:text-primary" />
              <span>{t("checkoutModal.customer.address.title", "Delivery Address")}</span>
            </div>
            <AppButton
              type="button"
              size="small"
              fill="outline"
              onClick={() => setShowMap(true)}
              className="tw:h-8 tw:px-3 tw:text-xs"
            >
              <LocationEdit className="tw:w-3.5 tw:h-3.5 tw:mr-1.5" />
              {t("checkoutModal.customer.address.useCurrentLocation", "Use Current Location")}
            </AppButton>
          </div>
        }
      >
        <div className="tw:grid tw:grid-cols-12 tw:gap-x-4 tw:gap-y-3">
          <div className="tw:col-span-12 tw:md:col-span-4">
            <AppPincodeInput
              name="pincode"
              label="Pincode"
              placeholder="Enter 6 digit pincode"
              register={register}
              onPincodeSelect={handlePincodeSelect}
              showMultipleResult={false}
              isRequired={true}
            />
          </div>
          <div className="tw:col-span-12 tw:md:col-span-8">
            <AppInput
              name="doorNo"
              register={register}
              label="Door No"
              placeholder="Door No"
              isRequired={true}
            />
          </div>

          <div className="tw:col-span-12">
            <AppInput
              name="street"
              register={register}
              label="Address"
              placeholder="Enter full address"
              isRequired={true}
            />
          </div>

          <div className="tw:col-span-12">
            <AppInput
              name="landmark"
              register={register}
              label="Landmark"
              placeholder="Landmark (optional)"
            />
          </div>

          {typeof lat === "number" && typeof lng === "number" && (
            <div className="tw:col-span-12 tw:mt-2">
              <div className="tw:flex tw:items-center tw:justify-between tw:mb-2">
                <span className="tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-wider tw:text-gray-400">
                  Location Preview
                </span>
                <span className="tw:text-[10px] tw:text-gray-400">
                  {lat.toFixed(4)}, {lng.toFixed(4)}
                </span>
              </div>
              <div className="tw:h-32 tw:bg-gray-50 tw:rounded-lg tw:border tw:border-dashed tw:border-gray-200 tw:overflow-hidden tw:relative">
                <StaticGMap
                  lat={lat}
                  lng={lng}
                  className="tw:w-full tw:h-full tw:grayscale hover:tw:grayscale-0 tw:transition-all"
                />
                <div className="tw:absolute tw:inset-0 tw:pointer-events-none tw:flex tw:items-center tw:justify-center">
                  <div className="tw:w-8 tw:h-8 tw:bg-white/80 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:shadow-sm">
                    <MapPin className="tw:w-4 tw:h-4 tw:text-primary" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="tw:flex tw:justify-between tw:gap-2 tw:mt-6">
          <AppButton
            color="light"
            fill="outline"
            onClick={() => callback?.({ action: "back" })}
          >
            <ChevronLeft />
            Back
          </AppButton>
          <AppButton color="primary" onClick={onSave} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save & Continue"}
          </AppButton>
        </div>
      </AppCard>

      <GMapLocModal
        show={showMap}
        enableGeoLoc={true}
        lat={typeof lat === "number" ? lat : undefined}
        lng={typeof lng === "number" ? lng : undefined}
        callback={handleMapCallback}
        title="Choose Location"
      />
    </>
  );
};

export default CustomerAddress;
