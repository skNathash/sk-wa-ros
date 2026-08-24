import { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppliedFilter from "~/components/core/applied-filters/AppliedFilter";
import type { AppliedFilterLabel } from "~/types/CommonTypes";

interface AppliedFiltersProps {
  onRemove: (key: string) => void;
}

const AppliedFilters = ({ onRemove }: AppliedFiltersProps) => {
  const { t } = useTranslation(["common"]);
  const { getValues } = useFormContext();
  const formValues = getValues();

  const filterMapping: Record<string, AppliedFilterLabel> = {
    search: {
      label: t("search"),
      resetValue: "",
    },
  };

  const handleAppliedFilterRemove = useCallback(
    ({ action, data }: { action: string; data?: any }) => {
      if (action === "remove" && data?.key) {
        onRemove(data.key);
      }
    },
    [onRemove],
  );

  return (
    <AppliedFilter
      filter={formValues}
      callback={handleAppliedFilterRemove}
      mapping={filterMapping}
      className="tw:mt-2"
    />
  );
};

export default AppliedFilters;
