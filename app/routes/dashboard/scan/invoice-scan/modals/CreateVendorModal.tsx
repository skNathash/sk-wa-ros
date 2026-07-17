import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import AppModal from "~/components/core/modal/AppModal";
import { AppInput, AppPincodeInput } from "~/components/core/form";
import AppButton from "~/components/core/button/AppButton";
import SdtLocation from "~/components/core/sdt/SdtLocation";
import useAppToast from "~/hooks/useAppToast";
import VendorService from "~/services/VendorService";
import AuthService from "~/services/AuthService";
import type { VendorAddress } from "../types";

interface CreateVendorFormData {
  name: string;
  gstin: string;
  doorNo: string;
  addressLine: string;
  landmark: string;
  pincode: string;
  state: string;
  district: string;
  town: string;
  mobileNumber: string;
  contactPerson: string;
}

interface CreateVendorModalProps {
  show: boolean;
  callback: (params: { action: string; data?: any }) => void;
  initialData?: {
    name?: string;
    gstin?: string;
    address?: VendorAddress;
    mobileNumber?: string;
    contactPerson?: string;
  };
}

const CreateVendorModal = ({
  show,
  callback,
  initialData,
}: CreateVendorModalProps) => {
  const appToast = useAppToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    reset,
    setValue,
    getValues,
    control,
  } = useForm<CreateVendorFormData>({
    defaultValues: {
      name: "",
      gstin: "",
      doorNo: "",
      addressLine: "",
      landmark: "",
      pincode: "",
      state: "",
      district: "",
      town: "",
      mobileNumber: "",
      contactPerson: "",
    },
  });

  const [watchedState, watchedDistrict, watchedTown] = useWatch({
    control,
    name: ["state", "district", "town"],
  });

  useEffect(() => {
    if (show) {
      const addr = initialData?.address;
      reset({
        name: initialData?.name || "",
        gstin: initialData?.gstin || "",
        doorNo: addr?.doorNo || "",
        addressLine: addr?.addressLine || addr?.street || "",
        landmark: addr?.landmark || "",
        pincode: addr?.postcode || "",
        state: addr?.state || "",
        district: addr?.district || "",
        town: addr?.town || addr?.city || "",
        mobileNumber: initialData?.mobileNumber || "",
        contactPerson: initialData?.contactPerson || "",
      });
    }
  }, [show, initialData, reset]);

  const validateForm = (
    data: CreateVendorFormData
  ): { msg: string } | null => {
    if (!data.name?.trim()) return { msg: "Vendor name is required" };
    if (!data.pincode?.trim()) return { msg: "Pincode is required" };
    if (!data.addressLine?.trim()) return { msg: "Street address is required" };
    return null;
  };

  const handlePincodeSelect = (data: {
    value: number | null;
    status?: string;
    data?: any;
  }) => {
    if (data.status === "success" && data.data) {
      setValue("pincode", data.value?.toString() || "");
      setValue("state", data.data.state || "");
      setValue("district", data.data.district || "");
      setValue("town", data.data.town || "");
    } else if (data.status === "error") {
      setValue("state", "");
      setValue("district", "");
      setValue("town", "");
    } else {
      setValue("pincode", data.value?.toString() || "");
      if (!data.value || data.value.toString().length < 6) {
        setValue("state", "");
        setValue("district", "");
        setValue("town", "");
      }
    }
  };

  const onSubmit = async () => {
    const data = getValues();
    const error = validateForm(data);
    if (error) {
      appToast.show({ msg: error.msg, color: "danger" });
      return;
    }
    setLoading(true);
    try {
      const contactObj: Record<string, any> = {
        name: data.contactPerson || data.name,
        mobile: data.mobileNumber,
        designation: "Owner",
        isOwner: true,
      };

      const payload: Record<string, any> = {
        name: data.name,
        address: {
          street: data.addressLine,
          doorNo: data.doorNo,
          district: data.district,
          city: data.town,
          town: data.town,
          state: data.state,
          postcode: data.pincode,
          landmark: data.landmark,
          addressLine: data.addressLine,
        },
        pan: "",
        gst_no: data.gstin || "",
        vendorType: "Wholesaler",
        contact: [contactObj],
        documents: [],
        franchise: {
          name: AuthService.getLoggedInUser().name,
          id: AuthService.getLoggedInUserId() || "",
        },
        sourceableBrands: [],
        sourceAllBrands: false,
        mobile: data.mobileNumber,
        geoPoint: {
          coordinates: [0, 0],
        },
      };

      const r = await VendorService.create(payload as any);
      if (r?.statusCode === 200) {
        appToast.show({ msg: "Vendor created successfully", color: "success" });
        callback({ action: "success", data: r.data });
      } else {
        appToast.show({
          msg: r?.data?.message || "Failed to create vendor",
          color: "danger",
        });
      }
    } catch (err: any) {
      appToast.show({
        msg: err?.message || "Failed to create vendor",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    callback({ action: "close" });
  };

  return (
    <AppModal
      show={show}
      callback={handleClose}
      className="tw:max-w-lg tw:h-[90vh]"
    >
      <AppModal.Title onClose={handleClose}><span className="tw:font-bold">Create Vendor</span></AppModal.Title>
      <AppModal.Content className="tw:h-[90vh]">
        <form
          id="create-vendor-form"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="tw:space-y-3"
        >
          <AppInput
            name="name"
            label="Name"
            register={register}
            isRequired
          />
          <div className="tw:grid tw:grid-cols-2 tw:gap-3">
            <AppInput
              name="gstin"
              label="GSTIN"
              register={register}
            />
            <AppInput
              name="mobileNumber"
              label="Mobile Number"
              type="tel"
              register={register}
            />
          </div>
          <AppInput
            name="contactPerson"
            label="Contact Person"
            register={register}
          />

          {/* Address Fields */}
          <div className="tw:grid tw:grid-cols-2 tw:gap-3">
            <AppPincodeInput
              name="pincode"
              label="Pincode"
              placeholder="Enter 6-digit pincode"
              register={register}
              onPincodeSelect={handlePincodeSelect}
              isRequired
            />
            <AppInput
              name="doorNo"
              label="Door No"
              placeholder="Enter door number"
              register={register}
            />
          </div>
          <AppInput
            name="addressLine"
            label="Street Address"
            placeholder="Enter street address"
            register={register}
            isRequired
          />
          <AppInput
            name="landmark"
            label="Landmark"
            placeholder="Enter nearby landmark"
            register={register}
          />
          <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-3">
            <SdtLocation
              state={watchedState}
              district={watchedDistrict}
              town={watchedTown}
              callback={({ data }) => {
                setValue("state", data.state || "");
                setValue("district", data.district || "");
                setValue("town", data.town || "");
              }}
            />
          </div>
        </form>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-2">
          <AppButton
            size="small"
            color="light"
            fill="outline"
            onClick={handleClose}
          >
            Cancel
          </AppButton>
          <AppButton
            size="small"
            color="primary"
            type="submit"
            form="create-vendor-form"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create"}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default CreateVendorModal;
