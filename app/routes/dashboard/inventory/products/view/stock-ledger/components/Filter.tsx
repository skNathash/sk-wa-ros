import { debounce } from "lodash";
import { Search } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AppInput, AppSelect } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import AppCard from "~/components/core/card/AppCard";
import type { DayPickerProps } from "react-day-picker";
import MiscService from "~/services/MiscService";
import { sub } from "date-fns";

type FilterProps = {
  callback: (a: { action: string; formData: any }) => void;
};

const types = [
  {
    label: "All Transactions",
    value: "All",
    langKey: "all",
  },
  {
    label: "Stock In",
    value: "IN",
    langKey: "stockIn",
  },
  {
    label: "Stock Out",
    value: "OUT",
    langKey: "stockOut",
  },
];

const dateConfig: DayPickerProps = {
  mode: "range" as const,
  disabled: { after: new Date() },
  endMonth: new Date(),
  startMonth: sub(new Date(), { years: 10 }),
  numberOfMonths: MiscService.isMobile() ? 1 : 2,
};

const Filter = ({ callback }: FilterProps) => {
  const { t } = useTranslation(["common"]);

  const { register, getValues, control } = useForm({
    defaultValues: {
      type: "All",
      dateRange: [],
    },
  });

  const debounceSearch = debounce(() => {
    triggerCallback();
  }, 500);

  const triggerCallback = () => {
    callback({ action: "filter", formData: getValues() });
  };

  const onDateChange = (chngFn: (a: any) => void) => (a: any) => {
    chngFn(a);
    triggerCallback();
  };

  const onTypeChange = (chngFn: (a: any) => void) => (a: any) => {
    chngFn(a);
    triggerCallback();
  };

  return (
    <AppCard noPadding bodyClassName="tw:p-3" className="tw:mb-4">
      <div className="tw:flex tw:flex-col tw:gap-3">
        {/* row 1: search takes the full width */}
        <AppInput
          name="search"
          register={register}
          onChange={debounceSearch}
          placeholder={t("searchByReferenceId")}
          className="tw:w-full"
          leftIcon={<Search size={16} className="tw:text-gray-500" />}
        />

        {/* row 2: date range + type share the width */}
        <div className="tw:flex tw:flex-nowrap tw:items-center tw:gap-3">
          <div className="tw:min-w-0 tw:flex-1">
            <Controller
              control={control}
              name="dateRange"
              render={({ field }) => (
                <AppDateInput
                  value={field.value}
                  callback={onDateChange(field.onChange)}
                  dateConfig={dateConfig}
                  placeholder={t("selectDateRange")}
                  className="tw:w-full"
                  inputClassName="tw:truncate"
                />
              )}
            />
          </div>

          <div className="tw:min-w-0 tw:flex-1">
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <AppSelect
                  options={types}
                  value={field.value}
                  onChange={onTypeChange(field.onChange)}
                  inputClassName="tw:w-full"
                />
              )}
            />
          </div>
        </div>
      </div>
    </AppCard>
  );
};

export default Filter;
