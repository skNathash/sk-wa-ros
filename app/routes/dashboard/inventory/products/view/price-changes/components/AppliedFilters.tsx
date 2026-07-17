import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import AppliedFilter from "~/components/core/applied-filters/AppliedFilter";
import type { AppliedFilterLabel } from "~/types/CommonTypes";

interface AppliedFiltersProps {
  filters: Record<string, any>;
  onRemove: (key: string) => void;
}

const AppliedFilters = ({ filters, onRemove }: AppliedFiltersProps) => {
  const { t } = useTranslation(["common"]);

  const filterMapping: Record<string, AppliedFilterLabel> = {
    search: {
      label: t("search"),
      resetValue: "",
    },
    type: {
      label: t("type"),
      resetValue: "All",
      ignoreValue: "All",
    },
    isFixedPrice: {
      label: t("fixedPrice"),
      resetValue: false,
      ignoreValue: false,
    },
    dateRange: {
      label: t("dateRange"),
      resetValue: [],
      type: "dateRange",
    },
  };

  const handleAppliedFilterRemove = useCallback(
    ({ action, data }: { action: string; data?: any }) => {
      if (action === "remove" && data?.key) {
        onRemove(data.key);
      }
    },
    [onRemove]
  );

  return (
    <AppliedFilter
      filter={filters}
      callback={handleAppliedFilterRemove}
      mapping={filterMapping}
      className="tw:mt-2"
    />
  );
};

export default AppliedFilters;
