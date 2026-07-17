import { useEffect } from "react";
import { useForm } from "react-hook-form";
import AppModal from "~/components/core/modal/AppModal";
import { AppInput } from "~/components/core/form/AppInput";
import AppButton from "~/components/core/button/AppButton";
import type { InvoiceBuyer, BuyerFormData, VendorAddress } from "../types";

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
  addressLine: string;
  mobileNumber: string;
  contactPerson: string;
}

interface EditBuyerModalProps {
  show: boolean;
  buyer: InvoiceBuyer;
  callback: (params: { action: string; data?: BuyerFormData }) => void;
}

const EditBuyerModal = ({ show, buyer, callback }: EditBuyerModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormShape>({
    defaultValues: {
      name: buyer.name,
      gstin: buyer.gstin,
      addressLine: buyer.address?.addressLine || "",
      mobileNumber: buyer.mobileNumber,
      contactPerson: buyer.contactPerson,
    },
  });

  useEffect(() => {
    if (show) {
      reset({
        name: buyer.name,
        gstin: buyer.gstin,
        addressLine: buyer.address?.addressLine || "",
        mobileNumber: buyer.mobileNumber,
        contactPerson: buyer.contactPerson,
      });
    }
  }, [show, buyer, reset]);

  const onSubmit = (data: FormShape) => {
    const payload: BuyerFormData = {
      name: data.name,
      gstin: data.gstin,
      address: {
        ...(buyer.address || emptyAddress()),
        addressLine: data.addressLine,
      },
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
      <AppModal.Title onClose={handleClose}>Edit Buyer</AppModal.Title>
      <AppModal.Content>
        <form
          id="edit-buyer-form"
          onSubmit={handleSubmit(onSubmit)}
          className="tw:space-y-3"
        >
          <AppInput
            name="name"
            label="Name"
            register={register}
            rules={{ required: "Buyer name is required" }}
            error={errors.name?.message}
            isRequired
          />
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
          <AppInput
            name="contactPerson"
            label="Contact Person"
            register={register}
            error={errors.contactPerson?.message}
          />
          <AppInput
            name="addressLine"
            label="Address"
            register={register}
            error={errors.addressLine?.message}
          />
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
            form="edit-buyer-form"
          >
            Save
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default EditBuyerModal;
