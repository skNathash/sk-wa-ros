import { debounce } from "lodash";
import { Search } from "lucide-react";
import { useCallback } from "react";
import type { DayPickerProps } from "react-day-picker";
import { Controller, useFormContext } from "react-hook-form";
import { AppInput } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import { useTranslation } from "react-i18next";

type Props = {
  callback: (data?: any) => void;
};

const dateConfig: DayPickerProps = {
  mode: "range",
};

const Filter = ({ callback }: Props) => {
  const { t } = useTranslation(["common"]);
  const { control, register, getValues, setValue } = useFormContext();

  const onDateChange =
    (chngFn: (value: Date[]) => void) => (value: Date | Date[]) => {
      chngFn(Array.isArray(value) ? value : [value]);
      triggerCallback();
    };

  const triggerCallback = useCallback(() => {
    callback({ formData: getValues() });
  }, [callback, getValues]);

  const handleSearchChange = useCallback(
    debounce(() => {
      triggerCallback();
    }, 500),
    [triggerCallback]
  );

  return (
    <>
      <div className="tw:mb-4 tw:md:grid tw:md:grid-cols-2 tw:md:gap-2">
        <AppInput
          name="search"
          placeholder={t("searchByOrderId")}
          register={register}
          onChange={handleSearchChange}
          size="sm"
          className="tw:w-full tw:flex-1 tw:mb-4 tw:md:mb-0"
          leftIcon={<Search size={16} className="tw:text-gray-500" />}
        />

        <div className="tw:flex tw:gap-2">
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
                className="tw:flex-1 tw:md:flex-none"
                hideClose={true}
              />
            )}
          />
        </div>
      </div>
    </>
  );
};

export default Filter;
