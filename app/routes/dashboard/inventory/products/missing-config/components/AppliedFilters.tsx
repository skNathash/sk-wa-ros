import { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppliedFilter from "~/components/core/applied-filters/AppliedFilter";
import type { AppliedFilterLabel } from "~/types/CommonTypes";
import { defaultFilterValues, type FilterFormFields } from "../helper";

interface AppliedFiltersProps {
  callback: (result: { action: string; data?: FilterFormFields }) => void;
}

const AppliedFilters = ({ callback }: AppliedFiltersProps) => {
  const { t } = useTranslation(["common"]);
  const { getValues, setValue } = useFormContext<FilterFormFields>();

  const filterMapping: Record<string, AppliedFilterLabel> = {
    menu: {
      label: t("menu"),
      resetValue: defaultFilterValues.menu,
      value: {
        isMulti: true,
        path: "label",
      },
    },
    category: {
      label: t("category"),
      resetValue: defaultFilterValues.category,
      value: {
        isMulti: true,
        path: "label",
      },
    },
    brand: {
      label: t("brand"),
      resetValue: defaultFilterValues.brand,
      value: {
        isMulti: true,
        path: "label",
      },
    },
    companyName: {
      label: t("companyName"),
      resetValue: defaultFilterValues.companyName,
      value: {
        isMulti: true,
        path: "label",
      },
    },
    search: {
      label: t("search"),
      resetValue: defaultFilterValues.search,
      ignoreValue: "",
    },
    withoutStock: {
      label: t("withoutStock"),
      resetValue: defaultFilterValues.withoutStock,
      ignoreValue: false,
    },
    status: {
      label: t("status"),
      resetValue: defaultFilterValues.status,
      ignoreValue: "All",
    },
    velocity: {
      label: t("velocity"),
      resetValue: defaultFilterValues.velocity,
      ignoreValue: "All",
    },
    stockStatus: {
      label: t("stockStatus"),
      resetValue: defaultFilterValues.stockStatus,
      ignoreValue: "All",
    },
    sellIn: {
      label: t("sellIn"),
      resetValue: defaultFilterValues.sellIn,
      ignoreValue: "All",
    },
    onlyOffers: {
      label: t("onlyOffers"),
      resetValue: defaultFilterValues.onlyOffers,
      ignoreValue: false,
    },
    isGroupDeal: {
      label: t("groupDeal"),
      resetValue: defaultFilterValues.isGroupDeal,
      ignoreValue: false,
    },
    isPriceSlab: {
      label: t("priceSlab"),
      resetValue: defaultFilterValues.isPriceSlab,
      ignoreValue: false,
    },
  };

  const handleFilterCallback = useCallback(
    (result: { action: string; data?: any }) => {
      if (result.action === "remove" && result.data) {
        const { key, config } = result.data;

        setValue(key as keyof FilterFormFields, config.resetValue as any);

        const formData = getValues();
        callback({ action: "remove", data: formData });
      }
    },
    [getValues, setValue, callback],
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

