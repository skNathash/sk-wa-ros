import { useFormContext, Controller, useWatch } from "react-hook-form";
import { AppInput } from "~/components/core/form/AppInput";
import AppSelect from "~/components/core/form/AppSelect";
import AppTextarea from "~/components/core/form/AppTextarea";
import AppDateInput from "~/components/core/form/AppDateInput";
import FileUpload from "~/components/core/file-upload/FileUpload";
import FileUploadedSlide from "~/components/core/file-upload/FileUploadedSlide";
import { sub } from "date-fns";
import type { DayPickerProps } from "react-day-picker";

const paymentMethodOptions = [
  { value: "Cash", label: "Cash" },
  // { value: "Bank", label: "Bank" },
  { value: "Cheque", label: "Cheque" },
  { value: "UPI", label: "UPI" },
  // Add more as needed
];

const paymentDateConfig: DayPickerProps = {
  defaultMonth: new Date(),
  disabled: { after: new Date() },
  endMonth: new Date(),
  startMonth: sub(new Date(), { months: 4 }),
};

const VendorPaymentForm = () => {
  const {
    control,
    register,
    formState: { errors },
    setValue,
    getValues,
  } = useFormContext();

  const [proofs] = useWatch({
    control,
    name: ["proofs"],
  });

  const onPaymentFileUpload = (response: any) => {
    setValue("proofs", [...(proofs || []), { id: response._id }]);
  };

  const onPaymentFileRemove = (index: number) => {
    const proofs = getValues("proofs");
    setValue(
      "proofs",
      proofs.filter((_: any, i: number) => i !== index)
    );
  };

  return (
    <div className="tw:space-y-2 tw:grid tw:grid-cols-2 tw:gap-4">
      {/* Payment Method */}
      <Controller
        name="paymentMethod"
        control={control}
        rules={{ required: "Payment method is required" }}
        render={({ field }) => (
          <AppSelect
            label="Payment Method"
            options={paymentMethodOptions}
            isRequired
            value={field.value}
            onChange={field.onChange}
            inputClassName="tw:w-full"
          />
        )}
      />

      {/* Payment Date */}
      <Controller
        name="paymentDate"
        control={control}
        rules={{ required: "Payment date is required" }}
        render={({ field }) => (
          <AppDateInput
            label="Payment Date"
            value={field.value}
            callback={field.onChange}
            isRequired
            dateConfig={paymentDateConfig}
          />
        )}
      />

      {/* Reference Number */}

      <AppInput
        name="paymentRefNo"
        label="Reference Number"
        type="text"
        register={register}
        className="tw:col-span-2"
      />

      {/* Notes */}
      <AppTextarea
        name="notes"
        label="Notes"
        register={register}
        className="tw:col-span-2"
        rows={3}
      />

      <div className="tw:col-span-2">
        <FileUpload
          label="Upload Payment Proof"
          onFileUpload={onPaymentFileUpload}
          allowedExtensions={["jpg", "jpeg", "png"]}
          note={<span>Only JPG, JPEG or PNG files are allowed.</span>}
        />
        <FileUploadedSlide images={proofs} onRemove={onPaymentFileRemove} />
      </div>
    </div>
  );
};

export default VendorPaymentForm;
