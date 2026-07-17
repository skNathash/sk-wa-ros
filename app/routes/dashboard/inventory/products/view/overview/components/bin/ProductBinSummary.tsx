import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import KeyValue from "app/components/core/key-value/KeyValue";
import AppBadge from "~/components/core/badge/AppBadge";
import type { VariantColor } from "~/types/CommonTypes";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";

interface ProductBinSummaryProps {
  totalStock: number;
  locations: number;
  stockLevel: string;
  selectedStockUom?: string;
}

const ProductBinSummary: React.FC<ProductBinSummaryProps> = ({
  totalStock,
  locations,
  stockLevel,
  selectedStockUom,
}) => {
  const { t } = useTranslation(["common"]);

  const { badgeLabel, badgeVariant } = useMemo<{
    badgeLabel: string;
    badgeVariant: VariantColor;
  }>(() => {
    const outOfStock = totalStock === 0;
    return {
      badgeLabel: stockLevel || (outOfStock ? t("outOfStock") : t("inStock")),
      badgeVariant: (outOfStock ? "danger" : "success") as VariantColor,
    };
    // stockLevel and totalStock determine the badge; t is stable but included to satisfy hooks rules
  }, [totalStock, stockLevel, t]);

  return (
    <div className="tw:grid tw:grid-cols-3 tw:gap-2">
      <div className="tw:flex tw:flex-col">
        <div className="tw:text-green-600 tw:text-sm">{t("totalStock")}</div>
        <div className="tw:text-green-700 tw:font-bold tw:text-lg">
          <DisplayQty
            qty={Number(totalStock) || 0}
            isLooseQty={false}
            uom={selectedStockUom}
          />
        </div>
      </div>
      <div className="tw:flex tw:flex-col tw:items-center">
        <div className="tw:text-green-600 tw:text-sm">{t("locations")}</div>
        <div className="tw:text-green-700 tw:font-bold tw:text-lg">
          {locations}
        </div>
      </div>
      <div className="tw:flex tw:flex-col tw:items-end">
        <div className="tw:text-green-600 tw:text-sm">{t("stockLevel")}</div>
        <div className="tw:text-green-700 tw:font-bold tw:text-lg">
          <AppBadge variant={badgeVariant}>{badgeLabel}</AppBadge>
        </div>
      </div>
    </div>
  );
};

export default ProductBinSummary;
