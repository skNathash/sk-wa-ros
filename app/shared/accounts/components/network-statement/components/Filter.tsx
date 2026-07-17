import { debounce } from "lodash";
import { Search } from "lucide-react";
import { useCallback } from "react";
import type { DayPickerProps } from "react-day-picker";
import { Controller, useForm } from "react-hook-form";
import { AppInput, AppSelect } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";

type Props = {
  callback: (a: { formData: any }) => void;
};

const typeOptions = [
  { label: "All", value: "All" },
  { label: "Credit", value: "credit" },
  { label: "Debit", value: "debit" },
];

const Filter = ({ callback }: Props) => {
  const { register, getValues, control } = useForm({
    defaultValues: {
      dateRange: [],
      search: "",
      type: "",
    },
  });

  const handleInput = debounce(() => {
    triggerCallback();
  }, 500);

  const handleDateChange =
    (chngFrn: (value: Date[]) => void) => (value: Date | Date[]) => {
      chngFrn(Array.isArray(value) ? value : [value]);
      triggerCallback();
    };

  const triggerCallback = useCallback(() => {
    callback({ formData: getValues() });
  }, [callback, getValues]);

  const handleTypeChange =
    (chngFrn: (value: string) => void) => (value: string) => {
      chngFrn(value);
      triggerCallback();
    };

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-2 tw:mb-4">
        <AppInput
          name="search"
          register={register}
          onChange={handleInput}
          size="sm"
          placeholder="Search on Reference ID"
          className="tw:bg-white"
          leftIcon={<Search size={16} />}
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
              placeholder="Select type"
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
    </>
  );
};

const dateConfig: DayPickerProps = {
  mode: "range",
  disabled: { after: new Date() },
  endMonth: new Date(),
  showOutsideDays: false,
};

export default Filter;
