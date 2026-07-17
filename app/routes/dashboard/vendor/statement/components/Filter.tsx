import { debounce } from "lodash";
import { useCallback } from "react";
import type { DayPickerProps } from "react-day-picker";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AppInput, AppSelect } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import AccountService from "~/services/AccountService";

type Props = {
  callback: (a: { formData: any }) => void;
  showFilters: boolean;
};

const sourceTypes = AccountService.getSourceTypeOptions();
sourceTypes.unshift({ label: "All", value: "All", langKey: "all" });

const typeOptions = [
  { label: "All", value: "All" },
  { label: "Credit", value: "credit" },
  { label: "Debit", value: "debit" },
];

const Filter = ({ callback, showFilters }: Props) => {
  const { t } = useTranslation();

  const { register, getValues, control } = useForm({
    defaultValues: {
      dateRange: [],
      search: "",
      type: "",
      sourceType: "",
    },
  });

  const handleInput = debounce(() => {
    triggerCallback();
  }, 500);

  const handleDateChange =
    (chngFrn: (value: Date[]) => void) => (value: Date | Date[]) => {
      chngFrn(Array.isArray(value) ? value : [value]);
      triggerCallback();
    };

  const triggerCallback = useCallback(() => {
    callback({ formData: getValues() });
  }, [callback, getValues]);

  const handleTypeChange =
    (chngFrn: (value: string) => void) => (value: string) => {
      chngFrn(value);
      triggerCallback();
    };

  return (
    <>
      <div className="tw:flex tw:flex-col tw:md:flex-row tw-gap-4 tw:md:items-center tw:gap-3 tw:mb-4">
        <AppInput
          name="search"
          register={register}
          onChange={handleInput}
          size="sm"
          placeholder="Search on Reference ID"
          className="tw:md:min-w-80"
        />
        {showFilters && (
          <>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <AppSelect
                  options={typeOptions}
                  value={field.value}
                  onChange={handleTypeChange(field.onChange)}
                  size="sm"
                  placeholder="Select type"
                  inputClassName="tw:w-full"
                />
              )}
            />

            <Controller
              control={control}
              name="sourceType"
              render={({ field }) => (
                <AppSelect
                  options={sourceTypes}
                  value={field.value}
                  onChange={handleTypeChange(field.onChange)}
                  size="sm"
                  placeholder={t("selectSourceType")}
                  inputClassName="tw:w-full"
                />
              )}
            />

            <Controller
              control={control}
              name="dateRange"
              render={({ field }) => (
                <AppDateInput
                  callback={handleDateChange(field.onChange)}
                  value={field.value}
                  dateConfig={dateConfig}
                  placeholder="Select date range"
                  size="sm"
                  className="tw:md:min-w-60"
                />
              )}
            />
          </>
        )}
      </div>
    </>
  );
};

const dateConfig: DayPickerProps = {
  mode: "range",
  disabled: { after: new Date() },
  endMonth: new Date(),
  showOutsideDays: false,
};

export default Filter;
