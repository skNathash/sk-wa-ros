import { sub } from "date-fns";
import { orderBy } from "lodash";
import { Search } from "lucide-react";
import type { DayPickerProps } from "react-day-picker";
import { useCallback, useEffect, useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import AppCard from "~/components/core/card/AppCard";
import AppDateInput from "~/components/core/form/AppDateInput";
import { AppInput } from "~/components/core/form/AppInput";
import AppSelect from "~/components/core/form/AppSelect";
import CommonService from "~/services/CommonService";
import MiscService from "~/services/MiscService";
import type { EmployeeFilterForm } from "../helper";

interface FilterProps {
  // Fired whenever a field changes so the parent can sync query params
  callback: (formData: EmployeeFilterForm) => void;
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
  const { control, register, getValues, setValue } =
    useFormContext<EmployeeFilterForm>();

  const [statesOption, setStatesOption] = useState<Option[]>([]);
  const [districtsOption, setDistrictsOption] = useState<Option[]>([]);

  const [state, district] = useWatch({ control, name: ["state", "district"] });

  const triggerCallback = useCallback(() => {
    callback(getValues());
  }, [callback, getValues]);

  // Debounced trigger for free-text inputs (search / pincode)
  const debouncedTrigger = useDebouncedCallback(() => {
    triggerCallback();
  }, 400);

  // Load master data --------------------------------------------------------
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

  // Reload dependent options when the parent value changes (incl. URL reset)
  useEffect(() => {
    if (state && state !== "All") {
      loadDistricts(state);
    } else {
      setDistrictsOption([]);
    }
  }, [state, loadDistricts]);

  // Change handlers ---------------------------------------------------------
  const handleStateChange = (value: string) => {
    setValue("state", value);
    // Reset the dependent select whenever the parent changes
    setValue("district", "");
    triggerCallback();
  };

  const handleDistrictChange = (value: string) => {
    setValue("district", value);
    triggerCallback();
  };

  const handlePincodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Keep numeric, max 6 digits; only query on empty or complete pincode
    const numeric = event.target.value.replace(/\D/g, "").slice(0, 6);
    event.target.value = numeric;
    setValue("pincode", numeric);
    if (numeric.length === 0 || numeric.length === 6) {
      debouncedTrigger();
    }
  };

  const handleDateChange = (value: Date | Date[]) => {
    setValue("followUpDateRange", Array.isArray(value) ? value : [value]);
    triggerCallback();
  };

  const handleCreatedDateChange = (value: Date | Date[]) => {
    setValue("createdDateRange", Array.isArray(value) ? value : [value]);
    triggerCallback();
  };

  return (
    <AppCard className={className} noPadding>
      <div className="tw:grid tw:grid-cols-1 tw:gap-x-3 tw:gap-y-2.5 tw:px-4 tw:py-2.5 tw:md:grid-cols-6">
        <AppInput
          name="search"
          label="Search"
          placeholder="Search by name or mobile"
          register={register}
          size="sm"
          onChange={debouncedTrigger}
          leftIcon={<Search size={16} className="tw:text-gray-400" />}
          className="tw:md:col-span-2"
        />

        {/* <Controller
          name="followUpDateRange"
          control={control}
          render={({ field }) => (
            <AppDateInput
              label="Follow-up Date Range"
              size="sm"
              placeholder="Select date range"
              dateConfig={dateConfig}
              value={field.value}
              callback={handleDateChange}
              className="tw:md:col-span-2"
            />
          )}
        /> */}

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
      </div>
    </AppCard>
  );
};

export default Filter;
