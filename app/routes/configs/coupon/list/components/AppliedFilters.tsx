import { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { useSearchParams } from "react-router";
import AppliedFilter from "~/components/core/applied-filters/AppliedFilter";
import type { AppliedFilterLabel } from "~/types/CommonTypes";
import { filterToSearchParams } from "../helper";
import type { CouponFilterFields } from "./Filter";

const defaultFilterValues: CouponFilterFields = {
  search: "",
  applicableFor: "",
  discountKind: "",
  status: "",
  isActive: "",
  validityRange: [],
};

// Friendly labels for the coded filter values.
const discountKindLabels: Record<string, string> = {
  PERCENT: "Percent",
  FLAT: "Fixed",
};

const isActiveLabels: Record<string, string> = {
  true: "Active",
  false: "Inactive",
};

// Mapping config consumed by the core AppliedFilter component.
const filterMapping: Record<string, AppliedFilterLabel> = {
  search: { label: "Search", resetValue: defaultFilterValues.search },
  applicableFor: {
    label: "Applicable For",
    resetValue: defaultFilterValues.applicableFor,
  },
  discountKind: {
    label: "Discount Kind",
    resetValue: defaultFilterValues.discountKind,
  },
  status: { label: "Status", resetValue: defaultFilterValues.status },
  isActive: { label: "Active", resetValue: defaultFilterValues.isActive },
  validityRange: {
    label: "Validity",
    type: "dateRange",
    resetValue: defaultFilterValues.validityRange,
    dateFormat: "dd MMM yyyy",
  },
};

const AppliedFilters = () => {
  const { getValues, setValue } = useFormContext<CouponFilterFields>();
  const [, setSearchParams] = useSearchParams();

  // Map raw coded values to user-friendly labels for display.
  const transformFilterValues = useCallback(
    (formData: CouponFilterFields): Record<string, any> => {
      const transformed: Record<string, any> = { ...formData };

      if (transformed.discountKind) {
        transformed.discountKind =
          discountKindLabels[transformed.discountKind] ||
          transformed.discountKind;
      }
      if (transformed.isActive) {
        transformed.isActive =
          isActiveLabels[transformed.isActive] || transformed.isActive;
      }

      return transformed;
    },
    [],
  );

  const handleFilterCallback = useCallback(
    (result: { action: string; data?: any }) => {
      if (result.action === "remove" && result.data) {
        const { key, config } = result.data;
        setValue(
          key as keyof CouponFilterFields,
          config?.resetValue ??
            defaultFilterValues[key as keyof CouponFilterFields],
        );
        setSearchParams(filterToSearchParams(getValues()));
      }
    },
    [setValue, getValues, setSearchParams],
  );

  const transformedData = transformFilterValues(getValues());

  return (
    <AppliedFilter
      filter={transformedData}
      callback={handleFilterCallback}
      mapping={filterMapping}
      className="tw:mb-4 tw:mt-3"
    />
  );
};

export default AppliedFilters;
