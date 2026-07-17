import { debounce } from "lodash";
import { Search } from "lucide-react";
import type { DayPickerProps } from "react-day-picker";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AppInput, AppSelect } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import MiscService from "~/services/MiscService";
import { sub } from "date-fns";

type FilterProps = {
  callback: (a: { action: string; formData: any }) => void;
};

const types = [
  {
    label: "All",
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

  const { register, handleSubmit, getValues, control } = useForm({
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

  const onStatusChange = (chngFn: (a: any) => void) => (a: any) => {
    chngFn(a);
    triggerCallback();
  };

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4 tw:mb-4">
        <AppInput
          name="search"
          register={register}
          onChange={debounceSearch}
          placeholder={t("searchByDealIdNameReferenceId")}
          leftIcon={<Search size={20} className="tw:text-gray-500" />}
        />

        <div className="tw:flex tw:flex-row tw:flex-wrap tw:gap-2 tw:md:tw-grid tw:md:tw-grid-cols-2 tw:md:tw-gap-4">
          <Controller
            control={control}
            name="dateRange"
            render={({ field }) => (
              <AppDateInput
                value={field.value}
                callback={onDateChange(field.onChange)}
                dateConfig={dateConfig}
                placeholder={t("selectDateRange")}
                className="tw:w-full tw:flex-1"
              />
            )}
          />
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
    </>
  );
};

export default Filter;
