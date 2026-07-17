import { debounce } from "lodash";
import { useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import { Search } from "lucide-react";
import type { DayPickerProps } from "react-day-picker";
import { AppInput } from "~/components/core/form/AppInput";
import { AppSelect } from "~/components/core/form/AppSelect";
import AppDateInput from "~/components/core/form/AppDateInput";

import { STATUS_OPTIONS, type StatusFilter } from "../helper";

const DATE_CONFIG: DayPickerProps = {
  mode: "range",
};

interface FilterFormData {
  search: string;
  status: StatusFilter;
  dateRange: Date[];
}

interface FilterProps {
  callback: (filters: { formData: FilterFormData }) => void;
  defaultValue?: string;
  defaultStatus?: StatusFilter;
  defaultDateRange?: Date[];
  className?: string;
}

const Filter = ({
  callback,
  defaultValue = "",
  defaultStatus = "all",
  defaultDateRange = [],
  className,
}: FilterProps) => {
  const { getValues, register, control } = useForm<FilterFormData>({
    defaultValues: {
      search: defaultValue,
      status: defaultStatus,
      dateRange: defaultDateRange,
    },
  });

  // Trigger callback function with the current search + status + date range.
  const triggerCallback = useCallback(() => {
    callback({ formData: getValues() });
  }, [callback, getValues]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(() => {
      triggerCallback();
    }, 500),
    [triggerCallback],
  );

  const handleStatusChange =
    (onChange: (value: StatusFilter) => void) => (value: string) => {
      onChange(value as StatusFilter);
      triggerCallback();
    };

  const handleDateChange =
    (onChange: (value: Date[]) => void) => (dt: Date | Date[]) => {
      onChange(Array.isArray(dt) ? dt : [dt]);
      triggerCallback();
    };

  return (
    <div className={className || ""}>
      <div className="tw:flex tw:flex-col tw:gap-2 tw:sm:flex-row tw:sm:items-center">
        <div className="tw:relative tw:flex-1">
          <AppInput
            name="search"
            placeholder="Search by barcode..."
            register={register}
            onChange={debouncedSearch}
            className="tw:w-full tw:bg-white"
            size="sm"
            leftIcon={<Search size={16} className="tw:text-gray-500" />}
          />
        </div>
        <Controller
          control={control}
          name="dateRange"
          render={({ field }) => (
            <AppDateInput
              callback={handleDateChange(field.onChange)}
              value={field.value}
              size="sm"
              dateConfig={DATE_CONFIG}
              placeholder="Filter by date range"
              className="tw:w-full tw:sm:w-56 tw:shrink-0"
              inputClassName="tw:bg-white"
            />
          )}
        />
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <AppSelect
              options={STATUS_OPTIONS}
              value={field.value}
              onChange={handleStatusChange(field.onChange)}
              size="sm"
              inputClassName="tw:bg-white tw:w-full tw:lg:w-44"
            />
          )}
        />
      </div>
    </div>
  );
};

export default Filter;
