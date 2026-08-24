import { sub } from "date-fns";
import { orderBy } from "lodash";
import { Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import type { DayPickerProps } from "react-day-picker";
import { useDebouncedCallback } from "use-debounce";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import { AppInput } from "~/components/core/form/AppInput";
import AppSelect from "~/components/core/form/AppSelect";
import AppDateInput from "~/components/core/form/AppDateInput";
import CommonService from "~/services/CommonService";
import MiscService from "~/services/MiscService";
import type { RetailerSummaryFilterForm } from "./helper";
import { defaultFilter } from "./helper";

interface FilterProps {
  // Fired whenever a field changes so the parent can sync query params
  callback: (formData: RetailerSummaryFilterForm) => void;
  className?: string;
}

type Option = { value: string; label: string };

const dateConfig: DayPickerProps = {
  mode: "range",
  disabled: { after: new Date() },
  endMonth: new Date(),
  startMonth: sub(new Date(), { years: 10 }),
  numberOfMonths: MiscService.isMobile() ? 1 : 2,
};

const Filter = ({ callback, className }: FilterProps) => {
  const { control, register, getValues, setValue, reset } =
    useFormContext<RetailerSummaryFilterForm>();

  const [statesOption, setStatesOption] = useState<Option[]>([]);
  const [districtsOption, setDistrictsOption] = useState<Option[]>([]);

  const [state] = useWatch({ control, name: ["state"] });

  const triggerCallback = useCallback(() => {
    callback(getValues());
  }, [callback, getValues]);

  // Debounced trigger for free-text inputs (search / pincode)
  const debouncedTrigger = useDebouncedCallback(() => {
    triggerCallback();
  }, 400);

  const loadStates = useCallback(async () => {
    try {
      const response = await CommonService.getStates();
      const d = orderBy(
        response?.data?.data?.filter((s: any) => s.isLive),
        "name",
        "asc",
      ).map((s: any) => ({ value: s.name, label: s.name }));
      setStatesOption([{ value: "All", label: "All States" }, ...d]);
    } catch (error) {
      console.error("Error loading states:", error);
    }
  }, []);

  const loadDistricts = useCallback(async (stateName: string) => {
    try {
      const response = await CommonService.getDistricts(stateName);
      const d = orderBy(response?.data?.data, "name", "asc").map((x: any) => ({
        value: x.name,
        label: x.name,
      }));
      setDistrictsOption([{ value: "All", label: "All Districts" }, ...d]);
    } catch (error) {
      console.error("Error loading districts:", error);
    }
  }, []);

  useEffect(() => {
    loadStates();
  }, [loadStates]);

  useEffect(() => {
    if (state && state !== "All") {
      loadDistricts(state);
    } else {
      setDistrictsOption([]);
    }
  }, [state, loadDistricts]);

  const handleStateChange = (value: string) => {
    setValue("state", value);
    setValue("district", "");
    triggerCallback();
  };

  const handleDistrictChange = (value: string) => {
    setValue("district", value);
    triggerCallback();
  };

  const handlePincodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const numeric = event.target.value.replace(/\D/g, "").slice(0, 6);
    event.target.value = numeric;
    setValue("pincode", numeric);
    if (numeric.length === 0 || numeric.length === 6) {
      debouncedTrigger();
    }
  };

  const handleCreatedDateChange = (value: Date | Date[]) => {
    setValue("createdDateRange", Array.isArray(value) ? value : [value]);
    triggerCallback();
  };

  const handleReset = () => {
    reset(defaultFilter);
    triggerCallback();
  };

  return (
    <AppCard className={className} noPadding>
      <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:px-4 tw:pt-3 tw:md:grid-cols-4">
        <AppInput
          name="search"
          label="Search"
          placeholder="Search by retailer name or mobile"
          register={register}
          size="sm"
          onChange={debouncedTrigger}
          leftIcon={<Search size={16} className="tw:text-gray-400" />}
          className="tw:md:col-span-2"
        />

        <Controller
          name="createdDateRange"
          control={control}
          render={({ field }) => (
            <AppDateInput
              label="Created On"
              size="sm"
              placeholder="Select date range"
              dateConfig={dateConfig}
              value={field.value}
              callback={handleCreatedDateChange}
              className="tw:md:col-span-2"
            />
          )}
        />
      </div>

      <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:px-4 tw:pt-3 tw:pb-3 tw:md:grid-cols-4">
        <Controller
          name="state"
          control={control}
          render={({ field }) => (
            <AppSelect
              label="State"
              options={statesOption}
              value={field.value}
              onChange={handleStateChange}
              placeholder="Select state"
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
              label="District"
              options={districtsOption}
              value={field.value}
              onChange={handleDistrictChange}
              placeholder="Select district"
              inputClassName="tw:w-full"
              size="sm"
              disabled={!state || state === "All"}
            />
          )}
        />

        <AppInput
          name="pincode"
          label="Pincode"
          placeholder="Enter pincode"
          register={register}
          size="sm"
          maxLength={6}
          onChange={handlePincodeChange}
        />

        <div className="tw:flex tw:items-end">
          <AppButton
            size="small"
            fill="outline"
            color="light"
            onClick={handleReset}
            className="tw:h-8"
          >
            Reset
          </AppButton>
        </div>
      </div>
    </AppCard>
  );
};

export default Filter;
