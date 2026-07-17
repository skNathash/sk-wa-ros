import { debounce } from "lodash";
import { useCallback } from "react";
import type { DayPickerProps } from "react-day-picker";
import { Controller, useForm } from "react-hook-form";
import { Search } from "lucide-react";
import AppDateInput from "~/components/core/form/AppDateInput";
import { AppInput } from "~/components/core/form/AppInput";
import { AppSelect } from "~/components/core/form";
import BarcodeScan from "~/components/core/barcode-scan/BarcodeScan";

const dateConfig: DayPickerProps = {
  mode: "range",
};

const statusOptions = [
  { label: "Pending", value: "PENDING" },
  { label: "Created", value: "CREATED" },
  { label: "Rejected", value: "REJECTED" },
];

interface FilterProps {
  callback: (data: { formData: any }) => void;
}

const Filter = ({ callback }: FilterProps) => {
  const { register, getValues, control, setValue } = useForm({
    defaultValues: {
      dateRange: [],
      search: "",
      status: "PENDING",
    },
  });

  const triggerCallback = useCallback(() => {
    callback({ formData: getValues() });
  }, [callback, getValues]);

  const handleInput = useCallback(
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

  const handleBarcodeScan = (r: { action: string; data: any }) => {
    if (r.action === "scan" && r.data) {
      setValue("search", r.data);
      triggerCallback();
    }
  };

  const handleStatus = (chngFn: (value: any) => void) => (value: any) => {
    chngFn(value);
    triggerCallback();
  };

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4 tw:mb-4">
      <AppInput
        name="search"
        register={register}
        placeholder="Search by barcode"
        onChange={handleInput}
        size="sm"
        leftIcon={<Search className="tw:text-gray-500" size={16} />}
        className="tw:bg-white"
        rightIcon={<BarcodeScan callback={handleBarcodeScan} />}
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
      <Controller
        control={control}
        name="status"
        render={({ field }) => (
          <AppSelect
            options={statusOptions}
            value={field.value}
            onChange={handleStatus(field.onChange)}
            placeholder="Status"
            size="sm"
            inputClassName="tw:bg-white tw:w-full"
          />
        )}
      />
    </div>
  );
};

export default Filter;
