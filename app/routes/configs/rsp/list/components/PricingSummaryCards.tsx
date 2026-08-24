import React from "react";
import type { PriceSummary } from "../helper";
import type { PricingStats } from "../insights";

/**
 * Three-up stat strip from the Manage Price design: catalogue size, average
 * margin and low-margin cushion.
 *
 * Every figure comes from the filter-aware `outputType=priceSummary` block —
 * until it lands the cards show a dash rather than stand-in numbers.
 */

const EMPTY = "—";

type Accent = "none" | "emerald" | "amber";

// Left accent stripe — the design uses it to grade the cards from "just
// information" (none) through to "needs an action" (amber).
const ACCENT: Record<Accent, string> = {
  none: "tw:border-l-transparent",
  emerald: "tw:border-l-emerald-500",
  amber: "tw:border-l-amber-400",
};

const Card: React.FC<{
  label: string;
  value: React.ReactNode;
  hint: string;
  accent?: Accent;
  onClick?: () => void;
}> = ({ label, value, hint, accent = "none", onClick }) => (
  <div
    onClick={onClick}
    className={`tw:rounded-xl tw:border tw:border-gray-200 tw:border-l-[3px] tw:bg-white tw:px-4 tw:py-3.5 ${
      ACCENT[accent]
    } ${
      onClick
        ? "tw:cursor-pointer tw:transition-shadow tw:hover:shadow-sm"
        : ""
    }`}
  >
    <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500">
      {label}
    </div>
    <div className="tw:mt-2 tw:text-2xl tw:font-bold tw:leading-none">
      {value}
    </div>
    <div className="tw:mt-2.5 tw:text-xs tw:text-gray-500">{hint}</div>
  </div>
);

const PricingSummaryCards: React.FC<{
  stats: PricingStats;
  summary?: PriceSummary | null;
  className?: string;
  type?: "network" | "customer";
}> = ({ summary, className = "", type = "customer" }) => {
  const channel = type === "network" ? "B2B" : "B2C";

  return (
    <div
      className={`tw:grid tw:grid-cols-2 tw:gap-3 tw:lg:grid-cols-3 tw:lg:gap-4 ${className}`}
    >
      <Card
        label="Priced items"
        value={
          <span className="tw:text-gray-900">
            {summary ? summary.pricedCount : EMPTY}
            <span className="tw:text-sm tw:font-medium tw:text-gray-400">
              {" "}
              / {summary ? summary.totalCount : EMPTY}
            </span>
          </span>
        }
        hint="Items with a selling price set"
      />
      <Card
        label={`${channel} avg margin`}
        value={
          <span className="tw:text-emerald-600">
            {summary ? summary.avgMarginLabel : EMPTY}
          </span>
        }
        hint="Average profit margin you earn"
        accent="emerald"
      />
      <Card
        label="Low margin items"
        value={
          <span className="tw:text-amber-500">
            {summary ? summary.lowMarginCount : EMPTY}
          </span>
        }
        hint="Items earning too little — review pricing"
        accent="amber"
      />
    </div>
  );
};

export default PricingSummaryCards;
