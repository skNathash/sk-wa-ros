import { debounce } from "lodash";
import { useCallback, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import Alpha from "~/components/core/alpha/Alpha";
import AppButton from "~/components/core/button/AppButton";
import { AppInput } from "~/components/core/form/AppInput";
import useScreenView from "~/hooks/useScreenView";
import BrandSearchInput from "~/shared/catalog/components/search-input/brand/BrandSearchInput";
import CategorySearchInput from "~/shared/catalog/components/search-input/category/CategorySearchInput";
import { useTranslation } from "react-i18next";

interface FilterFormData {
  search: string;
  category: any;
  brand: any;
  alpha?: string;
}

interface FilterProps {
  callback: (filters: { formData: FilterFormData }) => void;
  className?: string;
}

const Filter = ({ callback, className }: FilterProps) => {
  const { t } = useTranslation(["common"]);
  const { isMobile } = useScreenView();
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const { control, setValue, getValues, register } = useForm<FilterFormData>({
    defaultValues: {
      search: "",
      category: null,
      brand: null,
      alpha: "",
    },
  });

  // Watch form values for changes using array destructuring
  const [category, brand, alpha] = useWatch({
    control,
    name: ["category", "brand", "alpha"],
  });

  // Trigger callback function
  const triggerCallback = () => {
    callback({ formData: getValues() });
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(() => {
      triggerCallback();
    }, 500),
    [triggerCallback]
  );

  // Handle category selection
  const handleCategoryChange = (item: any, action: "add" | "remove") => {
    if (action === "add") {
      setValue("category", item);
    } else {
      setValue("category", null);
    }
    triggerCallback();
  };

  // Handle brand selection
  const handleBrandChange = (item: any, action: "add" | "remove") => {
    if (action === "add") {
      setValue("brand", item);
    } else {
      setValue("brand", null);
    }
    triggerCallback();
  };

  // Handle alpha selection
  const handleAlphaChange = (value: string) => {
    setValue("alpha", value);
    triggerCallback();
  };

  // Toggle mobile filters
  const toggleMobileFilters = () => {
    setShowMobileFilters(!showMobileFilters);
  };

  return (
    <div className={`tw:space-y-4 ${className || ""}`}>
      {/* Search Input - Full Row */}
      <div className="tw:w-full">
        <AppInput
          name="search"
          placeholder="Search by name, ID"
          register={register}
          onChange={debouncedSearch}
          className="tw:w-full"
        />
      </div>

      {/* Mobile Filter Toggle Button */}
      {isMobile && (
        <div className="tw:w-full">
          <AppButton
            fill="outline"
            color="light"
            size="small"
            onClick={toggleMobileFilters}
            className="tw:w-full"
          >
            {showMobileFilters ? t("hideFilters") : t("showMoreFilters")}
          </AppButton>
        </div>
      )}

      {/* Filter Options - Grid Layout */}
      <div
        className={`tw:grid tw:gap-4 ${
          isMobile
            ? showMobileFilters
              ? "tw:grid-cols-1"
              : "tw:hidden"
            : "tw:grid-cols-3"
        }`}
      >
        {/* Category Search */}
        <div>
          <CategorySearchInput
            multiSelect={false}
            callback={handleCategoryChange}
            values={category ? [category] : []}
            feature="pos"
            placeholder="Search categories..."
            size="sm"
          />
        </div>

        {/* Brand Search */}
        <div>
          <BrandSearchInput
            multiSelect={false}
            callback={handleBrandChange}
            values={brand ? [brand] : []}
            feature="pos"
            placeholder="Search brands..."
            size="sm"
          />
        </div>
      </div>

      {/* Alpha Navigation */}
      <Alpha
        selected={alpha || ""}
        callback={handleAlphaChange}
        className="tw:mb-4"
      />
    </div>
  );
};

export default Filter;
