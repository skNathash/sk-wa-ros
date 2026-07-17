import { sub } from "date-fns";
import { debounce } from "lodash";
import { Search } from "lucide-react";
import { useCallback } from "react";
import type { DayPickerProps } from "react-day-picker";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import Alpha from "~/components/core/alpha/Alpha";
import { AppInput } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import MiscService from "~/services/MiscService";

type Props = {
  callback: (a: { formData: any }) => void;
  showFilters: boolean;
};

const Filter = ({ callback, showFilters }: Props) => {
  const { register, getValues, control, setValue } = useForm({
    defaultValues: {
      dateRange: [],
      search: "",
      type: "",
      alpha: "",
      customerFilter: "",
    },
  });

  const { t } = useTranslation(["common"]);

  const [alpha] = useWatch({ control, name: ["alpha"] });

  const handleInput = debounce(() => {
    setValue("alpha", "");
    triggerCallback();
  }, 500);

  const customerFilterOptions = [
    { label: "All", value: "All", langKey: "all" },
    { label: "Birthday Today", value: "birthday" },
    { label: "Kingcoins", value: "kingcoins" },
  ];

  const handleDateChange =
    (chngFrn: (value: Date[]) => void) => (value: Date | Date[]) => {
      chngFrn(Array.isArray(value) ? value : [value]);
      triggerCallback();
    };

  const triggerCallback = useCallback(() => {
    callback({ formData: getValues() });
  }, [callback, getValues]);

  const handleAlphaChange = (value: string) => {
    setValue("alpha", value);
    triggerCallback();
  };

  const handleCustomerFilterChange =
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
          placeholder="Search"
          leftIcon={<Search size={16} />}
        />
        {/* <Controller
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
        /> */}
        {showFilters && (
          <Controller
            control={control}
            name="dateRange"
            render={({ field }) => (
              <AppDateInput
                callback={handleDateChange(field.onChange)}
                value={field.value}
                dateConfig={dateConfig}
                size="sm"
                placeholder="Registered on"
              />
            )}
          />
        )}

        {/* <Controller
          control={control}
          name="customerFilter"
          render={({ field }) => (
            <AppSelect
              options={customerFilterOptions}
              onChange={handleCustomerFilterChange(field.onChange)}
              value={field.value}
              size="sm"
              placeholder={t("selectCustomerFilter")}
            />
          )}
        /> */}
      </div>

      {showFilters && (
        <Alpha
          callback={handleAlphaChange}
          selected={alpha}
          className="tw:mb-4"
        />
      )}
    </>
  );
};

const dateConfig: DayPickerProps = {
  mode: "range",
  disabled: { after: new Date() },
  endMonth: new Date(),
  startMonth: sub(new Date(), { years: 10 }),
  numberOfMonths: MiscService.isMobile() ? 1 : 2,
};

export default Filter;
