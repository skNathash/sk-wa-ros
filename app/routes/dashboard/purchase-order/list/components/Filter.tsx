import type { DayPickerProps } from "react-day-picker";
import debounce from "lodash/debounce";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AppInput, AppSelect } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import PurchaseOrderService from "~/services/PurchaseOrderService";

interface FilterProps {
  onFilterChange: (value: any) => void;
  feature: string;
  className?: string;
  activeTab?: string;
}

const Filter = ({
  onFilterChange,
  feature,
  className,
  activeTab,
}: FilterProps) => {
  const { t } = useTranslation(["common"]);
  const { register, control, getValues } = useForm({
    defaultValues: {
      status: "All",
      source: "All",
      dateRange: [],
      search: "",
    },
  });

  const statusOptions = PurchaseOrderService.getStatuses()
    .map((x) => ({
      value: x.value,
      label: x.label,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
  statusOptions.unshift({
    value: "All",
    label: t("allStatus"),
  });

  const sourceOptions = PurchaseOrderService.getSourceTypes()
    .map((x) => ({
      value: x.value,
      label: x.name,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
  sourceOptions.unshift({ value: "All", label: t("all") });

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
          placeholder={t("searchByPOIdVendorName")}
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
              placeholder={t("filterByDateRange")}
              className="tw:w-full"
            />
          )}
        />

        {feature === "purchase" && activeTab !== "receive-orders" && (
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <AppSelect
                placeholder={t("filterByStatus")}
                inputClassName="tw:w-full"
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

        {feature === "purchase" && (
          <Controller
            control={control}
            name="source"
            render={({ field }) => (
              <AppSelect
                placeholder={t("filterBySource")}
                onChange={(value) => {
                  field.onChange(value);
                  triggerCallback();
                }}
                value={field.value}
                size="sm"
                options={sourceOptions}
              />
            )}
          />
        )}
      </div>
    </div>
  );
};

const dateConfig: DayPickerProps = {
  mode: "range",
};

export default Filter;
