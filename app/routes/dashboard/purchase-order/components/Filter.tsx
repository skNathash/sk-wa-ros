import type { BaseOptions } from "flatpickr/dist/types/options";
import debounce from "lodash/debounce";
import { Controller, useForm } from "react-hook-form";
import { AppInput, AppSelect } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import PurchaseOrderService from "~/services/PurchaseOrderService";

interface FilterProps {
  onFilterChange: (value: any) => void;
  feature: string;
  className?: string;
}

const Filter = ({ onFilterChange, feature, className }: FilterProps) => {
  const { register, control, getValues } = useForm({
    defaultValues: {
      status: "All",
      dateRange: [],
      search: "",
    },
  });

  // Debounced search
  const debouncedSearch = debounce(() => {
    triggerCallback();
  }, 500);

  const handleSearchChange = () => {
    debouncedSearch();
  };

  const triggerCallback = () => {
    const vals = getValues();
    onFilterChange({ ...vals });
  };

  const onDateChange =
    (chngField: (value: any) => void) => (dt: Date | Date[]) => {
      chngField(dt);
      triggerCallback();
    };

  const onStatusChange = () => {
    triggerCallback();
  };

  return (
    <div className={`tw:flex tw:flex-col tw:gap-4 ${className}`}>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-4 tw:gap-3">
        <AppInput
          name="search"
          placeholder="Search by PO ID, Vendor Name..."
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

        {feature === "purchase" && (
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <AppSelect
                placeholder="Filter by Status"
                onChange={(value) => {
                  field.onChange(value);
                  onStatusChange();
                }}
                value={field.value}
                size="sm"
                options={statusOptions}
              />
            )}
          />
        )}
      </div>
    </div>
  );
};

const dateConfig: Partial<BaseOptions> = {
  mode: "range",
  maxDate: "today",
  dateFormat: "d M Y",
};

const statusOptions = PurchaseOrderService.getStatuses().map((x) => ({
  value: x.value,
  label: x.label,
}));
statusOptions.unshift({
  value: "All",
  label: "All Status",
});

export default Filter;
