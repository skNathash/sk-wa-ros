import debounce from "lodash/debounce";
import { Search } from "lucide-react";
import type { DayPickerProps } from "react-day-picker";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AppInput, AppSelect } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import MiscService from "~/services/MiscService";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import { sub } from "date-fns";

interface FilterProps {
  onFilterChange: (value: any) => void;
  className?: string;
  feature?: string;
}

const dateConfig: DayPickerProps = {
  mode: "range",
  disabled: { after: new Date() },
  endMonth: new Date(),
  startMonth: sub(new Date(), { years: 10 }),
  numberOfMonths: MiscService.isMobile() ? 1 : 2,
};

const Filter = ({ onFilterChange, className }: FilterProps) => {
  const { t } = useTranslation(["common"]);
  const { register, control, getValues } = useFormContext();

  const purchasedFromOptions = PurchaseOrderService.getPurchasedFromOptions();

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

  return (
    <div className={`tw:flex tw:flex-col tw:gap-4 ${className || ""}`}>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-4 tw:gap-3">
        <AppInput
          name="search"
          placeholder={t("searchByBoxOrderInvoiceVendor")}
          register={register}
          onChange={handleSearchChange}
          size="sm"
          leftIcon={<Search size={16} className="tw:text-gray-500" />}
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

        {/* <Controller
          control={control}
          name="purchasedFrom"
          render={({ field }) => (
            <AppSelect
              value={field.value}
              onChange={(value) => {
                field.onChange(value);
                triggerCallback();
              }}
              options={purchasedFromOptions}
              placeholder={t("purchasedFrom")}
              size="sm"
              inputClassName="tw:w-full"
            />
          )}
        /> */}
      </div>
    </div>
  );
};

export default Filter;
