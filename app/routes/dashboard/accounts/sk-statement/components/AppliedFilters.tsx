import { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppliedFilter from "~/components/core/applied-filters/AppliedFilter";
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

  // Get payout type labels
  const payoutTypeLabels: Record<string, string> = {
    all: t("allEntry") || "All Entry",
    Credit: t("credit") || "Credit",
    Debit: t("debit") || "Debit",
  };

  // Create mapping for filters
  const filterMapping: Record<string, AppliedFilterLabel> = {
    dateRange: {
      label: t("dateRange") || "Date Range",
      type: "dateRange",
      resetValue: defaultFilter.dateRange,
      dateFormat: "dd MMM yyyy",
      showCloseIcon: false,
    },
    payoutType: {
      label: t("entry") || "Entry",
      resetValue: defaultFilter.payoutType,
      ignoreValue: "all",
    },
  };

  // Transform filter values to show proper labels
  const transformFilterValues = useCallback(
    (formData: FilterFormData): Record<string, any> => {
      const transformed: Record<string, any> = { ...formData };

      // Transform payoutType value to label
      if (transformed.payoutType && transformed.payoutType !== "all") {
        transformed.payoutType =
          payoutTypeLabels[transformed.payoutType] || transformed.payoutType;
      }

      return transformed;
    },
    [payoutTypeLabels]
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
          if (key === "payoutType") {
            setValue("payoutType", defaultFilter.payoutType);
          } else if (key === "dateRange") {
            setValue("dateRange", defaultFilter.dateRange);
          }
        }

        // Update search params to trigger filter change
        const formData = getValues();
        const params = prepareFilterQueryParams(formData);

        // Preserve existing URL parameters that should not be removed
        const tab = searchParams.get("tab");
        const dateFrom = searchParams.get("dateFrom");
        const dateTo = searchParams.get("dateTo");

        if (tab) {
          params.tab = tab;
        }
        if (dateFrom) {
          params.dateFrom = dateFrom;
        }
        if (dateTo) {
          params.dateTo = dateTo;
        }

        setSearchParams(params);
      }
    },
    [setValue, getValues, setSearchParams, searchParams]
  );

  const formData = getValues();
  // Transform values for display (payoutType labels)
  const transformedData = transformFilterValues(formData);

  return (
    <AppliedFilter
      filter={transformedData}
      callback={handleFilterCallback}
      mapping={filterMapping}
      className="tw:mb-4"
    />
  );
};

export default AppliedFilters;
