import { debounce } from "lodash";
import { useCallback } from "react";
import type { DayPickerProps } from "react-day-picker";
import { Controller, useFormContext } from "react-hook-form";
import { AppInput } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";

type Props = {
  callback: (a: { formData: any }) => void;
  showDateRange?: boolean;
};

const Filter = ({ callback, showDateRange = true }: Props) => {
  const { register, getValues, control } = useFormContext();

  const triggerCallback = useCallback(() => {
    callback({ formData: getValues() });
  }, [callback, getValues]);

  const handleInput = debounce(() => {
    triggerCallback();
  }, 500);

  const handleDateChange =
    (onChange: (value: Date[]) => void) => (value: Date | Date[]) => {
      onChange(Array.isArray(value) ? value : [value]);
      triggerCallback();
    };

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4 tw:mb-4 tw:mt-2">
      <AppInput
        name="search"
        register={register}
        onChange={handleInput}
        size="sm"
        placeholder="Search by Receipt ID or PO ID"
        className="tw:bg-white"
      />
      {showDateRange && (
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
              hideClose={true}
            />
          )}
        />
      )}
    </div>
  );
};

const dateConfig: DayPickerProps = {
  mode: "range",
};

export default Filter;
