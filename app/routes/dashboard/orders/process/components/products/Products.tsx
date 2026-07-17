import React, { useState } from "react";
import { ChevronDown, ChevronUp, Package } from "lucide-react";
import useScreenView from "~/hooks/useScreenView";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import DesktopView from "./DesktopView";
import MobileView from "./MobileView";
import type { SortValue } from "~/types/CommonTypes";
import { clsx } from "clsx";
import { useTranslation } from "react-i18next";

interface ProductsProps {
  data: any[];
  loading?: boolean;
  onSort?: (data: { key: string; value: SortValue }) => void;
  sortKey?: string;
  sortValue?: SortValue;
  callback?: (action: { action: string; data: any }) => void;
  orderAmount?: number;
}

const Products: React.FC<ProductsProps> = ({
  data = [],
  loading = false,
  onSort,
  sortKey,
  sortValue,
  callback,
  orderAmount,
}) => {
  const { t } = useTranslation();

  const { isMobile } = useScreenView();
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Filter out cancelled items
  const filteredData = data.filter((item: any) => item.status !== "Cancelled");

  return (
    <AppCard noPadding>
      {/* Collapsible Header */}
      <div
        className={clsx("tw:px-6 tw:pt-4", {
          "tw:pb-4": !isExpanded,
        })}
      >
        <div
          className={clsx(
            "tw:flex tw:items-end tw:justify-between tw:cursor-pointer tw:select-none",
            {
              "tw:border-b tw:md:border-b-0 tw:pb-4 tw:md:pb-0": isExpanded,
            }
          )}
          onClick={toggleExpanded}
        >
          <div className="tw:flex tw:items-center tw:gap-3">
            <div>
              <div className="tw:text-base tw:font-semibold tw:text-gray-800 tw:mb-1">
                {t("products")} ({filteredData.length})
              </div>
              <div className="tw:text-sm">
                <span className="tw:text-gray-500">{t("totalValue")}: </span>
                <Amount
                  value={orderAmount || 0}
                  className="tw:font-medium"
                  decimalPlaces={2}
                />
              </div>
            </div>
          </div>
          <div className="tw:gap-2">
            {isExpanded ? (
              <ChevronUp className="tw:text-gray-400" size={28} />
            ) : (
              <ChevronDown className="tw:text-gray-400" size={28} />
            )}
          </div>
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="tw:mt-4">
          {isMobile ? (
            <MobileView
              data={filteredData}
              loading={loading}
              callback={callback}
            />
          ) : (
            <DesktopView
              data={filteredData}
              loading={loading}
              onSort={onSort}
              sortKey={sortKey}
              sortValue={sortValue}
              callback={callback}
            />
          )}
        </div>
      )}
    </AppCard>
  );
};

export default Products;
