import { debounce } from "lodash";
import { useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import { AppInput } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import type { DayPickerProps } from "react-day-picker";
import { defaultFilter } from "../helper";
import { useTranslation } from "react-i18next";

type Props = {
  callback: (a: { formData: any }) => void;
};

const Filter = ({ callback }: Props) => {
  const { t } = useTranslation(["common"]);
  const { register, getValues, control } = useForm({
    defaultValues: { ...defaultFilter },
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

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
        <AppInput
          name="search"
          register={register}
          onChange={handleInput}
          size="sm"
          placeholder={t("searchOrderIdSenderPackageRef")}
        />

        {/* <Controller
          control={control}
          name="dateRange"
          render={({ field }) => (
            <AppDateInput
              callback={handleDateChange(field.onChange)}
              value={field.value}
              dateConfig={dateConfig}
              size="sm"
              placeholder="Select Date Range"
              hideClose={true}
            />
          )}
        /> */}
      </div>
    </>
  );
};

const dateConfig: DayPickerProps = {
  mode: "range",
  disabled: { after: new Date() },
};

export default Filter;
