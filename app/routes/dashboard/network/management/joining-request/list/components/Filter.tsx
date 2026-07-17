import type { DayPickerProps } from "react-day-picker";
import { debounce } from "lodash";
import { useCallback } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import Alpha from "~/components/core/alpha/Alpha";
import { AppInput, AppSelect } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";

type Props = {
  callback: (a: { formData: any }) => void;
};

const statusOptions = [
  { label: "All Status", value: "All", langKey: "allStatus" },
  { label: "Approved", value: "Approved", langKey: "approved" },
  { label: "Disconnected", value: "Disconnected", langKey: "disconnected" },
  { label: "Pending", value: "Pending", langKey: "pending" },
  { label: "Rejected", value: "Rejected", langKey: "rejected" },
];

const Filter = ({ callback }: Props) => {
  const { t } = useTranslation(["common"]);

  const { register, getValues, control, setValue } = useForm({
    defaultValues: {
      dateRange: [],
      search: "",
      status: "Pending",
      alpha: "",
    },
  });

  const [alpha] = useWatch({ control, name: ["alpha"] });

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

  const handleStatusChange =
    (chngFrn: (value: string) => void) => (value: string) => {
      chngFrn(value);
      triggerCallback();
    };

  const handleAlphaChange = (value: string) => {
    setValue("alpha", value);
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
          placeholder={t("search")}
          leftIcon={<Search size={16} />}
        />
        <div className="tw:flex tw:gap-2">
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
                className="tw:flex-1"
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
                onChange={handleStatusChange(field.onChange)}
                size="sm"
                placeholder={t("selectStatus")}
              />
            )}
          />
        </div>
      </div>

      <Alpha
        callback={handleAlphaChange}
        selected={alpha}
        className="tw:mb-4"
      />
    </>
  );
};

const dateConfig: DayPickerProps = {
  mode: "range",
  disabled: { after: new Date() },
};

export default Filter;
