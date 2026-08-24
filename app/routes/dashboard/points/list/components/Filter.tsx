import { Controller, useForm } from "react-hook-form";
import { debounce } from "lodash";
import { useCallback } from "react";
import { AppInput, AppSelect } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import AppCard from "~/components/core/card/AppCard";
import type { DayPickerProps } from "react-day-picker";
import LoyaltyPointService from "~/services/LoyaltyPointService";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import MiscService from "~/services/MiscService";
import { sub } from "date-fns";

type Props = {
  callback: (a: { formData: any }) => void;
  className?: string;
};

const typeOptions = LoyaltyPointService.getTransactionTypeOptions();
typeOptions.unshift({ value: "All", label: "All Types", langKey: "allTypes" });

const dateConfig: DayPickerProps = {
  mode: "range",
  disabled: { after: new Date() },
  endMonth: new Date(),
  startMonth: sub(new Date(), { years: 10 }),
  numberOfMonths: MiscService.isMobile() ? 1 : 2,
};

const Filter = ({ callback, className }: Props) => {
  const { t } = useTranslation(["common"]);

  const { register, getValues, control } = useForm({
    defaultValues: {
      dateRange: [],
      search: "",
      type: "All",
    },
  });

  const triggerCallback = useCallback(() => {
    callback({ formData: getValues() });
  }, [callback, getValues]);

  const handleInput = debounce(() => {
    triggerCallback();
  }, 400);

  const handleDateChange =
    (chngFn: (value: Date[] | Date) => void) => (value: Date | Date[]) => {
      chngFn(Array.isArray(value) ? value : [value]);
      triggerCallback();
    };

  const handleTypeChange =
    (chngFn: (value: string) => void) => (value: string) => {
      chngFn(value);
      triggerCallback();
    };

  return (
    <AppCard
      className={`tw:mb-0 tw:py-3 ${className || ""}`}
      bodyClassName="tw:px-3"
    >
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
        <AppInput
          name="search"
          register={register}
          onChange={handleInput}
          size="sm"
          placeholder={t("searchRemarksTransaction")}
          leftIcon={<Search size={16} className="tw:text-gray-500" />}
        />

        <div className="tw:grid tw:grid-cols-3 tw:gap-2">
          <Controller
            control={control}
            name="dateRange"
            render={({ field }) => (
              <AppDateInput
                callback={handleDateChange(field.onChange)}
                value={field.value}
                dateConfig={dateConfig}
                size="sm"
                placeholder={t("selectDateRange")}
                className="tw:col-span-2"
              />
            )}
          />

          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <AppSelect
                options={typeOptions}
                value={field.value as string}
                onChange={handleTypeChange(field.onChange)}
                size="sm"
                inputClassName="tw:w-full"
              />
            )}
          />
        </div>
      </div>
    </AppCard>
  );
};

export default Filter;
