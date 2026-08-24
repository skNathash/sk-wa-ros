import { orderBy } from "lodash";
import { Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import { AppInput } from "~/components/core/form/AppInput";
import AppSelect from "~/components/core/form/AppSelect";
import CommonService from "~/services/CommonService";
import type { RetailerFilterForm } from "../helper";

interface FilterProps {
  // Fired whenever a field changes so the parent can sync query params
  callback: (formData: RetailerFilterForm) => void;
  className?: string;
}

type Option = { value: string; label: string };

const Filter = ({ callback, className }: FilterProps) => {
  const { t } = useTranslation(["common"]);

  const { control, register, getValues, setValue } =
    useFormContext<RetailerFilterForm>();

  const [statesOption, setStatesOption] = useState<Option[]>([]);
  const [districtsOption, setDistrictsOption] = useState<Option[]>([]);
  const [townsOption, setTownsOption] = useState<Option[]>([]);

  const [state, district] = useWatch({ control, name: ["state", "district"] });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerCallback = useCallback(() => {
    callback(getValues());
  }, [callback, getValues]);

  // Debounced trigger for free-text inputs (search / pincode)
  const debouncedTrigger = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      triggerCallback();
    }, 400);
  }, [triggerCallback]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

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

  const loadTowns = useCallback(
    async (stateName: string, districtName: string) => {
      try {
        const response = await CommonService.getSubdistricts(
          stateName,
          districtName,
        );
        const d = orderBy(response?.data?.data, "name", "asc").map((x: any) => ({
          value: x.name,
          label: x.name,
        }));
        setTownsOption([{ value: "All", label: "All Towns" }, ...d]);
      } catch (error) {
        console.error("Error loading towns:", error);
      }
    },
    [],
  );

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

  useEffect(() => {
    if (state && state !== "All" && district && district !== "All") {
      loadTowns(state, district);
    } else {
      setTownsOption([]);
    }
  }, [state, district, loadTowns]);

  // Change handlers ---------------------------------------------------------
  const handleStateChange = (value: string) => {
    setValue("state", value);
    // Reset the dependent selects whenever the parent changes
    setValue("district", "");
    setValue("town", "");
    triggerCallback();
  };

  const handleDistrictChange = (value: string) => {
    setValue("district", value);
    setValue("town", "");
    triggerCallback();
  };

  const handleTownChange = (value: string) => {
    setValue("town", value);
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

  return (
    <AppCard className={className} noPadding>
      <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:px-4 tw:py-3 tw:md:grid-cols-5">
        <AppInput
          name="search"
          label={t("search")}
          placeholder={t("searchByNameOrMobile")}
          register={register}
          size="sm"
          onChange={debouncedTrigger}
          leftIcon={<Search size={16} className="tw:text-gray-400" />}
        />

        <Controller
          name="state"
          control={control}
          render={({ field }) => (
            <AppSelect
              label={t("state")}
              options={statesOption}
              value={field.value}
              onChange={handleStateChange}
              placeholder={t("selectState")}
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
              value={field.value}
              onChange={handleDistrictChange}
              placeholder={t("selectDistrict")}
              inputClassName="tw:w-full"
              size="sm"
              disabled={!state || state === "All"}
            />
          )}
        />

        <Controller
          name="town"
          control={control}
          render={({ field }) => (
            <AppSelect
              label={t("town")}
              options={townsOption}
              value={field.value}
              onChange={handleTownChange}
              placeholder={t("selectTown")}
              inputClassName="tw:w-full"
              size="sm"
              disabled={!district || district === "All"}
            />
          )}
        />

        <AppInput
          name="pincode"
          label={t("pincode")}
          placeholder={t("enterPincode")}
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
