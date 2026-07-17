import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import { AppInput } from "~/components/core/form/AppInput";
import AppSelect from "~/components/core/form/AppSelect";
import AppTextarea from "~/components/core/form/AppTextarea";

const PAYMENT_OPTIONS = [
  { value: "Select", label: "Select Payment Method" },
  { value: "upi", label: "UPI" },
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
  { value: "bank_transfer", label: "Bank Transfer" },
];

const TransactionDetails: React.FC = () => {
  const { t } = useTranslation();
  const { control, register } = useFormContext();

  return (
    <AppCard
      title={"3. Transaction Details"}
      className="tw:mb-0"
      subtitle={"Add payment reference and notes"}
    >
      <div className="tw:mt-4">
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
          <Controller
            control={control}
            name="paymentMethod"
            render={({ field }) => (
              <AppSelect
                label={t("paymentMethod")}
                options={PAYMENT_OPTIONS}
                placeholder={t("selectPaymentMethod")}
                value={field.value}
                onChange={(val) => field.onChange(val)}
                inputClassName="tw:w-full"
                isRequired={true}
              />
            )}
          />

          <AppInput
            label={t("referenceOrTransactionId")}
            name="referenceId"
            placeholder={t("enterReferenceOrTransactionId")}
            register={register}
            className="tw:mt-0 tw:w-full"
          />
        </div>

        <div className="tw:mt-3">
          <AppTextarea
            label={t("notes")}
            name="notes"
            placeholder={t("enterNotes")}
            register={register}
            rows={3}
            className="tw:w-full"
          />
        </div>
      </div>
    </AppCard>
  );
};

export default TransactionDetails;
