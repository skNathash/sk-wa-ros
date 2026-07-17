import { useCallback, useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppliedFilter from "~/components/core/applied-filters/AppliedFilter";
import SellerCatalogService from "~/services/SellerCatalogService";
import type { FilterFormFields } from "../helper";
import { filterLabels } from "../helper";

interface RspAppliedFilterProps {
  onFilterChange: (filters: { formData: FilterFormFields }) => void;
}

const RspAppliedFilter = ({ onFilterChange }: RspAppliedFilterProps) => {
  const { t } = useTranslation(["common"]);
  const { control, setValue, getValues } = useFormContext<FilterFormFields>();

  // Watch form values to make the filter reactive
  const watchedFilters = useWatch({
    control,
  });

  // Create velocity label mapping
  const velocityLabelMap = useMemo(() => {
    const map: Record<string, string> = {};

    // Map movement types
    const movementTypes = SellerCatalogService.getMovementTypes();
    movementTypes.forEach((type) => {
      // Map both value and key to translated label
      map[type.value] = t(type.key) || type.label;
      map[type.key] = t(type.key) || type.label;
    });

    // Map special velocity values
    map["outOfStock"] = t("outOfStockLabel") || "Out of Stock";
    map["subscribedByCustomer"] =
      t("subscribedByCustomer") || "Subscribed by Customer";
    map["consumerOffer"] = t("consumerOffer") || "Consumer Offer";

    return map;
  }, [t]);

  // Create stock status label mapping
  const stockStatusLabelMap = useMemo(() => {
    const map: Record<string, string> = {};

    // Map stock status types
    const stockStatusTypes = SellerCatalogService.getStockStatusTypes();
    stockStatusTypes.forEach((type: any) => {
      map[type.value] = t(type.key) || type.label;
    });

    return map;
  }, [t]);

  // Transform filter values to show proper labels
  const transformFilterValues = useCallback(
    (formData: Record<string, any>): Record<string, any> => {
      const transformed: Record<string, any> = { ...formData };

      // Transform velocity value to label
      if (transformed.velocity && transformed.velocity !== "All") {
        transformed.velocity =
          velocityLabelMap[transformed.velocity] || transformed.velocity;
      }

      // Transform stockStatus value to label
      if (transformed.stockStatus && transformed.stockStatus !== "All") {
        transformed.stockStatus =
          stockStatusLabelMap[transformed.stockStatus] ||
          transformed.stockStatus;
      }

      return transformed;
    },
    [velocityLabelMap, stockStatusLabelMap]
  );

  // Handle applied filter removal
  const handleAppliedFilterRemove = useCallback(
    ({ action, data }: { action: string; data?: any }) => {
      if (action === "remove" && data?.key) {
        const resetValue = filterLabels[data.key]?.resetValue;

        // Reset the filter value to its default
        if (resetValue !== undefined) {
          setValue(data.key as keyof FilterFormFields, resetValue as any);
        }

        // Trigger filter change to update URL params and refresh data
        onFilterChange({ formData: getValues() });
      }
    },
    [setValue, getValues, filterLabels, onFilterChange]
  );

  // Transform values for display
  const transformedFilters = transformFilterValues(watchedFilters);

  return (
    <AppliedFilter
      filter={transformedFilters}
      callback={handleAppliedFilterRemove}
      mapping={filterLabels}
      className="tw:mt-2"
    />
  );
};

export default RspAppliedFilter;
