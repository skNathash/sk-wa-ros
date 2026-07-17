import debounce from "lodash/debounce";
import type { DayPickerProps } from "react-day-picker";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AppInput, AppSelect } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import AccountService from "~/services/AccountService";

interface FilterProps {
  callback: (params: { formData: any; action: string }) => void;
}

const dateConfig: DayPickerProps = {
  mode: "range",
};

const statusOptions = [
  { value: "all", label: "All Status", langKey: "allStatus" },
  { value: "pending", label: "Pending", langKey: "pending" },
  { value: "done", label: "Paid", langKey: "paid" },
];

const typeOptions = AccountService.getSourceTypeOptions();
typeOptions.sort((a, b) => a.label.localeCompare(b.label));
typeOptions.unshift({ value: "all", label: "All Types", langKey: "allTypes" });

const Filter = ({ callback }: FilterProps) => {
  const { t } = useTranslation(["common"]);

  const { register, control, getValues } = useFormContext();

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

  const onSelectChange = (value: any, chngField: (value: any) => void) => {
    chngField(value);
    triggerCallback();
  };

  return (
    <div className="tw:flex tw:flex-col tw:gap-4 tw:mb-4">
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:lg:grid-cols-4 tw:gap-3">
        <AppInput
          name="search"
          placeholder={t("searchRefNoVendor")}
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
              placeholder="Filter by Date Range"
              className="tw:w-full"
            />
          )}
        />
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <AppSelect
              options={statusOptions}
              value={field.value}
              onChange={(val: any) => onSelectChange(val, field.onChange)}
              size="sm"
              placeholder={t("allStatus")}
              inputClassName="tw:w-full"
            />
          )}
        />
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <AppSelect
              options={typeOptions}
              value={field.value}
              onChange={(val: any) => onSelectChange(val, field.onChange)}
              size="sm"
              placeholder={t("allTypes")}
              inputClassName="tw:w-full"
            />
          )}
        />
      </div>
    </div>
  );
};

export default Filter;
