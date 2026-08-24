import { sub } from "date-fns";
import { Search } from "lucide-react";
import { useCallback } from "react";
import { Controller, useFormContext } from "react-hook-form";
import type { DayPickerProps } from "react-day-picker";
import { useDebouncedCallback } from "use-debounce";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppDateInput from "~/components/core/form/AppDateInput";
import { AppInput } from "~/components/core/form/AppInput";
import MiscService from "~/services/MiscService";
import { defaultFilter, type RetailerFilterForm } from "./helper";

interface FilterProps {
  // Fired whenever a field changes so the parent can sync query params
  callback: (formData: RetailerFilterForm) => void;
  className?: string;
}

const dateConfig: DayPickerProps = {
  mode: "range",
  disabled: { after: new Date() },
  endMonth: new Date(),
  startMonth: sub(new Date(), { years: 10 }),
  numberOfMonths: MiscService.isMobile() ? 1 : 2,
};

// Follow-up dates can be scheduled into the future, so no upper bound.
const followUpDateConfig: DayPickerProps = {
  mode: "range",
  numberOfMonths: MiscService.isMobile() ? 1 : 2,
};

const Filter = ({ callback, className }: FilterProps) => {
  const { control, register, getValues, setValue, reset } =
    useFormContext<RetailerFilterForm>();

  const triggerCallback = useCallback(() => {
    callback(getValues());
  }, [callback, getValues]);

  // Debounced trigger for the free-text search input.
  const debouncedTrigger = useDebouncedCallback(() => {
    triggerCallback();
  }, 400);

  const handleDateChange = (value: Date | Date[]) => {
    setValue("dateRange", Array.isArray(value) ? value : [value]);
    triggerCallback();
  };

  const handleFollowUpChange = (value: Date | Date[]) => {
    setValue("followUpRange", Array.isArray(value) ? value : [value]);
    triggerCallback();
  };

  const handleReset = () => {
    reset(defaultFilter);
    triggerCallback();
  };

  return (
    <AppCard className={className} noPadding>
      <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:px-4 tw:py-3 tw:md:grid-cols-7">
        <AppInput
          name="search"
          label="Search"
          placeholder="Search by employee name"
          register={register}
          size="sm"
          onChange={debouncedTrigger}
          leftIcon={<Search size={16} className="tw:text-gray-400" />}
          className="tw:md:col-span-2"
        />

        <Controller
          name="dateRange"
          control={control}
          render={({ field }) => (
            <AppDateInput
              label="Created On"
              size="sm"
              placeholder="Select date range"
              dateConfig={dateConfig}
              value={field.value}
              callback={handleDateChange}
              className="tw:md:col-span-2"
            />
          )}
        />

        <Controller
          name="followUpRange"
          control={control}
          render={({ field }) => (
            <AppDateInput
              label="Follow-up Date"
              size="sm"
              placeholder="Select date range"
              dateConfig={followUpDateConfig}
              value={field.value}
              callback={handleFollowUpChange}
              className="tw:md:col-span-2"
            />
          )}
        />

        <div className="tw:flex tw:items-end">
          <AppButton
            size="small"
            fill="outline"
            color="light"
            onClick={handleReset}
            className="tw:h-8"
          >
            Reset
          </AppButton>
        </div>
      </div>
    </AppCard>
  );
};

export default Filter;
