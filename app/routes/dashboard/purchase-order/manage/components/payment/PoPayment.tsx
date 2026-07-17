import { Controller, useFormContext } from "react-hook-form";
import AppSelect from "~/components/core/form/AppSelect";

import AppDateInput from "~/components/core/form/AppDateInput";
import { AppInput } from "~/components/core/form/AppInput";
import AppCard from "~/components/core/card/AppCard";

const paymentStatusOptions = [
  { value: "Choose", label: "Choose Payment Status" },
  { value: "Pending", label: "Not yet paid" },
  { value: "Paid", label: "Already paid" },
  { value: "Partially Paid", label: "Partially paid" },
];

const paymentMethodOptions = [
  { value: "Choose", label: "Choose Payment Method" },
  { value: "Cash", label: "Cash" },
  { value: "Card", label: "Card" },
  { value: "UPI", label: "UPI" },
];

const PoPayment = () => {
  const {
    control,
    register,
    watch,
    formState: { errors },
  } = useFormContext();
  const paymentStatus = watch("paymentStatus");

  return (
    <AppCard
      className="tw:space-y-4"
      title="Payment Details"
      subtitle="Manage payment information for this purchase order"
    >
      {/* Payment Status Dropdown */}
      <Controller
        name="paymentStatus"
        control={control}
        render={({ field }) => (
          <AppSelect
            label="Payment Status"
            options={paymentStatusOptions}
            isRequired
            value={field.value}
            onChange={field.onChange}
            inputClassName="tw:w-full tw:bg-white tw:mb-4"
          />
        )}
      />

      {/* Show below fields only if status is paid or partial */}
      {(paymentStatus === "Paid" || paymentStatus === "Partially Paid") && (
        <div className="tw:bg-green-50 tw:border-green-200 tw:rounded-md tw:p-4 tw:space-y-4">
          <div className="tw:grid tw:gap-4 tw:grid-cols-1 tw:md:grid-cols-3">
            {/* Payment Method */}
            <div>
              <Controller
                name="paymentMethod"
                control={control}
                render={({ field }) => (
                  <AppSelect
                    label="Payment Method"
                    options={paymentMethodOptions}
                    isRequired
                    value={field.value}
                    onChange={field.onChange}
                    inputClassName="tw:w-full tw:bg-white"
                  />
                )}
              />
            </div>
            {/* Payment Date */}
            <div>
              <Controller
                name="paymentDate"
                control={control}
                render={({ field }) => (
                  <AppDateInput
                    label="Payment Date"
                    value={field.value}
                    callback={field.onChange}
                    isRequired
                  />
                )}
              />
            </div>
            {/* Payment Reference Number */}
            <div>
              <AppInput
                name="paymentReference"
                label="Payment Reference Number"
                register={register}
                isRequired
                inputClassName="tw:bg-white"
              />
            </div>
            {/* Payment Notes - full width on desktop */}
            <div className="tw:md:col-span-3">
              <AppInput
                name="paymentNotes"
                label="Payment Notes"
                register={register}
                type="text"
                inputClassName="tw:bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </AppCard>
  );
};

export default PoPayment;
