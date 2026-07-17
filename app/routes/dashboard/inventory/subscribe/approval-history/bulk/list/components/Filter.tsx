import { debounce } from "lodash";
import { useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppDateInput from "~/components/core/form/AppDateInput";
import { AppInput } from "~/components/core/form/AppInput";
import { AppSelect } from "~/components/core/form/AppSelect";
import type { DayPickerProps } from "react-day-picker";
import { Search } from "lucide-react";
import MiscService from "~/services/MiscService";
import { sub } from "date-fns";

interface FilterFormData {
  search: string;
  dateRange: Date[] | null;
  status: string;
}

interface FilterProps {
  callback: (filters: { formData: FilterFormData }) => void;
  className?: string;
}

const dateConfig: DayPickerProps = {
  mode: "range",
  disabled: { after: new Date() },
  endMonth: new Date(),
  startMonth: sub(new Date(), { years: 10 }),
  numberOfMonths: MiscService.isMobile() ? 1 : 2,
};

const Filter = ({ callback, className }: FilterProps) => {
  const { t } = useTranslation(["common"]);

  const statusOptions = [
    { value: "All", label: "All" },
    { value: "Approved", label: "Approved" },
    { value: "Rejected", label: "Rejected" },
    { value: "Pending", label: "Pending" },
  ];
  const { control, setValue, getValues, register } = useForm<FilterFormData>({
    defaultValues: {
      search: "",
      dateRange: null,
      status: "",
    },
  });

  // Trigger callback function
  const triggerCallback = () => {
    callback({ formData: getValues() });
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(() => {
      triggerCallback();
    }, 500),
    [triggerCallback]
  );

  // Handle status change
  const handleStatusChange = (chngFn: any) => (value: string) => {
    chngFn(value);
    triggerCallback();
  };

  // Handle date range change
  const handleDateRangeChange = (dates: Date | Date[]) => {
    if (Array.isArray(dates)) {
      setValue("dateRange", dates.length > 0 ? dates : null);
    } else {
      setValue("dateRange", dates ? [dates] : null);
    }
    triggerCallback();
  };

  return (
    <div className={className || ""}>
      <div className="tw:grid tw:gap-2 tw:grid-cols-1 tw:md:grid-cols-3">
        {/* Search Input */}
        <div>
          <AppInput
            name="search"
            placeholder={t("searchByFileName")}
            register={register}
            onChange={debouncedSearch}
            className="tw:w-full tw:bg-white"
            size="sm"
            leftIcon={<Search size={16} className="tw:text-gray-500" />}
          />
        </div>

        {/* Date Range Input */}
        <div>
          <AppDateInput
            placeholder={t("selectDateRange")}
            callback={handleDateRangeChange}
            value={getValues("dateRange") || undefined}
            dateConfig={dateConfig}
            size="sm"
            className="tw:w-full tw:bg-white"
          />
        </div>

        {/* Status Select */}
        <div>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <AppSelect
                options={statusOptions}
                placeholder={t("selectStatus")}
                onChange={handleStatusChange(field.onChange)}
                value={field.value}
                inputClassName="tw:w-full tw:bg-white"
                size="sm"
              />
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default Filter;
