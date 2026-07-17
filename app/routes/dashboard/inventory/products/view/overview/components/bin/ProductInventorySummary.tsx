import clsx from "clsx";
import { useTranslation } from "react-i18next";
import type { InventorySummary } from "./helper";
import AppCard from "~/components/core/card/AppCard";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";
import DisplayPrice from "~/shared/products/display-price/DisplayPrice";

interface ProductInventorySummaryProps {
  summary: InventorySummary;
  selectedStockUom?: string;
}

const ProductInventorySummary = ({
  summary,
  selectedStockUom,
}: ProductInventorySummaryProps) => {
  const { t } = useTranslation(["common"]);

  const summaryConfig = [
    {
      key: "sellableStock",
      label: t("sellableStock"),
      description: t("unitsAvailableForSale"),
      color: "tw:text-green-600",
    },
    {
      key: "nonSellableStock",
      label: t("nonSellable"),
      description: t("unitsNotAvailableForSale"),
      color: "tw:text-red-500",
    },
    {
      key: "totalStock",
      label: t("totalUnits"),
      description: t("totalStockUnits"),
      color: "tw:text-gray-800",
    },
    {
      key: "stockValue",
      label: t("stockValue"),
      description: t("totalValueOfStock"),
      color: "tw:text-blue-700",
      isCurrency: true,
    },
  ];

  return (
    <AppCard title={t("completeInventorySummary")}>
      <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:gap-4">
        {summaryConfig.map((item) => (
          <div
            key={item.label}
            className="tw:flex tw:flex-col tw:md:items-center"
          >
            <div className="tw:text-sm tw:mb-1 tw:text-slate-700">
              {item.label}
            </div>
            <div className={clsx("tw:text-lg tw:font-semibold", item.color)}>
              {item.isCurrency ? (
                <DisplayPrice
                  price={Number(summary[item.key as keyof InventorySummary])}
                  uom={selectedStockUom}
                />
              ) : (
                <DisplayQty
                  qty={Number(summary[item.key as keyof InventorySummary]) || 0}
                  isLooseQty={false}
                  uom={selectedStockUom}
                />
              )}
            </div>
            <div className="tw:text-xs tw:text-gray-500 tw:mt-1 tw:md:text-center">
              {item.description}
            </div>
          </div>
        ))}
      </div>
    </AppCard>
  );
};

export default ProductInventorySummary;
