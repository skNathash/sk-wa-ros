import { sub } from "date-fns";
import { orderBy } from "lodash";
import { useCallback, useEffect, useState } from "react";
import type { DayPickerProps } from "react-day-picker";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import AppDateInput from "~/components/core/form/AppDateInput";
import { AppInput } from "~/components/core/form/AppInput";
import AppSelect from "~/components/core/form/AppSelect";
import CommonService from "~/services/CommonService";
import MiscService from "~/services/MiscService";
import FranchiseSearchInput from "./FranchiseSearchInput";

interface FilterFormData {
  dateRange: Date[];
  franchise: any;
  state: string;
  district: string;
  town: string;
  networkType: string;
  planPurchased: string;
  pincode: string;
}

interface FilterProps {
  callback: (filters: { formData: FilterFormData }) => void;
  className?: string;
}

const dateConfig: DayPickerProps = {
  mode: "range",
  disabled: { after: new Date() },
  defaultMonth: new Date(),
  endMonth: new Date(),
  startMonth: sub(new Date(), { years: 5 }),
  numberOfMonths: MiscService.isMobile() ? 1 : 2,
};

const planPurchasedOptions = [
  { value: "all", label: "All" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const networkTypeOptions = [
  { value: "all", label: "All" },
  { value: "SKRETAILER", label: "SK Retailer" },
  { value: "SKSELLER", label: "SK Seller" },
  { value: "SKBUYER", label: "SK Buyer" },
  { value: "SKVENDOR", label: "SK Vendor" },
];

const Filter = ({ callback, className }: FilterProps) => {
  const { t } = useTranslation(["common"]);

  const { control, register, getValues, setValue } =
    useFormContext<FilterFormData>();

  const [statesOption, setStatesOption] = useState<
    { value: string; label: string }[]
  >([]);
  const [districtsOption, setDistrictsOption] = useState<
    { value: string; label: string }[]
  >([]);

  const state = useWatch({
    control,
    name: "state",
  });

  const triggerCallback = useCallback(() => {
    callback({ formData: getValues() });
  }, [callback, getValues]);

  // Load states once on mount
  useEffect(() => {
    loadStates();
  }, []);

  // Load districts when state changes (keeps district value intact on mount)
  useEffect(() => {
    if (state && state !== "All") {
      loadDistricts(state);
    } else {
      setDistrictsOption([]);
    }
  }, [state]);

  const loadStates = async () => {
    try {
      const response = await CommonService.getStates();
      const d = orderBy(
        response.data.data?.filter((s: any) => s.isLive),
        "name",
        "asc",
      ).map((s: any) => ({
        value: s.name,
        label: s.name,
      }));
      setStatesOption([{ value: "All", label: "All States" }, ...d]);
    } catch (error) {
      console.error("Error loading states:", error);
    }
  };

  const loadDistricts = async (stateName: string) => {
    try {
      const response = await CommonService.getDistricts(stateName);
      const d = orderBy(response.data.data, "name", "asc");
      setDistrictsOption([
        { value: "All", label: "All Districts" },
        ...d.map((district: any) => ({
          value: district.name,
          label: district.name,
        })),
      ]);
    } catch (error) {
      console.error("Error loading districts:", error);
    }
  };

  const handleDateChange =
    (chngFn: (value: Date[]) => void) => (value: Date | Date[]) => {
      if (Array.isArray(value)) {
        chngFn(value);
      } else {
        chngFn([value]);
      }
      const t = setTimeout(() => {
        clearTimeout(t);
        triggerCallback();
      }, 300);
    };

  const handleFranchiseChange =
    (chngFn: (value: any) => void) => (item: any, action: "add" | "remove") => {
      if (action === "add") {
        chngFn([item]);
        // Clear all other filters — when a franchise is selected we filter
        // only by that franchise.
        setValue("dateRange", []);
        setValue("state", "");
        setValue("district", "");
        setValue("town", "");
        setValue("networkType", "all");
        setValue("planPurchased", "all");
        setValue("pincode", "");
      } else {
        chngFn(null);
      }
      triggerCallback();
    };

  const handleStateChange =
    (chngFn: (value: string) => void) => (value: string) => {
      chngFn(value);
      // Reset downstream selection when the state changes
      setValue("district", "");
      triggerCallback();
    };

  const handleDistrictChange =
    (chngFn: (value: string) => void) => (value: string) => {
      chngFn(value);
      triggerCallback();
    };

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only digits, capped at 6 characters
    const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
    setValue("pincode", digits);
    const t = setTimeout(() => {
      clearTimeout(t);
      triggerCallback();
    }, 300);
  };

  return (
    <AppCard className={className} noPadding>
      <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:lg:grid-cols-4 tw:gap-4 tw:w-full tw:px-4 tw:py-3">
        <Controller
          name="dateRange"
          control={control}
          render={({ field }) => (
            <AppDateInput
              label="Registered On"
              placeholder="Select date range"
              value={field.value}
              callback={handleDateChange(field.onChange)}
              dateConfig={dateConfig}
              size="sm"
              hideClose={false}
            />
          )}
        />

        <Controller
          name="franchise"
          control={control}
          render={({ field }) => (
            <FranchiseSearchInput
              size="sm"
              callback={handleFranchiseChange(field.onChange)}
              values={field.value}
            />
          )}
        />

        <Controller
          name="networkType"
          control={control}
          render={({ field }) => (
            <AppSelect
              label="Network Type"
              options={networkTypeOptions}
              value={field.value}
              onChange={(value) => {
                field.onChange(value);
                triggerCallback();
              }}
              size="sm"
              placeholder="Select network type"
              inputClassName="tw:w-full"
            />
          )}
        />

        <Controller
          name="planPurchased"
          control={control}
          render={({ field }) => (
            <AppSelect
              label="Plan Purchased"
              options={planPurchasedOptions}
              value={field.value}
              onChange={(value) => {
                field.onChange(value);
                triggerCallback();
              }}
              size="sm"
              placeholder="Plan Purchased"
              inputClassName="tw:w-full"
            />
          )}
        />

        <Controller
          name="state"
          control={control}
          render={({ field }) => (
            <AppSelect
              label={t("state")}
              options={statesOption}
              placeholder={t("selectState")}
              onChange={handleStateChange(field.onChange)}
              value={field.value}
              inputClassName="tw:w-full"
              size="sm"
            />
          )}
        />

        <Controller
          name="district"
          control={control}
          render={({ field }) => (
            <AppSelect
              label={t("district")}
              options={districtsOption}
              placeholder={t("selectDistrict")}
              onChange={handleDistrictChange(field.onChange)}
              value={field.value}
              inputClassName="tw:w-full"
              size="sm"
              disabled={!state || state === "All"}
            />
          )}
        />

        <AppInput
          name="pincode"
          label="Pincode"
          type="tel"
          placeholder="Enter pincode"
          register={register}
          onChange={handlePincodeChange}
          maxLength={6}
          size="sm"
          inputClassName="tw:w-full"
        />
      </div>
    </AppCard>
  );
};

export default Filter;
