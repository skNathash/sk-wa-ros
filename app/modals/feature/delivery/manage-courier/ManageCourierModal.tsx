import { Controller, useForm } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import { AppInput, AppSelect } from "~/components/core/form";
import AppModal from "~/components/core/modal/AppModal";

const statusOptions = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Suspended", value: "suspended" },
];

const paymentTermsOptions = [
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Quarterly", value: "quarterly" },
  { label: "Yearly", value: "yearly" },
];

const ManageCourierModal = ({
  show,
  callback,
  courier,
}: {
  show: boolean;
  callback: (a: { action: string }) => void;
  courier?: any;
}) => {
  const { register, handleSubmit, control } = useForm();

  const handleClose = () => {
    callback({ action: "close" });
  };

  return (
    <AppModal
      show={show}
      callback={handleClose}
      className="tw:max-w-2xl tw:h-[95vh]"
    >
      <AppModal.Title onClose={handleClose}>
        <div className="tw:text-lg tw:font-semibold">
          {courier ? "Edit Courier" : "Add New Courier"}
        </div>
        <div className="tw:text-sm tw:text-gray-500 tw:mt-1">
          Manage courier details, KYC, and vehicle information.
        </div>
      </AppModal.Title>

      <AppModal.Content className="tw:max-h-[80vh]">
        <div className="tw:grid tw:gird-cols-1 tw:md:grid-cols-2 tw:gap-4 tw:px-0.5">
          <AppInput
            name="name"
            label="Name"
            register={register}
            className="tw:mb-2"
            isRequired
          />

          <AppInput
            name="code"
            label="Agency Code"
            register={register}
            isRequired
            className="tw:mb-2"
          />

          <AppInput
            name="personName"
            label="Contact Person Name"
            register={register}
            isRequired
            className="tw:mb-2"
          />

          <AppInput
            name="phone"
            label="Contact Person Phone"
            register={register}
            isRequired
            className="tw:mb-2"
          />

          <AppInput
            name="email"
            label="Contact Person Email"
            register={register}
            className="tw:mb-2 tw:col-span-2"
          />

          <AppInput
            name="address"
            label="Address"
            register={register}
            className="tw:mb-2 tw:col-span-2"
          />

          <AppInput
            name="pincode"
            label="Pincode"
            register={register}
            className="tw:mb-2"
          />

          <AppInput
            name="city"
            label="City"
            register={register}
            className="tw:mb-2"
          />

          <AppInput
            name="businessLicense"
            label="Business License"
            register={register}
            className="tw:mb-2"
          />

          <AppInput
            name="gstNo"
            label="GST No"
            register={register}
            className="tw:mb-2"
          />

          <AppInput
            name="fixedRate"
            label="Fixed Rate per Delivery"
            register={register}
            className="tw:mb-2"
          />

          <AppInput
            name="commissionRate"
            label="Commission Rate(%)"
            register={register}
            className="tw:mb-2"
          />

          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <AppSelect
                label="Status"
                options={statusOptions}
                value={field.value}
                onChange={field.onChange}
                className="tw:mb-2"
                inputClassName="tw:w-full"
                placeholder="Select Status"
              />
            )}
          />

          <Controller
            control={control}
            name="paymentTerms"
            render={({ field }) => (
              <AppSelect
                label="Payment Terms"
                options={paymentTermsOptions}
                value={field.value}
                onChange={field.onChange}
                className="tw:mb-2"
                inputClassName="tw:w-full"
                placeholder="Select Payment Terms"
              />
            )}
          />
        </div>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-2">
          <AppButton color="light" fill="outline" onClick={handleClose}>
            Cancel
          </AppButton>
          <AppButton color="dark">Save</AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default ManageCourierModal;
