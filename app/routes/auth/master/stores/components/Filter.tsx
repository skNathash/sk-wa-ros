import { useCallback, useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { orderBy } from "lodash";
import { useDebouncedCallback } from "use-debounce";
import { useTranslation } from "react-i18next";
import { AppInput } from "~/components/core/form/AppInput";
import { AppSelect } from "~/components/core/form/AppSelect";
import SdtLocation from "~/components/core/sdt/SdtLocation";
import CommonService from "~/services/CommonService";

interface FilterFormData {
  search: string;
  type: string;
  state: string;
  district: string;
  town: string;
}

interface FilterProps {
  callback: (filters: { formData: FilterFormData }) => void;
  className?: string;
}

const typeOptions = [
  { value: "All", label: "All Types" },
  { value: "SK Retailer", label: "SK Retailer" },
  { value: "SK Seller", label: "SK Seller" },
  { value: "SK Buyer", label: "SK Buyer" },
  { value: "SK Master", label: "SK Master" },
];

const defaultValues: FilterFormData = {
  search: "",
  type: "All",
  state: "",
  district: "",
  town: "",
};

const Filter = ({ callback, className }: FilterProps) => {
  const { t } = useTranslation(["common"]);

  const { control, register, getValues, setValue } = useForm<FilterFormData>({
    defaultValues,
  });

  const [statesOption, setStatesOption] = useState<
    { value: string; label: string }[]
  >([]);
  const [districtsOption, setDistrictsOption] = useState<
    { value: string; label: string }[]
  >([]);

  const triggerCallback = useCallback(() => {
    callback({ formData: getValues() });
  }, [callback, getValues]);

  const debouncedSearch = useDebouncedCallback(() => {
    triggerCallback();
  }, 500);

  useEffect(() => {
    const loadStates = async () => {
      const response = await CommonService.getStates();
      const d = orderBy(
        response.data.data?.filter((state: any) => state.isLive),
        "name",
        "asc"
      ).map((state: any) => ({
        value: state.name,
        label: state.name,
      }));
      // prepend an "All States" option with value 'All'
      setStatesOption([{ value: "All", label: "All States" }, ...d]);
    };
    loadStates();
  }, []);

  const onStateChange = async (state: string) => {
    setValue("state", state);
    if (state === "All") {
      // when selecting All states, districts should show an All option only
      setDistrictsOption([{ value: "All", label: "All Districts" }]);
      // set district to All as well so helper can ignore it
      setValue("district", "All");
      triggerCallback();
      return;
    }

    const response = await CommonService.getDistricts(state);
    const d = orderBy(response.data.data, "name", "asc");
    setDistrictsOption([
      { value: "All", label: "All Districts" },
      ...d.map((district: any) => ({
        value: district.name,
        label: district.name,
      })),
    ]);
    setValue("district", "");
    triggerCallback();
  };

  const onDistrictChange = async (district: string) => {
    setValue("district", district);
    triggerCallback();
  };

  return (
    <div
      className={`tw:grid tw:grid-cols-1 tw:md:grid-cols-4 tw:gap-4 ${
        className || ""
      }`}
    >
      <div>
        <AppInput
          name="search"
          placeholder={t("search")}
          register={register}
          onChange={debouncedSearch}
          className="tw:w-full"
        />
      </div>

      <div>
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <AppSelect
              options={typeOptions}
              placeholder={t("type")}
              onChange={(v: string) => {
                field.onChange(v);
                triggerCallback();
              }}
              value={field.value}
              inputClassName="tw:w-full"
            />
          )}
        />
      </div>

      <div>
        <Controller
          name="state"
          control={control}
          render={({ field }) => (
            <AppSelect
              options={statesOption}
              placeholder={t("selectState")}
              onChange={onStateChange}
              value={field.value}
              inputClassName="tw:w-full"
            />
          )}
        />
      </div>

      <div>
        <Controller
          name="district"
          control={control}
          render={({ field }) => (
            <AppSelect
              options={districtsOption}
              onChange={onDistrictChange}
              value={field.value}
              inputClassName="tw:w-full"
              placeholder={t("selectDistrict")}
            />
          )}
        />
      </div>
    </div>
  );
};

export default Filter;
