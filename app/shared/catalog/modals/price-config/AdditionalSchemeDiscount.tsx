import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import { AppCheckbox, AppDateInput, AppInput } from "~/components/core/form";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppButton from "~/components/core/button/AppButton";
import { getPruchasePrice } from "./helper";

interface AdditionalSchemeDiscountProps {
  deal: any;
  type?: "network" | "customer";
}

const AdditionalSchemeDiscount = ({
  deal,
  type,
}: AdditionalSchemeDiscountProps) => {
  const { t } = useTranslation(["common"]);
  const {
    control,
    watch,
    register,
    formState: { errors },
  } = useFormContext();

  const enableAdditionalScheme = watch("enableAdditionalScheme");
  const additionalSchemeFromDate = watch("additionalSchemeFromDate");
  const price = watch("price");
  const additionalSchemeDiscount = watch("additionalSchemeDiscount");
  const excludeUsers = watch("excludeUsers");

  const purchasePrice = getPruchasePrice(deal, type);
  const priceAfterScheme =
    (price || 0) * (1 - (additionalSchemeDiscount || 0) / 100);
  const profitAfterScheme = priceAfterScheme - purchasePrice;

  const excludedCount = excludeUsers
    ? typeof excludeUsers === "string"
      ? excludeUsers.split(",").filter((u: string) => u.trim() !== "").length
      : Array.isArray(excludeUsers)
        ? excludeUsers.length
        : 0
    : 0;

  return (
    <div className="tw:mt-4 tw:p-4 tw:bg-slate-50 tw:rounded-lg tw:border tw:border-slate-200">
      <div className="tw:mb-3">
        <div className="tw:text-sm tw:font-bold tw:text-slate-800">
          Additional Scheme
        </div>
        <div className="tw:text-[11px] tw:text-slate-500 tw:font-normal">
          Apply extra limited-time discounts.
        </div>
      </div>
      <Controller
        name="enableAdditionalScheme"
        control={control}
        render={({ field }) => (
          <AppCheckbox
            label="Enable"
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />

      {enableAdditionalScheme && (
        <div className="tw:mt-4 tw:grid tw:grid-cols-2 tw:gap-4">
          <Controller
            name="additionalSchemeFromDate"
            control={control}
            render={({ field }) => (
              <AppDateInput
                label="From Date"
                value={field.value}
                callback={field.onChange}
                isRequired
                error={errors.additionalSchemeFromDate?.message as string}
              />
            )}
          />
          <Controller
            name="additionalSchemeToDate"
            control={control}
            render={({ field }) => (
              <AppDateInput
                label="To Date"
                value={field.value}
                callback={field.onChange}
                isRequired
                dateConfig={{
                  disabled: (date: Date) =>
                    additionalSchemeFromDate
                      ? date < additionalSchemeFromDate
                      : false,
                }}
                error={errors.additionalSchemeToDate?.message as string}
              />
            )}
          />
          <AppInput
            label="Additional Discount (%)"
            name="additionalSchemeDiscount"
            type="number"
            register={register}
            placeholder="Enter discount"
            error={errors.additionalSchemeDiscount?.message as string}
            isRequired
          />
          <div className="tw:flex tw:flex-col tw:gap-1">
            <label className="tw:text-xs tw:font-medium tw:text-slate-600">
              Exclude Users
            </label>
            <div className="tw:flex tw:items-center tw:justify-between tw:px-3 tw:py-2 tw:bg-white tw:border tw:border-slate-200 tw:rounded-md tw:h-[38px]">
              <span className="tw:text-xs tw:text-slate-700">
                {excludedCount} Users Excluded
              </span>
              <AppButton
                size="small"
                fill="clear"
                className="tw:!px-2 tw:!py-1 active:tw:scale-95"
              >
                Add
              </AppButton>
            </div>
          </div>

          <div className="tw:col-span-2 tw:bg-white tw:p-3 tw:rounded-md tw:grid tw:grid-cols-2 tw:gap-4 tw:mt-2 tw:border tw:border-slate-100">
            <KeyValue label={t("priceAfterScheme")} size="sm">
              <Amount value={priceAfterScheme} decimalPlaces={2} />
            </KeyValue>

            <KeyValue label={t("profitAfterScheme")} size="sm">
              <Amount
                value={profitAfterScheme}
                decimalPlaces={2}
                className={
                  profitAfterScheme >= 0
                    ? "tw:text-green-600"
                    : "tw:text-red-600"
                }
              />
            </KeyValue>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdditionalSchemeDiscount;
