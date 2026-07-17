import { useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { debounce } from "lodash";
import { useTranslation } from "react-i18next";
import { AppInput } from "~/components/core/form/AppInput";
import { AppSelect } from "~/components/core/form/AppSelect";
import AppDateInput from "~/components/core/form/AppDateInput";
import AuthService from "~/services/AuthService";
import type { DayPickerProps } from "react-day-picker";
import { sub } from "date-fns";
import MiscService from "~/services/MiscService";

interface FilterFormData {
  search: string;
  type: string;
  priceMode: string;
  dateRange: Date[] | undefined;
}

interface FilterProps {
  callback: (filters: { formData: FilterFormData }) => void;
}

const dateConfig: DayPickerProps = {
  mode: "range",
  disabled: { after: new Date() },
  endMonth: new Date(),
  startMonth: sub(new Date(), { years: 10 }),
  numberOfMonths: MiscService.isMobile() ? 1 : 2,
};

const Filter = ({ callback }: FilterProps) => {
  const { t } = useTranslation(["common"]);

  const defaultTypeOptions = [
    { label: t("all"), value: "All" },
    { label: t("b2bOrders"), value: "Network" },
    { label: t("b2cOrders"), value: "Customer" },
  ];

  const isBuyer = AuthService.isBuyerUser();

  const { register, getValues, control } = useForm<FilterFormData>({
    defaultValues: {
      search: "",
      type: "",
      priceMode: "all",
      dateRange: undefined,
    },
  });

  // Debounced callback for search
  const debouncedCallback = useCallback(
    debounce(() => {
      callback({ formData: getValues() });
    }, 500),
    [callback, getValues],
  );

  // Handle search input change
  const handleSearchChange = () => {
    debouncedCallback();
  };

  // Handle type selection change
  const handleTypeChange =
    (chngFn: (value: string) => void) => (value: string) => {
      chngFn(value);
      callback({ formData: getValues() });
    };

  // Handle date range change
  const handleDateRangeChange =
    (chngFn: (value: Date | Date[]) => void) => (value: Date | Date[]) => {
      chngFn(value);
      callback({ formData: getValues() });
    };

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-4 tw:gap-4 tw:mb-4">
      <AppInput
        name="search"
        placeholder={t("searchProductNameOrSku")}
        register={register}
        onChange={handleSearchChange}
        size="sm"
        className="tw:w-full"
      />

      <Controller
        name="priceMode"
        control={control}
        render={({ field }) => (
          <AppSelect
            options={[
              { label: t("all") || "All", value: "all" },
              { label: t("fixed") || "Only Fixed Price", value: "fixed" },
            ]}
            value={field.value}
            onChange={(v: string) => {
              field.onChange(v);
              callback({ formData: getValues() });
            }}
            size="sm"
            placeholder={t("select")}
            inputClassName="tw:w-full"
          />
        )}
      />

      <Controller
        name="dateRange"
        control={control}
        render={({ field }) => (
          <AppDateInput
            value={field.value}
            callback={handleDateRangeChange(field.onChange)}
            placeholder={t("selectDateRange")}
            size="sm"
            dateConfig={dateConfig}
            className="tw:w-full"
          />
        )}
      />
    </div>
  );
};

export default Filter;
