import React from "react";
import { Sparkles, Store, AlertCircle } from "lucide-react";

import type { ReviewItem } from "../../helper";

interface AiFetchingBannerProps {
  /** Barcodes already resolved (matched or marked not-found). */
  resolved: number;
  /** Total barcodes scanned in this batch. */
  total: number;
}

/**
 * Slim status bar shown at the top of the review while StoreKing AI is still
 * resolving some scanned barcodes (any item with `status === "Pending"`). It
 * states plainly that the remaining barcodes are still being looked up and
 * shows concrete `done / total` progress, so the user knows the empty rows
 * below will fill in shortly. Kept deliberately minimal — the per-row
 * "Finding…" badges already show exactly which barcodes are pending.
 */
export const AiFetchingBanner: React.FC<AiFetchingBannerProps> = ({
  resolved,
  total,
}) => {
  const remaining = Math.max(total - resolved, 0);
  const pct = total > 0 ? Math.round((resolved / total) * 100) : 0;

  return (
    <div className="tw:rounded-xl tw:border tw:border-violet-200 tw:bg-violet-50/60 tw:px-3.5 tw:py-2.5">
      <div className="tw:flex tw:items-center tw:gap-2.5">
        <span className="tw:w-4 tw:h-4 tw:shrink-0 tw:rounded-full tw:border-2 tw:border-violet-500 tw:border-t-transparent tw:animate-spin" />
        <div className="tw:flex tw:items-center tw:gap-1 tw:min-w-0 tw:flex-1 tw:text-sm tw:font-semibold tw:text-violet-900">
          <span className="tw:truncate">
            StoreKing AI is finding {remaining}{" "}
            {remaining === 1 ? "more product" : "more products"}…
          </span>
          <Sparkles className="tw:w-3.5 tw:h-3.5 tw:shrink-0 tw:text-amber-400 tw:animate-pulse" />
        </div>
        <span className="tw:shrink-0 tw:text-xs tw:font-semibold tw:text-violet-700">
          {resolved} of {total} done
        </span>
      </div>
      {/* Plain wait cue so the user knows to hold on, not that the app is stuck —
          the spinner alone doesn't tell a first-time user what to do next. */}
      <p className="tw:mt-1 tw:text-xs tw:text-violet-700/80">
        Please wait a few seconds. No need to scan again.
      </p>
      {/* Determinate track — width reflects resolved / total. The inner
          sweeping stripe runs continuously so the bar still reads as "actively
          searching" even while parked between polls. */}
      <div className="tw:relative tw:mt-2 tw:h-1 tw:w-full tw:overflow-hidden tw:rounded-full tw:bg-violet-100">
        <div
          className="tw:absolute tw:inset-y-0 tw:left-0 tw:overflow-hidden tw:rounded-full tw:bg-linear-to-r tw:from-violet-400 tw:to-blue-500 tw:transition-all tw:duration-500 tw:ease-out"
          style={{ width: `${Math.max(pct, 6)}%` }}
        >
          <div className="ai-progress-sweep tw:absolute tw:inset-y-0 tw:left-0 tw:w-1/2 tw:bg-linear-to-r tw:from-transparent tw:via-white/70 tw:to-transparent" />
        </div>
      </div>
    </div>
  );
};

interface SummaryProps {
  items: ReviewItem[];
}

const STATS: {
  key: ReviewItem["matchStatus"];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  bar: string;
  iconColor: string;
}[] = [
  {
    key: "FoundInSk",
    label: "Found in SK Catalog",
    icon: Store,
    text: "tw:text-emerald-700",
    bar: "tw:bg-emerald-500",
    iconColor: "tw:text-emerald-500",
  },
  {
    key: "FoundInAi",
    label: "Found by SK AI",
    icon: Sparkles,
    text: "tw:text-blue-700",
    bar: "tw:bg-blue-500",
    iconColor: "tw:text-blue-500",
  },
  {
    key: "NotFound",
    label: "Not found in SK AI or SK Catalog",
    icon: AlertCircle,
    text: "tw:text-gray-600",
    bar: "tw:bg-gray-300",
    iconColor: "tw:text-gray-400",
  },
];

/**
 * Tallies the review items by match status — how many came from the SK
 * catalog, from SK AI, and how many had no match. Renders as one panel: a
 * proportion bar shows the split at a glance, and the legend below carries the
 * exact counts. Empty categories dim out so a lopsided batch (e.g. all
 * not-found) reads instantly instead of as three equal-weight cards.
 */
export const ReviewSummary: React.FC<SummaryProps> = ({ items }) => {
  // Only tally resolved items — a Pending row is still being matched, so
  // counting it (as NotFound) would be misleading.
  const counts = items.reduce(
    (acc, item) => {
      if (item.matchStatus === "Pending") return acc;
      acc[item.matchStatus] = (acc[item.matchStatus] || 0) + 1;
      return acc;
    },
    {} as Record<ReviewItem["matchStatus"], number>,
  );

  const total = STATS.reduce((sum, { key }) => sum + (counts[key] || 0), 0);

  return (
    <div className="tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white tw:px-3.5 tw:py-3 tw:shadow-xs">
      <div className="tw:flex tw:items-baseline tw:justify-between tw:mb-2.5">
        <span className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-gray-400">
          Match results
        </span>
        <span className="tw:text-xs tw:font-medium tw:text-gray-500 tw:tabular-nums">
          {total} {total === 1 ? "product" : "products"} scanned
        </span>
      </div>

      {/* Proportion bar — each segment's width is its share of the total, so the
          balance of matched vs. not-found reads before any number does. */}
      <div className="tw:flex tw:h-1.5 tw:w-full tw:gap-0.5 tw:mb-3">
        {total === 0 ? (
          <div className="tw:h-full tw:w-full tw:rounded-full tw:bg-gray-100" />
        ) : (
          STATS.map(({ key, bar }) => {
            const value = counts[key] || 0;
            if (!value) return null;
            return (
              <div
                key={key}
                className={`tw:h-full ${bar} tw:rounded-full tw:transition-all tw:duration-500`}
                style={{ width: `${(value / total) * 100}%` }}
              />
            );
          })
        )}
      </div>

      <div className="tw:grid tw:grid-cols-3 tw:gap-2">
        {STATS.map(({ key, label, icon: Icon, text, iconColor }) => {
          const value = counts[key] || 0;
          return (
            <div
              key={key}
              className={`tw:flex tw:items-start tw:gap-2 tw:transition-opacity ${
                value ? "" : "tw:opacity-45"
              }`}
            >
              <Icon className={`tw:w-4 tw:h-4 tw:shrink-0 ${iconColor}`} />
              <div className="tw:min-w-0">
                <div className={`tw:text-base tw:font-bold tw:leading-none ${text}`}>
                  {value}
                </div>
                <div className="tw:text-[10px] tw:leading-tight tw:text-gray-500 tw:mt-0.5">
                  {label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
