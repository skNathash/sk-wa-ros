import { debounce } from "lodash";
import { useCallback } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import Alpha from "~/components/core/alpha/Alpha";
import { AppInput } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import useScreenView from "~/hooks/useScreenView";
// toggle UI removed; icons not required
import { sub } from "date-fns";
import type { DayPickerProps } from "react-day-picker";
import MiscService from "~/services/MiscService";
import DeliveryRouteDropdown from "~/shared/logistics/components/delivery-route-dropdown/DeliveryRouteDropdown";

type Props = {
  callback: (a: { formData: any }) => void;
  /** Optional controlled prop to show/hide the toggled inputs (dateRange / alpha). If provided, the component becomes controlled for visibility */
  showFilters?: boolean;
  primaryBusinessOptions: { value: string; label: string }[];
};

const typeOptions = [
  { label: "All", value: "All", langKey: "all" },
  { label: "Credit", value: "Credit", langKey: "creditCard" },
  { label: "Debit", value: "Debit", langKey: "debit" },
];

const customerFilterOptions = [
  { label: "All", value: "All", langKey: "all" },
  { label: "Birthday Today", value: "birthday" },
  { label: "Kingcoins", value: "kingcoins" },
];

const Filter = ({ callback, showFilters, primaryBusinessOptions }: Props) => {
  const { register, getValues, control, setValue } = useForm({
    defaultValues: {
      dateRange: [],
      search: "",
      type: "",
      alpha: "",
      customerFilter: "",
      primaryBusiness: "choose",
    },
  });

  const { t } = useTranslation(["common"]);

  const { isMobile } = useScreenView();

  const [alpha] = useWatch({ control, name: ["alpha"] });

  // resolved visibility: prefer controlled prop when provided, otherwise default to not-mobile
  const showFiltersResolved =
    typeof showFilters === "boolean" ? showFilters : !isMobile;

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

  const handleCustomerFilterChange =
    (chngFrn: (value: string) => void) => (value: string) => {
      chngFrn(value);
      triggerCallback();
    };

  const handleAlphaChange = (value: string) => {
    setValue("alpha", value);
    triggerCallback();
  };

  const handlePrimaryBusinessChange =
    (chngFrn: (value: string) => void) => (value: string) => {
      chngFrn(value);
      triggerCallback();
    };

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-4 tw:gap-4 tw:mb-4">
        <AppInput
          name="search"
          register={register}
          onChange={handleInput}
          size="sm"
          placeholder={t("searchPlaceholder")}
        />
        {/* date range hidden on mobile unless toggled */}
        {(!isMobile || showFiltersResolved) && (
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
              />
            )}
          />
        )}

        {/* <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <DeliveryRouteDropdown
              label={""}
              placeholder={t("selectRoute")}
              size="sm"
              value={field.value}
              onChange={(value) => {
                field.onChange(value._id);
              }}
            />
          )}
        /> */}
      </div>

      {/* alpha block hidden on mobile unless toggled */}
      {(!isMobile || showFiltersResolved) && (
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
