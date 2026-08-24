import React from "react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import type { InventorySummary } from "../../helper";

/**
 * Theme-2 movement buckets — the 2×2 "tap to open" grid from the Analytics
 * design: one card per SKU-movement bucket (fast / slow / non-moving /
 * reserve) with a big serif count, a one-line meaning and a "See all" link
 * that opens the matching products tab below.
 *
 * Counts come from the existing SKU-movement summary; nothing new is fetched.
 */
type Bucket = {
  tabKey: string;
  label: string;
  count: number;
  caption: string;
  numberClass: string;
  linkClass: string;
};

const buckets = (data: InventorySummary): Bucket[] => [
  {
    tabKey: "fast_moving",
    label: "Fast",
    count: data.fastMovingSKUs,
    caption: `${data.fastMovingPercentage}% of shelf · sold in the last 30 days`,
    numberClass: "tw:text-emerald-700",
    linkClass: "tw:text-emerald-700",
  },
  {
    tabKey: "slow_moving",
    label: "Slow",
    count: data.slowMovingSKUs,
    caption: `${data.slowMovingPercentage}% of shelf · sold in 90 days, not in 30`,
    numberClass: "tw:text-amber-600",
    linkClass: "tw:text-amber-600",
  },
  {
    tabKey: "non_moving",
    label: "Non-mover",
    count: data.nonMovingSKUs,
    caption: "not sold at all for a long time",
    numberClass: "tw:text-red-600",
    linkClass: "tw:text-red-600",
  },
  {
    tabKey: "reserve",
    label: "Reserve",
    count: data.reservedSKUs,
    caption: "bookable while out of stock",
    numberClass: "tw:text-blue-700",
    linkClass: "tw:text-blue-700",
  },
];

const MovementBuckets: React.FC<{
  data: InventorySummary;
  onOpenTab: (tabKey: string) => void;
  className?: string;
}> = ({ data, onOpenTab, className = "" }) => (
  <div className={className}>
    <div className="tw:mb-2 tw:font-mono tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-gray-500 app-section-label">
      Movement buckets
    </div>
    <div className="tw:grid tw:grid-cols-2 tw:gap-3 tw:lg:grid-cols-4">
      {buckets(data).map((bucket) => (
        <button
          key={bucket.tabKey}
          type="button"
          onClick={() => onOpenTab(bucket.tabKey)}
          className="tw:flex tw:h-full tw:cursor-pointer tw:flex-col tw:rounded-2xl tw:border tw:border-gray-200 tw:bg-white tw:p-4 tw:text-left tw:transition-shadow tw:hover:shadow-sm"
        >
          <div className="tw:flex tw:min-h-8 tw:items-baseline tw:gap-2">
            <span
              className={`tw:text-3xl tw:font-bold tw:leading-none app-amount ${bucket.numberClass}`}
            >
              {data.loading ? <AppSpinner size="sm" /> : bucket.count}
            </span>
            <span className="tw:font-mono tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-gray-500">
              {bucket.label}
            </span>
          </div>
          <div className="tw:mt-2 tw:flex-1 tw:text-xs tw:leading-relaxed tw:text-gray-600">
            {bucket.caption}
          </div>
          <div
            className={`tw:mt-2.5 tw:text-xs tw:font-semibold ${bucket.linkClass}`}
          >
            See all ›
          </div>
        </button>
      ))}
    </div>
  </div>
);

export default MovementBuckets;
