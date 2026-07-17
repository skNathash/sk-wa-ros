import { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppliedFilter from "~/components/core/applied-filters/AppliedFilter";
import type { AppliedFilterLabel } from "~/types/CommonTypes";
import { defaultFilterValues, type FilterFormFields } from "../helper";

interface AppliedFiltersProps {
  callback?: (params: { action: string; data?: any }) => void;
}

const AppliedFilters = ({ callback }: AppliedFiltersProps) => {
  const { t } = useTranslation(["common", "inventorySubscribe"]);
  const { getValues } = useFormContext<FilterFormFields>();

  // Create mapping for filters
  const filterMapping: Record<string, AppliedFilterLabel> = {
    search: {
      label: t("search") || "Search",
      resetValue: defaultFilterValues.search,
      ignoreValue: "",
    },
    menu: {
      label: "Menu",
      resetValue: defaultFilterValues.menu,
      value: {
        isMulti: true,
        path: "label", // Extract labels from all items
      },
    },
    categories: {
      label: "Categories",
      resetValue: defaultFilterValues.categories,
      value: {
        isMulti: true,
        path: "label", // Extract labels from all items
      },
    },
    brands: {
      label: "Brands",
      resetValue: defaultFilterValues.brands,
      value: {
        isMulti: true,
        path: "label", // Extract labels from all items
      },
    },
    companyName: {
      label: "Company Name",
      resetValue: defaultFilterValues.companyName,
      value: {
        isMulti: true,
        path: "label", // Extract labels from all items
      },
    },
    searchType: {
      label: "Search Type",
      resetValue: defaultFilterValues.searchType,
      ignoreValue: "Products",
    },
    onlyOffers: {
      label: "Consumer Offers",
      resetValue: defaultFilterValues.onlyOffers,
      ignoreValue: false,
    },
    isGroupDeal: {
      label: t("onlyMultipleVariants") || "Only Group Deal",
      resetValue: defaultFilterValues.isGroupDeal,
      ignoreValue: false,
    },
    productsWithImages: {
      label: "Items With Images",
      resetValue: defaultFilterValues.productsWithImages,
      ignoreValue: false,
    },
    productsWithoutImages: {
      label: "Items Without Images",
      resetValue: defaultFilterValues.productsWithoutImages,
      ignoreValue: false,
    },
    onlyNotSubscribed: {
      label: "Show Only Not Subscribed",
      resetValue: defaultFilterValues.onlyNotSubscribed,
      ignoreValue: false,
    },
  };

  const handleFilterCallback = useCallback(
    (result: { action: string; data?: any }) => {
      if (result.action === "remove" && result.data) {
        const { key, config } = result.data;

        // Get current form data
        const formData = { ...getValues() };

        // Update the removed key value to its default
        const resetValue =
          config?.resetValue !== undefined
            ? config.resetValue
            : defaultFilterValues[key as keyof FilterFormFields];

        (formData as any)[key] = resetValue;

        // Call the callback with updated form data
        if (callback) {
          callback({
            action: "filter-removed",
            data: {
              key,
              formData,
            },
          });
        }
      }
    },
    [getValues, callback],
  );

  const formData = getValues();

  return (
    <AppliedFilter
      filter={formData}
      callback={handleFilterCallback}
      mapping={filterMapping}
      className="tw:mb-2"
    />
  );
};

export default AppliedFilters;
