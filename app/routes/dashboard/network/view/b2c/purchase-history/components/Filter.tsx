import type { DayPickerProps } from "react-day-picker";
import { debounce } from "lodash";
import { useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import { AppInput } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import { Search } from "lucide-react";

type Props = {
  callback: (a: { formData: any }) => void;
  className?: string;
};

const dateConfig: DayPickerProps = {
  mode: "range",
};

const Filter = ({ callback, className }: Props) => {
  const { register, getValues, control, setValue } = useForm({
    defaultValues: {
      dateRange: [],
      search: "",
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

  return (
    <div className={`tw:space-y-4 ${className || ""}`}>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4 tw:mb-4">
        <AppInput
          name="search"
          register={register}
          onChange={handleInput}
          size="sm"
          placeholder="Search on Order ID"
          leftIcon={<Search />}
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
      </div>
    </div>
  );
};

export default Filter;
