import debounce from "lodash/debounce";
import { Search } from "lucide-react";
import type { DayPickerProps } from "react-day-picker";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AppInput, AppSelect } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import PurchaseOrderService from "~/services/PurchaseOrderService";

interface FilterProps {
  callback: (params: { formData: any; action: string }) => void;
}

const dateConfig: DayPickerProps = {
  mode: "range",
};

const Filter = ({ callback }: FilterProps) => {
  const { t } = useTranslation(["common"]);

  const statusOptions = PurchaseOrderService.getStatuses().map((x) => ({
    value: x.value,
    label: x.label,
  }));
  statusOptions.unshift({ value: "All", label: t("allStatus") });

  const { register, control, getValues } = useForm({
    defaultValues: {
      dateRange: [],
      status: "All",
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
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-2">
        <AppInput
          name="search"
          placeholder={t("searchByPOId")}
          register={register}
          onChange={handleSearchChange}
          size="sm"
          leftIcon={<Search className="tw:text-gray-400" size={16} />}
          className="tw:w-full"
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
              className="tw:w-full tw:flex-1 tw:md:flex-auto"
            />
          )}
        />
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <AppSelect
              placeholder={t("filterByStatus")}
              onChange={(value) => onStatusChange(value, field.onChange)}
              value={field.value}
              size="sm"
              options={statusOptions}
              inputClassName="tw:w-full"
            />
          )}
        />
      </div>
    </div>
  );
};

export default Filter;
