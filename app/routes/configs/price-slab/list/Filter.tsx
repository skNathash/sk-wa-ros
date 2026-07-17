import debounce from "lodash/debounce";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { AppInput, AppSelect } from "~/components/core/form";
import { useCallback, useEffect, useMemo } from "react";
import { Search } from "lucide-react";
import type { DayPickerProps } from "react-day-picker";
import AppDateInput from "~/components/core/form/AppDateInput";
import { sub } from "date-fns";
import MiscService from "~/services/MiscService";

type Props = {
  callback: (payload: { formData: any }) => void;
};

const statusOptions = [
  { label: "All", value: "All" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const Filter = ({ callback }: Props) => {
  const { register, control, getValues } = useFormContext();

  const [search] = useWatch({ name: ["search"], control });

  const triggerCallback = useCallback(() => {
    callback({ formData: getValues() });
  }, [callback, getValues]);

  const handleSearchChange = useCallback(
    debounce(() => {
      triggerCallback();
    }, 500),
    [triggerCallback],
  );

  const handleStatusChange = (ch: (v: string) => void) => (val: string) => {
    ch(val);
    triggerCallback();
  };

  const handleDateChange =
    (chngFn: (value: Date[]) => void) => (value: Date | Date[]) => {
      chngFn(Array.isArray(value) ? value : [value]);
      triggerCallback();
    };

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-2 tw:mb-4">
      <AppInput
        name="search"
        register={register}
        onChange={handleSearchChange}
        size="sm"
        placeholder="Search by name"
        className="tw:bg-white"
        leftIcon={<Search size={16} className="tw:text-gray-400" />}
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
            className="tw:bg-white"
          />
        )}
      />

      <Controller
        control={control}
        name="dateRange"
        render={({ field }) => (
          <AppDateInput
            callback={handleDateChange(field.onChange)}
            value={field.value}
            dateConfig={dateConfig}
            placeholder="Select date range"
            size="sm"
          />
        )}
      />
    </div>
  );
};

const dateConfig: DayPickerProps = {
  mode: "range",
  disabled: { after: new Date() },
  endMonth: new Date(),
  startMonth: sub(new Date(), { years: 10 }),
  numberOfMonths: MiscService.isMobile() ? 1 : 2,
};

export default Filter;
