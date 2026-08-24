import clsx from "clsx";
import { sub } from "date-fns";
import { SearchIcon } from "lucide-react";
import type { DayPickerProps } from "react-day-picker";
import { Controller, useFormContext } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import { AppInput } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import MiscService from "~/services/MiscService";

type FilterProps = {
  callback: (a: { action: string; data?: any }) => void;
  className?: string;
};

const dateConfig: DayPickerProps = {
  mode: "range",
  disabled: { after: new Date() },
  endMonth: new Date(),
  startMonth: sub(new Date(), { years: 10 }),
  numberOfMonths: MiscService.isMobile() ? 1 : 2,
};

const Filter = ({ callback, className }: FilterProps) => {
  const { control, register, getValues } = useFormContext();

  const apply = () => {
    callback({ action: "apply", data: getValues() });
  };

  const debouncedApply = useDebouncedCallback(apply, 500);

  const handleDateChange =
    (onChange: (value: Date | Date[]) => void) => (value: Date | Date[]) => {
      onChange(value);
      apply();
    };

  return (
    <div
      className={clsx(
        "tw:flex tw:flex-col tw:gap-2 tw:sm:flex-row tw:sm:items-center",
        className,
      )}
    >
      <AppInput
        name="search"
        placeholder="Search order id"
        register={register}
        onChange={debouncedApply}
        className="tw:flex-1 tw:min-w-0"
        leftIcon={<SearchIcon size={16} />}
        size="sm"
      />

      <Controller
        control={control}
        name="dateRange"
        render={({ field }) => (
          <AppDateInput
            callback={handleDateChange(field.onChange)}
            value={field.value || []}
            dateConfig={dateConfig}
            size="sm"
            placeholder="Select date range"
            className="tw:sm:w-64"
            inputClassName="tw:w-full"
          />
        )}
      />
    </div>
  );
};

export default Filter;
export type { FilterProps };
