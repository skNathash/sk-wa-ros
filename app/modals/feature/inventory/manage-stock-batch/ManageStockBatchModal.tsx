import { AppInput, AppRadio } from "~/components/core/form";
import AppModal from "~/components/core/modal/AppModal";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import { Save } from "lucide-react";
import AppDateInput from "~/components/core/form/AppDateInput";
import AppTextarea from "~/components/core/form/AppTextarea";

const types = [
  {
    label: "Correct Overall Stock Quantity",
    value: "overall",
  },
  {
    label: "Adjust Specific Batches",
    value: "batch",
  },
  {
    label: "Mark Units as Non-Sellable",
    value: "non-sellable",
  },
];

const ManageStockBatchModal = ({
  show,
  callback,
}: {
  show: boolean;
  callback: (a: { action: string }) => void;
}) => {
  const { control, handleSubmit, register } = useForm({
    defaultValues: {
      type: "overall",
      mfgDate: [new Date()],
      expDate: [new Date()],
    },
  });

  const onClose = () => {
    callback({ action: "close" });
  };

  return (
    <AppModal show={show} callback={onClose}>
      <AppModal.Title onClose={onClose}>
        <div className="tw:text-lg tw:font-semibold">Manage Stock Batch</div>
      </AppModal.Title>
      <AppModal.Content>
        <div className="tw:p-0.5">
          <div className="tw:text-sm tw:text-gray-500 tw:mb-4">
            Batch ID: 1234567890
          </div>
          <AppInput
            label="Quantity"
            name="quantity"
            register={register}
            isRequired
            className="tw:mb-4"
          />

          <Controller
            control={control}
            name="mfgDate"
            render={({ field }) => (
              <AppDateInput
                callback={field.onChange}
                value={field.value}
                label="Manufacturing Date"
                className="tw:mb-4"
              />
            )}
          />

          <Controller
            control={control}
            name="expDate"
            render={({ field }) => (
              <AppDateInput
                callback={field.onChange}
                value={field.value}
                label="Expiry Date"
                className="tw:mb-4"
              />
            )}
          />

          <AppTextarea
            label="Notes"
            name="notes"
            register={register}
            className="tw:mb-4"
          />
        </div>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-2">
          <AppButton color="light" fill="outline" onClick={onClose}>
            Cancel
          </AppButton>
          <AppButton color="dark">
            <Save /> Save Changes
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default ManageStockBatchModal;
