import type { DayPickerProps } from "react-day-picker";
import { debounce } from "lodash";
import { useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import { AppInput, AppSelect } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import LoyaltyPointService from "~/services/LoyaltyPointService";

type Props = {
  callback: (a: { formData: any }) => void;
  className?: string;
};

const dateConfig: DayPickerProps = {
  mode: "range",
};

const typeOptions = LoyaltyPointService.getTransactionTypeOptions();
typeOptions.unshift({ value: "All", label: "All Types" });

const Filter = ({ callback, className }: Props) => {
  const { register, getValues, control } = useForm({
    defaultValues: {
      dateRange: [],
      search: "",
      type: "All",
    },
  });

  const triggerCallback = useCallback(() => {
    callback({ formData: getValues() });
  }, [callback, getValues]);

  const handleInput = debounce(() => {
    triggerCallback();
  }, 500);

  const handleDateChange =
    (chngFn: (value: Date[]) => void) => (value: Date | Date[]) => {
      chngFn(Array.isArray(value) ? value : [value]);
      triggerCallback();
    };

  const handleTypeChange =
    (chngFn: (value: string) => void) => (value: string) => {
      chngFn(value);
      triggerCallback();
    };

  return (
    <div className={`tw:space-y-4 ${className || ""}`}>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4 tw:mb-4">
        <AppInput
          name="search"
          register={register}
          onChange={handleInput}
          size="sm"
          placeholder="Search remarks or transaction"
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
              placeholder="Select date range"
            />
          )}
        />

        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <AppSelect
              options={typeOptions}
              value={field.value}
              onChange={handleTypeChange(field.onChange)}
              size="sm"
            />
          )}
        />
      </div>
    </div>
  );
};

export default Filter;
