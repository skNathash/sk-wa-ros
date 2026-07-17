import { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { useSearchParams } from "react-router";
import AppliedFilter from "~/components/core/applied-filters/AppliedFilter";
import type { AppliedFilterLabel } from "~/types/CommonTypes";

const statusOptions: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
};

const filterMapping: Record<string, AppliedFilterLabel> = {
  validityDateRange: {
    label: "Validity Date",
    type: "dateRange",
    resetValue: undefined,
    dateFormat: "dd MMM yyyy",
  },
  createdDateRange: {
    label: "Created Date",
    type: "dateRange",
    resetValue: undefined,
    dateFormat: "dd MMM yyyy",
  },
  status: {
    label: "Status",
    resetValue: "all",
    ignoreValue: "all",
  },
};

const AppliedFilters = () => {
  const { getValues, setValue } = useFormContext();
  const [, setSearchParams] = useSearchParams();

  const transformFilterValues = useCallback(
    (formData: Record<string, any>): Record<string, any> => {
      const transformed = { ...formData };
      if (transformed.status && transformed.status !== "all") {
        transformed.status =
          statusOptions[transformed.status] || transformed.status;
      }
      return transformed;
    },
    [],
  );

  const handleFilterCallback = useCallback(
    (result: { action: string; data?: any }) => {
      if (result.action === "remove" && result.data) {
        const { key, config } = result.data;

        setValue(key, config?.resetValue);

        // Update search params
        setSearchParams(
          (prev) => {
            const p = new URLSearchParams(prev);
            if (key === "validityDateRange") {
              p.delete("validityFrom");
              p.delete("validityTo");
            } else if (key === "createdDateRange") {
              p.delete("createdFrom");
              p.delete("createdTo");
            } else if (key === "status") {
              p.delete("status");
            }
            return p;
          },
          { replace: true } as any,
        );
      }
    },
    [setValue, setSearchParams],
  );

  const formData = getValues();
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
