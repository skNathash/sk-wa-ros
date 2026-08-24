import { ChevronRight } from "lucide-react";
import React from "react";
import type { InventorySummary } from "../../helper";

/**
 * Theme-2 "stock overview" panel — the Analytics-design counterpart to the
 * theme-1 `SummaryCards group="counts"` strip (Total / In stock / Out of stock
 * / Reserved). One panel leads with a coverage bar showing how much of the
 * catalogue is actually on the shelf, then splits into four stat columns; the
 * three that have a matching products view are tappable.
 *
 * Everything comes from the summary already loaded by the page — nothing extra
 * is fetched.
 */
type Stat = {
  key: string;
  label: string;
  count: number;
  caption: string;
  numberClass: string;
  dotClass: string;
  /** Products-tab leaf key; columns without one are not tappable. */
  tabKey?: string;
};

const share = (count: number, total: number) =>
  total > 0 ? Math.round((count / total) * 100) : 0;

const stats = (data: InventorySummary): Stat[] => {
  const total = data.totalSKUs;
  return [
    {
      key: "total",
      label: "Total SKUs",
      count: total,
      caption: "everything in your catalogue",
      numberClass: "tw:text-gray-900",
      dotClass: "tw:bg-gray-300",
    },
    {
      key: "in_stock",
      label: "In stock",
      count: data.inStockSKUs,
      caption: `${share(data.inStockSKUs, total)}% of catalogue · on the shelf now`,
      numberClass: "tw:text-teal-700",
      dotClass: "tw:bg-teal-600",
      tabKey: "in_stock",
    },
    {
      key: "out_of_stock",
      label: "Out of stock",
      count: data.outOfStockSKUs,
      caption: `${share(data.outOfStockSKUs, total)}% of catalogue · buy again soon`,
      numberClass: "tw:text-red-600",
      dotClass: "tw:bg-red-500",
      tabKey: "out_of_stock",
    },
    {
      key: "reserve",
      label: "Reserved",
      count: data.reservedSKUs,
      caption: "bookable for future fulfilment",
      numberClass: "tw:text-amber-600",
      dotClass: "tw:bg-amber-500",
      tabKey: "reserve",
    },
  ];
};

const Column: React.FC<{ stat: Stat; onOpenTab: (tabKey: string) => void }> = ({
  stat,
  onOpenTab,
}) => {
  const body = (
    <>
      <div className="tw:flex tw:items-center tw:gap-1.5">
        <span
          className={`tw:h-1.5 tw:w-1.5 tw:shrink-0 tw:rounded-full ${stat.dotClass}`}
        />
        <span className="tw:font-mono tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-gray-500">
          {stat.label}
        </span>
        {stat.tabKey && (
          <ChevronRight
            size={13}
            className="tw:ml-auto tw:shrink-0 tw:text-gray-400"
          />
        )}
      </div>
      <div
        className={`tw:mt-1.5 tw:text-3xl tw:font-bold tw:leading-none app-amount ${stat.numberClass}`}
      >
        {stat.count}
      </div>
      <div className="tw:mt-1.5 tw:text-xs tw:text-gray-500">
        {stat.caption}
      </div>
    </>
  );

  const shared = "tw:bg-white tw:px-4 tw:py-3.5 tw:text-left";

  if (!stat.tabKey) return <div className={shared}>{body}</div>;

  return (
    <button
      type="button"
      onClick={() => onOpenTab(stat.tabKey!)}
      className={`${shared} tw:w-full tw:cursor-pointer tw:transition-colors tw:hover:bg-gray-50`}
    >
      {body}
    </button>
  );
};

const StockOverview: React.FC<{
  data: InventorySummary;
  onOpenTab: (tabKey: string) => void;
  className?: string;
}> = ({ data, onOpenTab, className = "" }) => {
  const total = data.totalSKUs;
  // The bar is proportional to the two halves of the catalogue rather than to
  // the total, so a count that lags (different endpoints) can't leave a gap.
  const barTotal = data.inStockSKUs + data.outOfStockSKUs;

  return (
    <div className={className}>
      <div className="tw:mb-2 tw:font-mono tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-gray-500 app-section-label">
        Stock overview · tap to open
      </div>

      <div className="tw:overflow-hidden tw:rounded-2xl tw:border tw:border-gray-200 tw:bg-white">
        {data.loading ? (
          <div className="tw:animate-pulse tw:space-y-3 tw:p-4">
            <div className="tw:h-2 tw:w-full tw:rounded-full tw:bg-gray-100" />
            <div className="tw:grid tw:grid-cols-2 tw:gap-3 tw:lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="tw:space-y-2">
                  <div className="tw:h-2.5 tw:w-16 tw:rounded tw:bg-gray-200" />
                  <div className="tw:h-7 tw:w-12 tw:rounded tw:bg-gray-200" />
                  <div className="tw:h-2.5 tw:w-24 tw:rounded tw:bg-gray-100" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Coverage bar — how much of the catalogue is on the shelf. */}
            <div className="tw:px-4 tw:pt-4">
              <div className="tw:flex tw:items-baseline tw:justify-between tw:gap-3">
                <span className="tw:font-mono tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-gray-500">
                  Shelf coverage
                </span>
                <span className="tw:text-xs tw:text-gray-500">
                  <span className="tw:font-semibold tw:text-teal-700 app-amount">
                    {share(data.inStockSKUs, total)}%
                  </span>{" "}
                  of {total} SKUs in stock
                </span>
              </div>
              {barTotal > 0 && (
                <div className="tw:mt-2 tw:flex tw:h-2 tw:overflow-hidden tw:rounded-full tw:bg-gray-100">
                  <span
                    className="tw:bg-teal-600"
                    style={{ width: `${(data.inStockSKUs / barTotal) * 100}%` }}
                  />
                  <span
                    className="tw:bg-red-400"
                    style={{
                      width: `${(data.outOfStockSKUs / barTotal) * 100}%`,
                    }}
                  />
                </div>
              )}
            </div>

            {/* Hairline grid: a 1px gap over a grey backdrop draws the column
                rules cleanly at both 2-up (mobile) and 4-up (desktop). */}
            <div className="tw:mt-3.5 tw:grid tw:grid-cols-2 tw:gap-px tw:border-t tw:border-gray-100 tw:bg-gray-100 tw:lg:grid-cols-4">
              {stats(data).map((stat) => (
                <Column key={stat.key} stat={stat} onOpenTab={onOpenTab} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StockOverview;
