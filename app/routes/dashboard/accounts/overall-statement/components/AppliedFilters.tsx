import { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppliedFilter from "~/components/core/applied-filters/AppliedFilter";
import AccountService from "~/services/AccountService";
import type { AppliedFilterLabel } from "~/types/CommonTypes";
import {
  defaultFilter,
  prepareFilterQueryParams,
  type FilterFormData,
} from "../helper";

const AppliedFilters = () => {
  const { t } = useTranslation();
  const { getValues, setValue } = useFormContext<FilterFormData>();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get source type options for label mapping
  const sourceTypes = AccountService.getSourceTypeOptions();
  const sourceTypeLabels: Record<string, string> = {};
  sourceTypes.forEach((opt) => {
    sourceTypeLabels[opt.value] = opt.label;
  });
  sourceTypeLabels["All"] = t("all");

  // Get type labels
  const typeLabels: Record<string, string> = {
    All: t("all"),
    credit: t("credit"),
    debit: t("debit"),
  };

  // Create mapping for filters. `dateRange` is intentionally not mapped: the
  // accounts layout already renders the active range as a date pill directly
  // above this block, so a second chip here only duplicates it.
  const filterMapping: Record<string, AppliedFilterLabel> = {
    type: {
      label: t("type"),
      resetValue: defaultFilter.type,
      ignoreValue: "All",
    },
    sourceType: {
      label: t("sourceTypeLbl"),
      resetValue: defaultFilter.sourceType,
      ignoreValue: "All",
    },
  };

  // Transform filter values to show proper labels
  const transformFilterValues = useCallback(
    (formData: FilterFormData): Record<string, any> => {
      const transformed: Record<string, any> = { ...formData };

      // Transform type value to label
      if (transformed.type && transformed.type !== "All") {
        transformed.type = typeLabels[transformed.type] || transformed.type;
      }

      // Transform sourceType value to label
      if (transformed.sourceType && transformed.sourceType !== "All") {
        transformed.sourceType =
          sourceTypeLabels[transformed.sourceType] || transformed.sourceType;
      }

      return transformed;
    },
    [typeLabels, sourceTypeLabels]
  );

  const handleFilterCallback = useCallback(
    (result: { action: string; data?: any }) => {
      if (result.action === "remove" && result.data) {
        const { key, config } = result.data;

        // Reset the filter value
        if (config?.resetValue !== undefined) {
          setValue(key as keyof FilterFormData, config.resetValue);
        } else {
          // Fallback to default reset values
          if (key === "type") {
            setValue("type", defaultFilter.type);
          } else if (key === "sourceType") {
            setValue("sourceType", defaultFilter.sourceType);
          } else if (key === "dateRange") {
            setValue("dateRange", defaultFilter.dateRange);
          }
        }

        // Update search params to trigger filter change
        const formData = getValues();
        const params = prepareFilterQueryParams(formData);

        // Preserve existing URL parameters that should not be removed
        const tab = searchParams.get("tab");

        if (tab) {
          params.tab = tab;
        }

        setSearchParams(params);
      }
    },
    [setValue, getValues, setSearchParams]
  );

  const formData = getValues();
  // Transform values for display (type and sourceType labels)
  const transformedData = transformFilterValues(formData);

  return (
    <AppliedFilter
      filter={transformedData}
      callback={handleFilterCallback}
      mapping={filterMapping}
    />
  );
};

export default AppliedFilters;
