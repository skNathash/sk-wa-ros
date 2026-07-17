import { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppliedFilter from "~/components/core/applied-filters/AppliedFilter";
import type { AppliedFilterLabel } from "~/types/CommonTypes";
import { defaultFilter, type FilterFormData } from "./helper";

type Props = {
  callback: (a: { action: string; data?: any }) => void;
};

const AppliedFilters = ({ callback }: Props) => {
  const { t } = useTranslation(["common"]);

  const { getValues, setValue } = useFormContext<FilterFormData>();

  // Create mapping for filters
  const filterMapping: Record<string, AppliedFilterLabel> = {
    menu: {
      label: t("menu"),
      resetValue: defaultFilter.menu,
      value: {
        isMulti: true,
        path: "label",
      },
    },
    category: {
      label: t("category"),
      resetValue: defaultFilter.category,
      value: {
        isMulti: true,
        path: "label",
      },
    },
    brand: {
      label: t("brand"),
      resetValue: defaultFilter.brand,
      value: {
        isMulti: true,
        path: "label",
      },
    },
    showOnlySchemes: {
      label: "Schemes Only",
      resetValue: defaultFilter.showOnlySchemes,
      ignoreValue: false,
    },
  };

  const handleFilterCallback = useCallback(
    (result: { action: string; data?: any }) => {
      if (result.action === "remove" && result.data) {
        const { key, config } = result.data;
        callback({ action: "remove", data: { key, config } });
      }
    },
    [callback],
  );

  const formData = getValues();

  return (
    <AppliedFilter
      filter={formData}
      callback={handleFilterCallback}
      mapping={filterMapping}
      className="tw:mb-4"
    />
  );
};

export default AppliedFilters;
