import { debounce } from "lodash";
import { useCallback } from "react";
import type { DayPickerProps } from "react-day-picker";
import { Controller, useFormContext } from "react-hook-form";
import { AppInput } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";

const dateConfig: DayPickerProps = {
  mode: "range",
};

const Filter = ({ callback }: { callback: (data: any) => void }) => {
  // Use the form provided via FormProvider from the parent so parent can set values
  const { register, getValues, control } = useFormContext();

  const triggerCallback = useCallback(() => {
    callback({ formData: getValues() });
  }, [callback, getValues]);

  const handleSearchChange = useCallback(
    debounce(() => {
      triggerCallback();
    }, 500),
    [triggerCallback]
  );

  const handleDateChange =
    (chngFn: (value: Date[]) => void) => (value: Date | Date[]) => {
      chngFn(Array.isArray(value) ? value : [value]);
      triggerCallback();
    };

  return (
    <div className="tw:mb-4 tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
      <AppInput
        name="search"
        placeholder="Search by Vendor Name"
        register={register}
        onChange={handleSearchChange}
        size="sm"
      />

      <Controller
        control={control}
        name="dateRange"
        render={({ field }) => (
          <AppDateInput
            value={field.value}
            placeholder="Filter by Date Range"
            size="sm"
            callback={handleDateChange(field.onChange)}
            hideClose={true}
            dateConfig={dateConfig}
          />
        )}
      />
    </div>
  );
};

export default Filter;
