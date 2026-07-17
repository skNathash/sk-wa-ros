import type { Options } from "flatpickr/dist/types/options";
import { debounce } from "lodash";
import { useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import { AppInput, AppSelect } from "~/components/core/form";
import UserService from "~/services/UserService";
import { useTranslation } from "react-i18next";

type Props = {
  callback: (a: { formData: any }) => void;
};

const typeOptions = UserService.getPositionOptions();
typeOptions.unshift({ label: "Admin", value: "Admin", langKey: "admin" });
typeOptions.sort((a, b) => a.label.localeCompare(b.label));
typeOptions.unshift({ label: "All", value: "All", langKey: "all" });

const statusOptions = [
  { label: "All", value: "All", langKey: "all" },
  { label: "Active", value: "Active", langKey: "active" },
  { label: "Inactive", value: "Inactive", langKey: "inactive" },
];

const Filter = ({ callback }: Props) => {
  const { t } = useTranslation(["common"]);

  const { register, getValues, control } = useForm({
    defaultValues: {
      dateRange: [],
      search: "",
      type: "",
      status: "",
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

  const handleStatusChange =
    (chngFrn: (value: string) => void) => (value: string) => {
      chngFrn(value);
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
          placeholder={t("searchByNameOrPhoneNumber")}
        />
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
          name="status"
          render={({ field }) => (
            <AppSelect
              options={statusOptions}
              value={field.value}
              onChange={handleStatusChange(field.onChange)}
              size="sm"
              placeholder={t("selectStatus")}
              inputClassName="tw:w-full"
            />
          )}
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
            />
          )}
        /> */}
      </div>
    </>
  );
};

const dateConfig: Options = {
  mode: "range",
  maxDate: new Date(),
};

export default Filter;
