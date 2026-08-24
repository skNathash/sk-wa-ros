import { ChevronRight } from "lucide-react";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import {
  formatCount,
  useInventoryValueSummary,
  type ValueBucket,
} from "../../valueSummary";
import type { InventorySummary } from "../../helper";

/**
 * Theme-2 "money on the shelf" card — the Analytics-design counterpart to the
 * theme-1 `InventoryValueSummary` stat strip. One card leads with the total
 * stock value in serif numerals, splits it into sellable / non-sellable with a
 * proportional bar, and lists each half as a tappable row that opens the
 * matching products view.
 *
 * The figures come from the same two value endpoints as the theme-1 strip (see
 * `useInventoryValueSummary`); the catalogue line underneath reuses the
 * dashboard summary already loaded by the page, so nothing extra is fetched.
 */
type Split = {
  key: string;
  label: string;
  caption: string;
  bucket: ValueBucket;
  barClass: string;
  dotClass: string;
  tabKey: string;
  /** Share of the two halves, as a ready-to-apply CSS width. */
  _barWidth: string;
  _productsLabel: string;
};

const Row: React.FC<{ split: Split; onOpenTab: (tabKey: string) => void }> = ({
  split,
  onOpenTab,
}) => (
  <button
    type="button"
    onClick={() => onOpenTab(split.tabKey)}
    className="tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-3 tw:rounded-xl tw:px-2 tw:py-2.5 tw:text-left tw:transition-colors tw:hover:bg-gray-50"
  >
    <span
      className={`tw:h-2 tw:w-2 tw:shrink-0 tw:rounded-full ${split.dotClass}`}
    />
    <span className="tw:min-w-0 tw:flex-1">
      <span className="tw:block tw:text-sm tw:font-semibold tw:text-gray-900">
        {split.label}
      </span>
      <span className="tw:mt-0.5 tw:block tw:text-xs tw:text-gray-500">
        {split.caption}
      </span>
    </span>
    <span className="tw:shrink-0 tw:text-right">
      <span className="tw:block tw:text-base tw:font-bold tw:leading-none tw:text-gray-900 app-amount">
        <Amount value={split.bucket.value} decimalPlaces={0} />
      </span>
      <span className="tw:mt-1 tw:block tw:text-[11px] tw:text-gray-500">
        {split._productsLabel}
      </span>
    </span>
    <ChevronRight size={16} className="tw:shrink-0 tw:text-gray-400" />
  </button>
);

const ValueBreakdown: React.FC<{
  data: InventorySummary;
  onOpenTab: (tabKey: string) => void;
  className?: string;
}> = ({ data, onOpenTab, className = "" }) => {
  const { summary, loading } = useInventoryValueSummary();

  const halves = [
    {
      key: "sellable",
      label: "Sellable",
      caption: "Can be sold to customers right now.",
      bucket: summary.sellable,
      barClass: "tw:bg-teal-600",
      dotClass: "tw:bg-teal-600",
      tabKey: "in_stock",
    },
    {
      key: "non_sellable",
      label: "Non sellable",
      caption: "Blocked, damaged or not listed for sale.",
      bucket: summary.nonSellable,
      barClass: "tw:bg-amber-500",
      dotClass: "tw:bg-amber-500",
      tabKey: "non_sellable",
    },
  ];

  // The bar is proportional to the two halves rather than to the total, so a
  // total that lags the split (different endpoints) can't leave a dead gap.
  const splitTotal = halves.reduce((sum, s) => sum + s.bucket.value, 0);

  // Widths and count copy are worked out here, so the rows below are markup.
  const splits: Split[] = halves.map((half) => ({
    ...half,
    _barWidth: `${splitTotal ? (half.bucket.value / splitTotal) * 100 : 0}%`,
    _productsLabel: `${formatCount(half.bucket.products)} products`,
  }));

  const catalogueLabel = `${formatCount(summary.inventory.products)} products · ${formatCount(summary.inventory.quantity)} units · ${data.inStockSKUs} SKUs in stock`;

  return (
    <div className={className}>
      <div className="tw:mb-2 tw:font-mono tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-gray-500 app-section-label">
        Money on the shelf
      </div>

      <div className="tw:rounded-2xl tw:border tw:border-gray-200 tw:bg-white tw:p-4">
        {loading ? (
          <div className="tw:animate-pulse tw:space-y-3">
            <div className="tw:h-3 tw:w-28 tw:rounded tw:bg-gray-200" />
            <div className="tw:h-8 tw:w-1/2 tw:rounded tw:bg-gray-200" />
            <div className="tw:h-2 tw:w-full tw:rounded-full tw:bg-gray-100" />
            <div className="tw:h-12 tw:w-full tw:rounded tw:bg-gray-100" />
          </div>
        ) : (
          <>
            <div className="tw:font-mono tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-gray-500">
              Total stock value
            </div>
            <div className="tw:mt-1 tw:text-3xl tw:font-bold tw:leading-none tw:text-gray-900 app-amount">
              <Amount value={summary.inventory.value} decimalPlaces={0} />
            </div>
            <div className="tw:mt-1.5 tw:text-xs tw:text-gray-500">
              {catalogueLabel}
            </div>

            {splitTotal > 0 && (
              <div className="tw:mt-3.5 tw:flex tw:h-2 tw:overflow-hidden tw:rounded-full tw:bg-gray-100">
                {splits.map((split) => (
                  <span
                    key={split.key}
                    className={split.barClass}
                    style={{ width: split._barWidth }}
                  />
                ))}
              </div>
            )}

            <div className="tw:mt-1.5 tw:divide-y tw:divide-gray-100">
              {splits.map((split) => (
                <Row key={split.key} split={split} onOpenTab={onOpenTab} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ValueBreakdown;
