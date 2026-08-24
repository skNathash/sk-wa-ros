import clsx from "clsx";
import { sub } from "date-fns";
import { debounce } from "lodash";
import { Funnel, Search } from "lucide-react";
import { useCallback, useState } from "react";
import type { DayPickerProps } from "react-day-picker";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import Alpha from "~/components/core/alpha/Alpha";
import AppCard from "~/components/core/card/AppCard";
import { AppInput, AppSelect } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import useScreenView from "~/hooks/useScreenView";
import MiscService from "~/services/MiscService";

type Props = {
  callback: (a: { formData: any }) => void;
  showFilters: boolean;
};

const Filter = ({ callback, showFilters }: Props) => {
  const { isMobile } = useScreenView();

  // Mobile only: the extra filters stay collapsed behind the funnel toggle.
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const { register, getValues, control, setValue } = useForm({
    defaultValues: {
      dateRange: [],
      search: "",
      type: "",
      alpha: "",
      customerFilter: "",
      status: "all",
    },
  });

  const { t } = useTranslation(["common"]);

  const alpha = useWatch({ control, name: "alpha" });

  const handleInput = debounce(() => {
    setValue("alpha", "");
    triggerCallback();
  }, 500);

  /** Mirrors the Status column — Active is the buyer flag, Inactive its inverse. */
  const statusOptions = [
    { label: "All", value: "all" },
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
  ];

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

  const handleStatusChange =
    (chngFrn: (value: string) => void) => (value: string) => {
      chngFrn(value);
      triggerCallback();
    };

  const handleCustomerFilterChange =
    (chngFrn: (value: string) => void) => (value: string) => {
      chngFrn(value);
      triggerCallback();
    };

  const searchInput = (
    <AppInput
      name="search"
      register={register}
      onChange={handleInput}
      size="sm"
      placeholder="Search"
      leftIcon={<Search size={16} />}
    />
  );

  const dateFilter = showFilters && (
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
  );

  const statusFilter = (
    <Controller
      control={control}
      name="status"
      render={({ field }) => (
        <AppSelect
          options={statusOptions}
          value={field.value}
          onChange={handleStatusChange(field.onChange)}
          size="sm"
          placeholder="Status"
          inputClassName="tw:w-full"
        />
      )}
    />
  );

  const alphaFilter = showFilters && (
    <Alpha callback={handleAlphaChange} selected={alpha} />
  );

  // `app-bleed-x` — mobile only: the filter block runs edge to edge out of
  // the page gutter, matching the hero above it.
  if (isMobile) {
    return (
      <AppCard className="tw:py-2.5 tw:mb-2 app-bleed-x" bodyClassName="tw:px-3">
        <div className="tw:grid tw:grid-cols-1 tw:gap-2.5">
          <div className="tw:flex tw:items-center tw:gap-2">
            <div className="tw:flex-1">{searchInput}</div>
            <button
              type="button"
              aria-label="Filters"
              aria-expanded={showMobileFilters}
              onClick={() => setShowMobileFilters((prev) => !prev)}
              className={clsx(
                "tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:border",
                showMobileFilters
                  ? "tw:border-primary tw:bg-primary tw:text-white"
                  : "tw:border-gray-200 tw:text-gray-600",
              )}
            >
              <Funnel size={16} />
            </button>
          </div>
          {showMobileFilters && (
            <>
              {dateFilter}
              {statusFilter}
              {alphaFilter}
            </>
          )}
        </div>
      </AppCard>
    );
  }

  return (
    <AppCard className="tw:py-3 tw:mb-2" bodyClassName="tw:px-3">
      <div
        className={clsx(
          "tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4",
          showFilters && "tw:mb-3",
        )}
      >
        {searchInput}
        {dateFilter}
        {statusFilter}
      </div>

      {alphaFilter}
    </AppCard>
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
