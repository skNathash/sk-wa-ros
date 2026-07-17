import { useCallback, useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppliedFilter from "~/components/core/applied-filters/AppliedFilter";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import type { AppliedFilterLabel } from "~/types/CommonTypes";
import { purchasedFromOptions } from "../helper";

interface SummaryPoAppliedFilterProps {
  onFilterChange: (filters: { formData: any }) => void;
}

const SummaryPoAppliedFilter = ({
  onFilterChange,
}: SummaryPoAppliedFilterProps) => {
  const { t } = useTranslation(["common"]);
  const { control, setValue, getValues } = useFormContext();

  // Watch form values to make the filter reactive
  const watchedFilters = useWatch({
    control,
  });

  const groupByType = watchedFilters?.groupByType;

  // Create status label mapping
  const statusLabelMap = useMemo(() => {
    const map: Record<string, string> = {};

    const statuses = PurchaseOrderService.getStatuses();
    statuses.forEach((status) => {
      map[status.value] = t(status.langKey) || status.label;
    });

    return map;
  }, [t]);

  // Create type label mapping
  const typeLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    purchasedFromOptions.forEach((option) => {
      if (option.value !== "All") {
        map[option.value] = option.label;
      }
    });
    return map;
  }, [watchedFilters.purchasedFrom]);

  // Transform filter values to show proper labels
  const transformFilterValues = useCallback(
    (formData: Record<string, any>): Record<string, any> => {
      const transformed: Record<string, any> = { ...formData };

      // Transform status value to label
      if (transformed.status && transformed.status !== "All") {
        transformed.status =
          statusLabelMap[transformed.status] || transformed.status;
      }

      // Transform purchasedFrom (type) value to label
      if (transformed.purchasedFrom && transformed.purchasedFrom !== "All") {
        transformed.purchasedFrom =
          typeLabelMap[transformed.purchasedFrom] || transformed.purchasedFrom;
      }

      return transformed;
    },
    [statusLabelMap, typeLabelMap]
  );

  // Filter mapping for the applied filter component
  const filterMapping: Record<string, AppliedFilterLabel> = {
    dateRange: {
      label:
        groupByType === "receiveds"
          ? t("receivedDateRange") || "Received Date Range"
          : t("dateRange") || "Date Range",
      resetValue: [],
      type: "dateRange",
      showCloseIcon: false,
    },
    status: {
      label: t("status") || "Status",
      resetValue: "All",
      ignoreValue: "All", // Don't display filter when value is "All"
    },
    purchasedFrom: {
      label: t("type") || "Type",
      resetValue: "All",
      ignoreValue: "All", // Don't display filter when value is "All"
    },
  };

  // Handle applied filter removal
  const handleAppliedFilterRemove = useCallback(
    ({ action, data }: { action: string; data?: any }) => {
      if (action === "remove" && data?.key) {
        const resetValue = filterMapping[data.key]?.resetValue;

        // Reset the filter value to its default
        if (resetValue !== undefined) {
          setValue(data.key as any, resetValue);
        }

        // Trigger filter change to update URL params and refresh data
        onFilterChange({ formData: getValues() });
      }
    },
    [setValue, getValues, filterMapping, onFilterChange]
  );

  // Transform values for display
  const transformedFilters = transformFilterValues(watchedFilters);

  return (
    <AppliedFilter
      filter={transformedFilters}
      callback={handleAppliedFilterRemove}
      mapping={filterMapping}
      className="tw:mt-2"
    />
  );
};

export default SummaryPoAppliedFilter;
