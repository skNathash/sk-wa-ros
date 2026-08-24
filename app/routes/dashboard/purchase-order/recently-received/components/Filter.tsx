import debounce from "lodash/debounce";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import Alpha from "~/components/core/alpha/Alpha";
import { AppInput, AppSelect } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
// defaultFilterData removed from this component; filter defaults are provided by parent

import type { DayPickerProps } from "react-day-picker";
import { Search } from "lucide-react";
import MiscService from "~/services/MiscService";
import { sub } from "date-fns";

interface FilterProps {
  onFilterChange: (value: any) => void;
  activeTab: string;
}

const dateConfig: DayPickerProps = {
  mode: "range",
  disabled: { after: new Date() },
  endMonth: new Date(),
  startMonth: sub(new Date(), { years: 10 }),
  numberOfMonths: MiscService.isMobile() ? 1 : 2,
};

const Filter = ({ onFilterChange, activeTab }: FilterProps) => {
  const { t } = useTranslation(["common"]);

  // Use form context provided by parent
  const { register, getValues, control, setValue } = useFormContext();
  const [alpha] = useWatch({ control, name: ["alpha"] });

  // Debounced search
  const debouncedSearch = debounce(() => {
    triggerCallback();
  }, 500);

  const handleSearchChange = () => {
    debouncedSearch();
  };

  const triggerCallback = () => {
    const vals = getValues();
    const { activeTab, ...rest } = vals as any;
    onFilterChange({ ...rest });
  };

  const handleDropdownChange =
    (onChange: (value: any) => void) => (value: any) => {
      onChange(value);
      triggerCallback();
    };

  const handleAlphaChange = (value: string) => {
    setValue("alpha", value);
    triggerCallback();
  };

  return (
    <div className="tw:flex tw:flex-col tw:gap-4 tw:mb-4">
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-4 tw:gap-3">
        <AppInput
          name="search"
          placeholder={
            activeTab === "by-product"
              ? t("searchByProductName")
              : activeTab === "by-vendor"
                ? "Search by Vendor Name..."
                : "Search by Box No..."
          }
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
              callback={(dt: Date | Date[]) => {
                field.onChange(dt);
                triggerCallback();
              }}
              value={field.value}
              size="sm"
              dateConfig={dateConfig}
              placeholder={t("filterByDateRange")}
              className="tw:w-full"
              hideClose={true}
            />
          )}
        />

        {/* received/status filter removed as per design */}
      </div>

      {activeTab !== "by-box" && (
        <Alpha selected={alpha} callback={handleAlphaChange} />
      )}
    </div>
  );
};

export default Filter;
