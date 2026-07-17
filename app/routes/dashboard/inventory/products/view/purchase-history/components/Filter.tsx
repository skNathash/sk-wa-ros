import { debounce } from "lodash";
import { SearchIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AppInput, AppSelect } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import type { DayPickerProps } from "react-day-picker";
import MiscService from "~/services/MiscService";
import { sub } from "date-fns";

type FilterProps = {
  callback: (a: { action: string; formData: any }) => void;
};

const statusOptions = PurchaseOrderService.getStatuses().map((e) => ({
  label: e.label,
  value: e.value,
  langKey: e.langKey,
}));
statusOptions.unshift({
  label: "All Statuses",
  value: "All",
  langKey: "allStatuses",
});

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
      status: "All",
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

  const onStatusChange = (chngFn: (a: any) => void) => (a: any) => {
    chngFn(a);
    triggerCallback();
  };

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-4 tw:gap-4 tw:mb-4">
        <AppInput
          name="search"
          register={register}
          onChange={debounceSearch}
          placeholder={t("searchByOrderNumber")}
          leftIcon={<SearchIcon size={16} />}
        />

        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <AppSelect
              options={statusOptions}
              value={field.value}
              onChange={onStatusChange(field.onChange)}
              inputClassName="tw:w-full"
              placeholder={t("selectStatus")}
            />
          )}
        />

        <Controller
          control={control}
          name="dateRange"
          render={({ field }) => (
            <AppDateInput
              value={field.value}
              callback={onDateChange(field.onChange)}
              dateConfig={dateConfig}
              placeholder={t("selectDateRange")}
            />
          )}
        />
      </div>
    </>
  );
};

export default Filter;
