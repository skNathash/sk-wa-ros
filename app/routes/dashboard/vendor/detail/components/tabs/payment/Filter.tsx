import type { BaseOptions } from "flatpickr/dist/types/options";
import debounce from "lodash/debounce";
import { Controller, useForm } from "react-hook-form";
import { AppInput, AppSelect } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";

interface FilterProps {
  callback: (params: { formData: any; action: string }) => void;
}

const dateConfig: Partial<BaseOptions> = {
  mode: "range",
  maxDate: "today",
  dateFormat: "d M Y",
};

const options = [
  { value: "All", label: "All Status" },
  { value: "Paid", label: "Paid" },
  { value: "UnPaid", label: "UnPaid" },
];

const Filter = ({ callback }: FilterProps) => {
  const { register, control, getValues } = useForm({
    defaultValues: {
      dateRange: [],
      status: "",
    },
  });

  // Debounced search
  const debouncedSearch = debounce(() => {
    triggerCallback();
  }, 500);

  const handleSearchChange = () => {
    debouncedSearch();
  };

  const triggerCallback = (action: string = "apply") => {
    const vals = getValues();
    callback({ formData: { ...vals }, action });
  };

  const onDateChange =
    (chngField: (value: any) => void) => (dt: Date | Date[]) => {
      chngField(dt);
      triggerCallback();
    };

  const onStatusChange = (value: any, chngField: (value: any) => void) => {
    chngField(value);
    triggerCallback();
  };

  return (
    <div className="tw:flex tw:flex-col tw:gap-4 tw:mb-4">
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-3">
        <AppInput
          name="search"
          placeholder="Search by PO ID"
          register={register}
          onChange={handleSearchChange}
          size="sm"
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
              placeholder="Filter by Date Range"
              className="tw:w-full"
            />
          )}
        />
        {/* Status select */}
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <AppSelect
              options={options}
              value={field.value}
              onChange={(val: any) => onStatusChange(val, field.onChange)}
              size="sm"
              placeholder="All Status"
              className="tw:w-full"
            />
          )}
        />
      </div>
    </div>
  );
};

export default Filter;
