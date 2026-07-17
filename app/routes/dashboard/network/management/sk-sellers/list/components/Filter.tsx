import debounce from "lodash/debounce";
import { useCallback } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import Alpha from "~/components/core/alpha/Alpha";
import { AppInput, AppSelect } from "~/components/core/form";

interface FilterProps {
  onFilterChange?: (filters: any) => void;
}

const KM_OPTIONS = [
  { value: "5", label: "Within 5 km", langKey: "kmWithin5" },
  { value: "10", label: "Within 10 km", langKey: "kmWithin10" },
  { value: "20", label: "Within 20 km", langKey: "kmWithin20" },
  { value: "30", label: "Within 30 km", langKey: "kmWithin30" },
  { value: "50", label: "Within 50 km", langKey: "kmWithin50" },
];

const Filter = ({ onFilterChange }: FilterProps) => {
  const { t } = useTranslation(["common"]);
  const { register, setValue, getValues, control } = useFormContext();

  const [brands, search, alpha] = useWatch({
    name: ["brands", "search", "alpha"],
    control,
  });

  const triggerCallback = useCallback(() => {
    const formValues = getValues();
    onFilterChange?.({ formData: { ...formValues } });
  }, [getValues, onFilterChange]);

  const debouncedSearch = useCallback(
    debounce(() => {
      triggerCallback();
    }, 400),
    [triggerCallback]
  );

  const handleSearchChange = () => {
    if (alpha) setValue("alpha", "");
    debouncedSearch();
  };

  const handleAlphaChange = (val: string) => {
    setValue("alpha", val || "");
    if (val && search) setValue("search", "");
    triggerCallback();
  };

  const handleBrandChange = (item: any, action?: "add" | "remove") => {
    if (action === "remove") {
      setValue("brands", []);
    } else {
      setValue("brands", item ? [item] : []);
    }
    triggerCallback();
  };

  return (
    <div className="tw:mb-4">
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-3">
        <AppInput
          name="search"
          placeholder={t("searchByNameOrMobile")}
          register={register}
          onChange={handleSearchChange}
          size="sm"
          className="tw:w-full"
        />

        {/* <BrandSearchInput
          placeholder="Search brand"
          feature="product"
          callback={handleBrandChange}
          values={brands || []}
        /> */}

        <Controller
          control={control}
          name="distanceKm"
          render={({ field }) => (
            <AppSelect
              options={KM_OPTIONS}
              value={(field.value ?? "").toString()}
              onChange={(val: string) => {
                field.onChange(val);
                triggerCallback();
              }}
              size="sm"
              inputClassName="tw:w-full"
              placeholder={t("filterByKm")}
            />
          )}
        />

        <div className="tw:md:col-span-4">
          <Alpha selected={alpha || ""} callback={handleAlphaChange} />
        </div>
      </div>
    </div>
  );
};

export default Filter;
