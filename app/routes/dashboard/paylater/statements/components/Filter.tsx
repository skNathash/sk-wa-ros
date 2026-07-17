import { debounce } from "lodash";
import { SearchIcon } from "lucide-react";
import { useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AppInput, AppSelect } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import type { DayPickerProps } from "react-day-picker";
import MiscService from "~/services/MiscService";
import { sub } from "date-fns";

type Props = {
  callback: (a: { formData: any }) => void;
};

const typeOptions = [
  { label: "All", value: "all" },
  { label: "B2B", value: "b2b" },
  { label: "B2C", value: "b2c" },
];

const dateConfig: DayPickerProps = {
  mode: "range",
  disabled: { after: new Date() },
  endMonth: new Date(),
  startMonth: sub(new Date(), { years: 10 }),
  numberOfMonths: MiscService.isMobile() ? 1 : 2,
};

const Filter = ({ callback }: Props) => {
  const { t } = useTranslation(["common"]);

  const { register, getValues, control } = useForm({
    defaultValues: {
      search: "",
      type: "all",
      dateRange: [],
    },
  });

  const handleInput = debounce(() => {
    triggerCallback();
  }, 500);

  const triggerCallback = useCallback(() => {
    callback({ formData: getValues() });
  }, [callback, getValues]);

  const handleDateChange =
    (chngFrn: (value: Date[]) => void) => (value: Date | Date[]) => {
      chngFrn(Array.isArray(value) ? value : [value]);
      triggerCallback();
    };

  const handleTypeChange =
    (chngFrn: (value: string) => void) => (value: string) => {
      chngFrn(value);
      triggerCallback();
    };

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4 tw:mb-4">
        <AppInput
          name="search"
          register={register}
          onChange={handleInput}
          size="sm"
          placeholder={t("searchByNameId")}
          leftIcon={<SearchIcon size={16} className="tw:text-gray-500" />}
        />

        <div className="tw:grid tw:grid-cols-2 tw:gap-2">
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <AppSelect
                options={typeOptions}
                value={field.value}
                onChange={handleTypeChange(field.onChange)}
                size="sm"
                placeholder={t("selectType")}
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
                placeholder={t("selectDateRange")}
                size="sm"
                dateConfig={dateConfig}
              />
            )}
          />
        </div>
      </div>
    </>
  );
};

export default Filter;
