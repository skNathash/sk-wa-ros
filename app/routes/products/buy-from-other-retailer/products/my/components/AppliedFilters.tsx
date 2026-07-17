import { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppliedFilter from "~/components/core/applied-filters/AppliedFilter";
import type { AppliedFilterLabel } from "~/types/CommonTypes";
import { defaultFilter, type FilterType } from "../helper";

interface AppliedFiltersProps {
  callback?: (params: { action: string; data?: any }) => void;
}

const AppliedFilters = ({ callback }: AppliedFiltersProps) => {
  const { t } = useTranslation(["common", "inventorySubscribe"]);
  const { getValues } = useFormContext<FilterType>();

  // Create mapping for filters
  const filterMapping: Record<string, AppliedFilterLabel> = {
    search: {
      label: t("search") || "Search",
      resetValue: defaultFilter.search,
      ignoreValue: "",
    },
    menu: {
      label: "Menu",
      resetValue: defaultFilter.menu,
      value: {
        path: "0.label", // Extract label from first item
      },
    },
    category: {
      label: "Categories",
      resetValue: defaultFilter.category,
      value: {
        isMulti: true,
        path: "label", // Extract labels from all items
      },
    },
    brand: {
      label: "Brands",
      resetValue: defaultFilter.brand,
      value: {
        isMulti: true,
        path: "label", // Extract labels from all items
      },
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
            : defaultFilter[key as keyof typeof defaultFilter];

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
