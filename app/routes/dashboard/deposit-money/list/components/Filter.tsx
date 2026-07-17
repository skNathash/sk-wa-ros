import { Controller, useForm } from "react-hook-form";
import { debounce } from "lodash";
import { useCallback } from "react";
import { AppInput, AppSelect } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import type { DayPickerProps } from "react-day-picker";
import { useTranslation } from "react-i18next";

type Props = {
  callback: (a: { formData: any }) => void;
  className?: string;
};

const dateConfig: DayPickerProps = {
  mode: "range",
};

const statusOptions = [
  { value: "All", label: "All Statuses", langKey: "all" },
  { value: "Success", label: "Success" },
  { value: "Pending", label: "Pending" },
  { value: "Failed", label: "Failed" },
];

const Filter = ({ callback, className }: Props) => {
  const { t } = useTranslation(["common"]);

  const { register, getValues, control } = useForm({
    defaultValues: {
      dateRange: [],
      search: "",
      status: "All",
    },
  });

  const triggerCallback = useCallback(() => {
    callback({ formData: getValues() });
  }, [callback, getValues]);

  const handleInput = debounce(() => {
    triggerCallback();
  }, 400);

  const handleDateChange =
    (chngFn: (value: Date[] | Date) => void) => (value: Date | Date[]) => {
      chngFn(Array.isArray(value) ? value : [value]);
      triggerCallback();
    };

  const handleStatusChange =
    (chngFn: (value: string) => void) => (value: string) => {
      chngFn(value);
      triggerCallback();
    };

  return (
    <div className={`tw:space-y-4 ${className || ""}`}>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
        <AppInput
          name="search"
          register={register}
          onChange={handleInput}
          size="sm"
          placeholder={t("searchRemarksTransaction")}
        />

        <Controller
          control={control}
          name="dateRange"
          render={({ field }) => (
            <AppDateInput
              callback={handleDateChange(field.onChange)}
              value={field.value}
              dateConfig={dateConfig}
              size="sm"
              placeholder={t("selectDateRange")}
            />
          )}
        />

        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <AppSelect
              options={statusOptions}
              value={field.value as string}
              onChange={handleStatusChange(field.onChange)}
              size="sm"
            />
          )}
        />
      </div>
    </div>
  );
};

export default Filter;
