import { sub } from "date-fns";
import { Controller, useFormContext } from "react-hook-form";
import type { DayPickerProps } from "react-day-picker";
import { AppSelect } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import MiscService from "~/services/MiscService";

const dateConfig: DayPickerProps = {
  mode: "range",
  disabled: { after: new Date() },
  endMonth: new Date(),
  startMonth: sub(new Date(), { years: 10 }),
  numberOfMonths: MiscService.isMobile() ? 1 : 2,
};

const statusOptions = [
  { value: "All", label: "All" },
  { value: "Success", label: "Success" },
  { value: "Failed", label: "Failed" },
];

interface FilterProps {
  callback: (a: { action: string; formData: any }) => void;
}

const Filter = ({ callback }: FilterProps) => {
  const { control } = useFormContext();

  const handleFilterChange = (name: string, value: any) => {
    callback({ action: "apply", formData: { [name]: value } });
  };

  const handleDateChange =
    (chngFn: (value: Date[] | null) => void) => (value: Date | Date[]) => {
      chngFn(Array.isArray(value) ? value : [value]);
      handleFilterChange("dateRange", value);
    };

  const handleStatusChange =
    (chngFn: (value: string) => void) => (value: string) => {
      chngFn(value);
      handleFilterChange("status", value);
    };

  return (
    <>
      <div className="tw:mb-4 tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
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

        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <AppSelect
              options={statusOptions}
              value={field.value}
              onChange={handleStatusChange(field.onChange)}
              size="sm"
              placeholder="Select status"
              inputClassName="tw:w-full"
            />
          )}
        />
      </div>
    </>
  );
};

export default Filter;
