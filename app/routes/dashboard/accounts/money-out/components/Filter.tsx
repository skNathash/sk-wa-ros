import { debounce } from "lodash";
import { FilterIcon, SearchIcon } from "lucide-react";
import { useCallback } from "react";
import { Controller, useFormContext } from "react-hook-form";
import type { DayPickerProps } from "react-day-picker";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import { AppDateInput, AppInput } from "~/components/core/form";
import type { PaymentToolbarForm } from "../helper";

const dateConfig: DayPickerProps = {
  mode: "range",
  disabled: { after: new Date() },
  endMonth: new Date(),
  showOutsideDays: false,
};

type FilterProps = {
  /** Every change hands the whole form up; the page owns what to do with it. */
  callback: (payload: { action: string; data: PaymentToolbarForm }) => void;
};

/**
 * How the payables list is narrowed — free text, a date window, and the door to
 * the advanced filters. The form lives in the parent's context, so `getValues()`
 * always carries the latest of every field.
 */
const Filter = ({ callback }: FilterProps) => {
  const { t } = useTranslation(["common"]);
  const { register, control, getValues, setValue } =
    useFormContext<PaymentToolbarForm>();

  const notifyParent = useCallback(
    (action: string) => callback({ action, data: getValues() }),
    [callback, getValues],
  );

  const debounceSearch = useCallback(
    debounce(() => notifyParent("search"), 500),
    [notifyParent],
  );

  const handleDateChange = useCallback(
    (value: Date | Date[]) => {
      setValue("dateRange", Array.isArray(value) ? value : [value]);
      notifyParent("dateRange");
    },
    [setValue, notifyParent],
  );

  return (
    <>
      <AppInput
        name="search"
        register={register}
        onChange={debounceSearch}
        placeholder={t("searchVendorInvoicePo")}
        className="tw:min-w-0 tw:flex-1"
        inputClassName="tw:placeholder:text-xs tw:placeholder:md:text-sm"
        leftIcon={<SearchIcon size={16} className="tw:text-gray-500" />}
      />

      <Controller
        control={control}
        name="dateRange"
        render={({ field }) => (
          <AppDateInput
            callback={handleDateChange}
            value={field.value}
            dateConfig={dateConfig}
            placeholder={t("dateRange")}
            className="tw:w-full tw:sm:w-56"
          />
        )}
      />

      <AppButton
        fill="outline"
        color="light"
        className="tw:shrink-0"
        onClick={() => notifyParent("filter")}
      >
        <FilterIcon size={16} />
        {t("filter")}
      </AppButton>
    </>
  );
};

export default Filter;
