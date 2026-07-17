import { useCallback } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppliedFilter from "~/components/core/applied-filters/AppliedFilter";
import type { AppliedFilterLabel } from "~/types/CommonTypes";

interface AppliedFiltersProps {
  onFilterChange: (filters: { formData: any }) => void;
  className?: string;
}

const AppliedFilters = ({
  onFilterChange,
  className = "",
}: AppliedFiltersProps) => {
  const { t } = useTranslation(["common"]);
  const { control, setValue, getValues } = useFormContext();

  // Watch form values to make the filter reactive
  const watchedFilters = useWatch({
    control,
  });

  // Filter mapping for the applied filter component
  const filterMapping: Record<string, AppliedFilterLabel> = {
    franchise: {
      label: "Retailer",
      resetValue: null,
      value: { isMulti: true, path: "label" },
    },
    state: {
      label: t("state"),
      resetValue: "",
      ignoreValue: "All",
    },
    district: {
      label: t("district"),
      resetValue: "",
      ignoreValue: "All",
    },
    town: {
      label: t("town"),
      resetValue: "",
      ignoreValue: "All",
    },
    networkType: {
      label: "Network Type",
      resetValue: "all",
      ignoreValue: "all",
    },
    planPurchased: {
      label: "Plan Purchased",
      resetValue: "all",
      ignoreValue: "all",
    },
    dateRange: {
      label: t("dateRange"),
      resetValue: [],
      type: "dateRange",
      showCloseIcon: false,
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
    [setValue, getValues, filterMapping, onFilterChange],
  );

  return (
    <AppliedFilter
      filter={watchedFilters}
      callback={handleAppliedFilterRemove}
      mapping={filterMapping}
      className={className}
    />
  );
};

export default AppliedFilters;
