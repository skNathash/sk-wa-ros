import { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppliedFilter from "~/components/core/applied-filters/AppliedFilter";
import OmsService from "~/services/OmsService";
import type { AppliedFilterLabel } from "~/types/CommonTypes";
import {
  defaultFilter,
  prepareFilterQueryParams,
  type FilterFormData,
} from "../helper";

const AppliedFilters = () => {
  const { t } = useTranslation(["common"]);
  const { getValues, setValue } = useFormContext<FilterFormData>();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get status options for label mapping
  const statusOptions = OmsService.getOrderStatuses();
  const paymentMethodLabels: Record<string, string> = {
    PAYLATER: t("paylater"),
    COD: t("cod"),
  };

  // Create mapping for filters
  const filterMapping: Record<string, AppliedFilterLabel> = {
    dateRange: {
      label: t("dateRange") || "Date Range",
      type: "dateRange",
      resetValue: defaultFilter.dateRange,
      dateFormat: "dd MMM yyyy",
    },
    status: {
      label: t("status"),
      resetValue: defaultFilter.status,
      ignoreValue: "all",
    },
    paymentMethod: {
      label: t("paymentMethod"),
      resetValue: defaultFilter.paymentMethod,
      ignoreValue: "all",
    },
    paymentStatus: {
      label: t("paymentStatus"),
      resetValue: (defaultFilter as any).paymentStatus,
      ignoreValue: "all",
    },
    orderSubType: {
      label: "Order Sub Type",
      resetValue: defaultFilter.orderSubType,
      ignoreValue: "all",
    },
  };

  // Transform filter values to show proper labels
  const transformFilterValues = useCallback(
    (formData: FilterFormData): Record<string, any> => {
      const transformed: Record<string, any> = { ...formData };

      // Transform status value to label (keep original value for ignoreValue check)
      if (transformed.status && transformed.status !== "all") {
        const statusOption = statusOptions.find(
          (opt) => opt.value === transformed.status,
        );
        if (statusOption) {
          transformed.status = statusOption.name;
        }
      }

      // Transform paymentMethod value to label (keep original value for ignoreValue check)
      if (transformed.paymentMethod && transformed.paymentMethod !== "all") {
        transformed.paymentMethod =
          paymentMethodLabels[transformed.paymentMethod] ||
          transformed.paymentMethod;
      }

      // Transform paymentStatus to user-friendly label
      if (transformed.paymentStatus && transformed.paymentStatus !== "all") {
        if (transformed.paymentStatus === "Approval Pending") {
          transformed.paymentStatus =
            t("approvalPending") || "Approval Pending";
        } else if (transformed.paymentStatus === "Paid") {
          transformed.paymentStatus = t("paid") || "Paid";
        } else if (transformed.paymentStatus === "Unpaid") {
          transformed.paymentStatus = t("unpaid") || "Unpaid";
        } else if (transformed.paymentStatus === "Rejected") {
          transformed.paymentStatus = t("rejected") || "Rejected";
        }
      }

      if (transformed.orderSubType === "RESERVE") {
        transformed.orderSubType = "Reserve Orders";
      }

      if (transformed.orderSubType === "QUICKCHECKOUT") {
        transformed.orderSubType = "Quick Checkout Orders";
      }

      return transformed;
    },
    [statusOptions, paymentMethodLabels],
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
          if (key === "status") {
            setValue("status", defaultFilter.status);
          } else if (key === "paymentStatus") {
            setValue("paymentStatus", (defaultFilter as any).paymentStatus);
          } else if (key === "paymentMethod") {
            setValue("paymentMethod", defaultFilter.paymentMethod);
          } else if (key === "dateRange") {
            setValue("dateRange", defaultFilter.dateRange);
          }
        }

        // Update search params to trigger filter change
        const formData = getValues();
        const currentTab = searchParams.get("tab");
        const params = prepareFilterQueryParams(formData, currentTab);
        setSearchParams(params);
      }
    },
    [setValue, getValues, searchParams, setSearchParams],
  );

  const formData = getValues();
  // Transform values for display (status and paymentMethod labels)
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
