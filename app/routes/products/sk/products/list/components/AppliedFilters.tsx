import { useCallback } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppliedFilter from "~/components/core/applied-filters/AppliedFilter";
import type { AppliedFilterLabel } from "~/types/CommonTypes";

type FilterFormFields = {
  menu?: Array<any>;
  category?: Array<any>;
  brand?: Array<any>;
};

interface Props {
  onFilterChange: (filters: { formData: FilterFormFields }) => void;
}

const AppliedFilters = ({ onFilterChange }: Props) => {
  const { t } = useTranslation(["common"]);
  const { control, setValue, getValues } = useFormContext<FilterFormFields>();

  const watchedFilters = useWatch({ control });

  const filterMapping: Record<string, AppliedFilterLabel> = {
    menu: {
      label: t("menu"),
      resetValue: null,
      value: {
        isMulti: true,
        path: "label",
      },
    },
    category: {
      label: t("category"),
      resetValue: null,
      value: {
        isMulti: true,
        path: "label",
      },
    },
    brand: {
      label: t("brand"),
      resetValue: null,
      value: {
        isMulti: true,
        path: "label",
      },
    },
  };

  const handleAppliedFilterRemove = useCallback(
    ({ action, data }: { action: string; data?: any }) => {
      if (action === "remove" && data?.key) {
        const resetValue = filterMapping[data.key]?.resetValue;
        if (resetValue !== undefined) {
          setValue(data.key as keyof FilterFormFields, resetValue as any);
        }

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
      className="tw:mb-4"
    />
  );
};

export default AppliedFilters;
