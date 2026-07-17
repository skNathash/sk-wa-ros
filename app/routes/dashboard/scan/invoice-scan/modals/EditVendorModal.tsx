import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import AppModal from "~/components/core/modal/AppModal";
import { AppInput, AppPincodeInput } from "~/components/core/form";
import AppButton from "~/components/core/button/AppButton";
import SdtLocation from "~/components/core/sdt/SdtLocation";
import type { InvoiceVendor, VendorAddress, VendorFormData } from "../types";

const emptyAddress = (): VendorAddress => ({
  addressLine: "",
  doorNo: "",
  street: "",
  landmark: "",
  city: "",
  town: "",
  district: "",
  state: "",
  postcode: "",
});

interface FormShape {
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

interface EditVendorModalProps {
  show: boolean;
  vendor: InvoiceVendor;
  callback: (params: { action: string; data?: VendorFormData }) => void;
}

const EditVendorModal = ({ show, vendor, callback }: EditVendorModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormShape>({
    defaultValues: {
      name: vendor.name,
      gstin: vendor.gstin,
      doorNo: vendor.address?.doorNo || "",
      addressLine: vendor.address?.addressLine || vendor.address?.street || "",
      landmark: vendor.address?.landmark || "",
      pincode: vendor.address?.postcode || "",
      state: vendor.address?.state || "",
      district: vendor.address?.district || "",
      town: vendor.address?.town || "",
      mobileNumber: vendor.mobileNumber,
      contactPerson: vendor.contactPerson,
    },
  });

  const [watchedState, watchedDistrict, watchedTown] = useWatch({
    control,
    name: ["state", "district", "town"],
  });

  useEffect(() => {
    if (show) {
      reset({
        name: vendor.name,
        gstin: vendor.gstin,
        doorNo: vendor.address?.doorNo || "",
        addressLine: vendor.address?.addressLine || vendor.address?.street || "",
        landmark: vendor.address?.landmark || "",
        pincode: vendor.address?.postcode || "",
        state: vendor.address?.state || "",
        district: vendor.address?.district || "",
        town: vendor.address?.town || "",
        mobileNumber: vendor.mobileNumber,
        contactPerson: vendor.contactPerson,
      });
    }
  }, [show, vendor, reset]);

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

  const onSubmit = (data: FormShape) => {
    const address: VendorAddress = {
      ...(vendor.address || emptyAddress()),
      doorNo: data.doorNo,
      addressLine: data.addressLine,
      street: data.addressLine,
      landmark: data.landmark,
      postcode: data.pincode,
      state: data.state,
      district: data.district,
      town: data.town,
    };
    const payload: VendorFormData = {
      name: data.name,
      gstin: data.gstin,
      address,
      mobileNumber: data.mobileNumber,
      contactPerson: data.contactPerson,
    };
    callback({ action: "submit", data: payload });
  };

  const handleClose = () => {
    callback({ action: "close" });
  };

  return (
    <AppModal show={show} callback={handleClose} className="tw:max-w-lg">
      <AppModal.Title onClose={handleClose}><span className="tw:font-bold">Edit Vendor</span></AppModal.Title>
      <AppModal.Content>
        <form
          id="edit-vendor-form"
          onSubmit={handleSubmit(onSubmit)}
          className="tw:space-y-3"
        >
          <AppInput
            name="name"
            label="Name"
            register={register}
            rules={{ required: "Vendor name is required" }}
            error={errors.name?.message}
            isRequired
          />
          <div className="tw:grid tw:grid-cols-2 tw:gap-3">
            <AppInput
              name="gstin"
              label="GSTIN"
              register={register}
              error={errors.gstin?.message}
            />
            <AppInput
              name="mobileNumber"
              label="Mobile Number"
              type="tel"
              register={register}
              error={errors.mobileNumber?.message}
            />
          </div>
          <AppInput
            name="contactPerson"
            label="Contact Person"
            register={register}
            error={errors.contactPerson?.message}
          />

          {/* Address Fields */}
          <div className="tw:grid tw:grid-cols-2 tw:gap-3">
            <AppPincodeInput
              name="pincode"
              label="Pincode"
              placeholder="Enter 6-digit pincode"
              register={register}
              error={errors.pincode?.message}
              onPincodeSelect={handlePincodeSelect}
              isRequired
            />
            <AppInput
              name="doorNo"
              label="Door No"
              placeholder="Enter door number"
              register={register}
              error={errors.doorNo?.message}
            />
          </div>
          <AppInput
            name="addressLine"
            label="Street Address"
            placeholder="Enter street address"
            register={register}
            error={errors.addressLine?.message}
            isRequired
          />
          <AppInput
            name="landmark"
            label="Landmark"
            placeholder="Enter nearby landmark"
            register={register}
            error={errors.landmark?.message}
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
          <AppButton size="small" color="light" onClick={handleClose}>
            Cancel
          </AppButton>
          <AppButton
            size="small"
            color="primary"
            type="submit"
            form="edit-vendor-form"
          >
            Save
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default EditVendorModal;
