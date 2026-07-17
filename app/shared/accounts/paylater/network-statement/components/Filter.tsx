import { debounce } from "lodash";
import { SearchIcon } from "lucide-react";
import { useCallback } from "react";
import type { DayPickerProps } from "react-day-picker";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AppInput } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";

const dateConfig: DayPickerProps = {
  mode: "range",
};

type Props = {
  callback: (a: { formData: any }) => void;
};

const statusOptions = [
  { label: "All", value: "All" },
  { label: "Pending", value: "Pending" },
  { label: "Approved", value: "Approved" },
  { label: "Rejected", value: "Rejected" },
];

const Filter = ({ callback }: Props) => {
  const { t } = useTranslation(["common"]);

  const { register, getValues, control } = useForm({
    defaultValues: {
      search: "",
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

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4 tw:mb-4">
        <AppInput
          name="search"
          register={register}
          onChange={handleInput}
          size="sm"
          placeholder={t("searchByOrderId")}
          leftIcon={<SearchIcon size={16} className="tw:text-gray-500" />}
        />

        <Controller
          control={control}
          name="dateRange"
          render={({ field }) => (
            <AppDateInput
              callback={handleDateChange(field.onChange)}
              value={field.value}
              size="sm"
              placeholder={t("selectDateRange")}
              dateConfig={dateConfig}
            />
          )}
        />
      </div>
    </>
  );
};

export default Filter;
