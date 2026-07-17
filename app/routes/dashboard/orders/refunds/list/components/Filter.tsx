import { Search } from "lucide-react";
import type { DayPickerProps } from "react-day-picker";
import { Controller, useFormContext } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import { AppInput, AppSelect } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import { REFUND_STATUS_OPTIONS } from "../helper";

interface Props {
  callback: (args: { action: string; data?: Record<string, any> }) => void;
}

const dateConfig: DayPickerProps = {
  mode: "range",
};

const Filter: React.FC<Props> = ({ callback }) => {
  const { register, control, getValues } = useFormContext();

  const trigger = () => {
    callback({ action: "filter", data: getValues() });
  };

  const handleSearchChange = useDebouncedCallback(() => {
    trigger();
  }, 500);

  const onDateChange =
    (chngField: (value: any) => void) => (dt: Date | Date[]) => {
      chngField(dt);
      trigger();
    };

  const onStatusChange =
    (chngField: (value: any) => void) => (val: string) => {
      chngField(val);
      trigger();
    };

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-4 tw:gap-3 tw:mb-4">
      <div className="tw:md:col-span-2">
        <AppInput
          name="search"
          placeholder="Search by refund ID, order ref, customer name or mobile"
          register={register}
          onChange={handleSearchChange}
          leftIcon={<Search size={16} className="tw:text-slate-400" />}
          size="sm"
          className="tw:bg-white"
        />
      </div>
      <Controller
        control={control}
        name="status"
        render={({ field }) => (
          <AppSelect
            options={REFUND_STATUS_OPTIONS}
            value={field.value}
            onChange={onStatusChange(field.onChange)}
            placeholder="Status"
            size="sm"
            inputClassName="tw:w-full"
          />
        )}
      />
      <Controller
        control={control}
        name="dateRange"
        render={({ field }) => (
          <AppDateInput
            callback={onDateChange(field.onChange)}
            value={field.value}
            size="sm"
            dateConfig={dateConfig}
            placeholder="Date range"
            className="tw:w-full"
          />
        )}
      />
    </div>
  );
};

export default Filter;
