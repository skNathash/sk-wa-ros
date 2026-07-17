import { useCallback } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppliedFilter from "~/components/core/applied-filters/AppliedFilter";
import type { AppliedFilterLabel } from "~/types/CommonTypes";

interface Props {
  onFilterChange?: (filters: { formData: any }) => void;
}

const ProductAppliedFilter = ({ onFilterChange }: Props) => {
  const { t } = useTranslation(["common"]);
  const { control, setValue } = useFormContext();

  const watchedFilters = useWatch({ control });

  const filterMapping: Record<string, AppliedFilterLabel> = {
    brand: {
      label: t("brand") || "Brand",
      resetValue: null,
      value: { isMulti: true, path: "label" },
    },
    category: {
      label: t("category") || "Category",
      resetValue: null,
      value: { isMulti: true, path: "label" },
    },
    alpha: {
      label: t("alpha") || "Alpha",
      resetValue: "",
    },
    search: {
      label: t("search") || "Search",
      resetValue: "",
    },
  };

  const handleAppliedFilterRemove = useCallback(
    ({ action, data }: { action: string; data?: any }) => {
      if (action === "remove" && data?.key) {
        const resetValue = filterMapping[data.key]?.resetValue;
        if (resetValue !== undefined) {
          setValue(data.key, resetValue);
        }

        if (onFilterChange)
          onFilterChange({ formData: { [data.key]: resetValue } });
      }
    },
    [setValue, onFilterChange, filterMapping]
  );

  return (
    <AppliedFilter
      filter={watchedFilters}
      callback={handleAppliedFilterRemove}
      mapping={filterMapping}
      className="tw:mb-2"
    />
  );
};

export default ProductAppliedFilter;
