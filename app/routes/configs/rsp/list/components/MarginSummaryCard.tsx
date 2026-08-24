import React from "react";
import CommonService from "~/services/CommonService";
import type { PricingStats } from "../insights";

/**
 * The burnt-amber "AVG MARGIN" hero card from the design — big margin
 * number, a static trend sparkline, and the HIGH / MID / LOW margin buckets.
 * Rendered above the mobile list and inside the theme-2 desktop side pane.
 *
 * Margin number, bucket counts and the week-over-week delta come from the
 * price-comparison summary API when available, else from the loaded page.
 * The sparkline shape stays static (no per-day trend API).
 */
const buckets = (stats: PricingStats) => [
  {
    key: "HIGH",
    value: stats.highMargin,
    caption: stats.isStatic ? "22 SKUs > 20%" : "SKUs > 20%",
  },
  {
    key: "MID",
    value: stats.midMargin,
    caption: "5–20% margin",
  },
  {
    key: "LOW",
    value: stats.lowMargin,
    caption: "< 5% margin",
  },
];

/** "▲ 1.2% vs last week" — from the summary API, static text until it lands. */
const weekDelta = (stats: PricingStats) => {
  if (!stats.hasSummary) return "▲ 1.2% vs last week";
  const delta = CommonService.roundedByDecimalPlace(
    stats.avgMargin - stats.avgMarginLastWeek,
    1,
  );
  if (delta > 0) return `▲ ${delta}% vs last week`;
  if (delta < 0) return `▼ ${Math.abs(delta)}% vs last week`;
  return "flat vs last week";
};

const MarginSummaryCard: React.FC<{
  stats: PricingStats;
  className?: string;
}> = ({ stats, className = "" }) => (
  <div
    className={`tw:relative tw:overflow-hidden tw:rounded-2xl tw:bg-gradient-to-br tw:from-amber-700 tw:via-amber-800 tw:to-orange-900 tw:p-4 tw:text-amber-50 ${className}`}
  >
    {/* Decorative glow, top-right (mirrors the design's radial highlight). */}
    <div
      aria-hidden
      className="tw:pointer-events-none tw:absolute tw:-right-10 tw:-top-16 tw:h-44 tw:w-44 tw:rounded-full tw:bg-amber-500/30"
    />

    <div className="tw:relative tw:flex tw:items-start tw:justify-between tw:gap-4">
      <div className="tw:min-w-0">
        <div className="tw:font-mono tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-amber-200">
          Avg margin
        </div>
        <div className="tw:mt-1 tw:font-mono tw:text-4xl tw:font-bold tw:leading-none">
          {CommonService.roundedByDecimalPlace(stats.avgMargin, 1)}%
        </div>
        <div className="tw:mt-2 tw:text-xs tw:text-amber-200">
          {weekDelta(stats)}
        </div>
      </div>

      {/* Static sparkline (decorative trend). */}
      <svg
        aria-hidden
        viewBox="0 0 120 48"
        className="tw:mt-2 tw:h-12 tw:w-28 tw:shrink-0 tw:text-amber-100"
      >
        <polyline
          points="0,38 18,40 36,30 54,34 72,22 90,26 108,12 120,8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>

    <div className="tw:relative tw:mt-4 tw:grid tw:grid-cols-3 tw:gap-2">
      {buckets(stats).map((b) => (
        <div
          key={b.key}
          className="tw:rounded-lg tw:bg-white/10 tw:px-3 tw:py-2"
        >
          <div className="tw:font-mono tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-amber-200">
            {b.key}
          </div>
          <div className="tw:mt-0.5 tw:font-mono tw:text-xl tw:font-bold tw:leading-none">
            {b.value}
          </div>
          <div className="tw:mt-1 tw:text-[10px] tw:text-amber-200/90">
            {b.caption}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default MarginSummaryCard;
