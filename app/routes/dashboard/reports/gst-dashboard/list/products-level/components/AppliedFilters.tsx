import { useCallback, useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppliedFilter from "~/components/core/applied-filters/AppliedFilter";
import type { AppliedFilterLabel } from "~/types/CommonTypes";

type Props = {
  callback: () => void;
};

const AppliedFilters = ({ callback }: Props) => {
  const { t } = useTranslation(["common"]);
  const { control, setValue, getValues } = useFormContext<any>();

  // watch form values to keep applied filters reactive
  const watchedFilters = useWatch({ control });

  // mapping for available filters
  const filterMapping: Record<string, AppliedFilterLabel> = useMemo(
    () => ({
      menu: {
        label: t("menu"),
        resetValue: [],
        value: {
          isMulti: true,
          path: "label",
        },
      },
      category: {
        label: t("category"),
        resetValue: [],
        value: {
          isMulti: true,
          path: "label",
        },
      },
      brand: {
        label: t("brand"),
        resetValue: [],
        value: {
          isMulti: true,
          path: "label",
        },
      },
      gst: {
        label: t("gst") || "GST",
        resetValue: "all",
        ignoreValue: "all",
      },
    }),
    [t]
  );

  const handleAppliedFilterRemove = useCallback(
    ({ action, data }: { action: string; data?: any }) => {
      if (action === "remove" && data?.key) {
        const key = data.key as string;
        const resetValue = filterMapping[key]?.resetValue;
        if (resetValue !== undefined) {
          setValue(key, resetValue as any);
        }

        // Trigger parent callback to update URL / data
        try {
          callback();
        } catch (e) {
          // ignore
        }
      }
    },
    [filterMapping, setValue, callback]
  );

  const transformed = watchedFilters || {};

  return (
    <AppliedFilter
      filter={transformed}
      callback={handleAppliedFilterRemove}
      mapping={filterMapping}
      className="tw:mt-2"
    />
  );
};

export default AppliedFilters;
