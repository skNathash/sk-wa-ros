import { useCallback } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppliedFilter from "~/components/core/applied-filters/AppliedFilter";
import type { AppliedFilterLabel } from "~/types/CommonTypes";

interface VendorAppliedFilterProps {
  callback: (r: { action: string; data?: any }) => void;
}

const VendorAppliedFilter = ({ callback }: VendorAppliedFilterProps) => {
  const { t } = useTranslation(["common"]);
  const { control, setValue } = useFormContext();

  const watchedFilters = useWatch({ control });

  const filterMapping: Record<string, AppliedFilterLabel> = {
    brand: {
      label: t("brand") || "Brand",
      resetValue: null,
      value: { isMulti: true, path: "label" },
    },
    status: {
      label: t("status") || "Status",
      resetValue: "All",
      ignoreValue: "All",
    },
    // createdBy: {
    //   label: t("createdBy") || "Created By",
    //   resetValue: "All",
    //   ignoreValue: "All",
    // },
    alpha: {
      label: t("alpha") || "Alpha",
      resetValue: "",
    },
    search: {
      label: t("search") || "Search",
      resetValue: "",
    },
    distance: {
      label: t("distance") || "Distance",
      resetValue: "any",
      ignoreValue: "any",
    },
  };

  const handleAppliedFilterRemove = useCallback(
    ({ action, data }: { action: string; data?: any }) => {
      if (action === "remove" && data?.key) {
        const resetValue = filterMapping[data.key]?.resetValue;
        if (resetValue !== undefined) {
          setValue(data.key, resetValue);
        }

        // Notify parent so it can update URL/search params
        callback({ action: "remove", data });
      }
    },
    [setValue, callback, filterMapping],
  );

  return (
    <AppliedFilter
      filter={watchedFilters}
      callback={handleAppliedFilterRemove}
      mapping={filterMapping}
      className="tw:mb-1"
    />
  );
};

export default VendorAppliedFilter;
