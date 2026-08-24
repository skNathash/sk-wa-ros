import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";

/**
 * Theme-2 KPI strip for the B2B / B2C tabs — the four-up tile row from the
 * Analytics design (mono eyebrow, large figure, no chrome). Renders the same
 * `defaultSummary` items as the theme-1 `Summary` stat cards.
 */

/** Figure colour per summary key, so the row reads at a glance. */
const NUMBER_CLASS: Record<string, string> = {
  totalOrders: "tw:text-gray-900",
  totalCustomers: "tw:text-blue-700",
  totalValue: "tw:text-teal-700",
  totalUnits: "tw:text-amber-600",
};

const SummaryTiles: React.FC<{
  summary: Array<Record<string, any>>;
  className?: string;
}> = ({ summary, className = "" }) => (
  <div
    className={`tw:grid tw:grid-cols-2 tw:gap-3 tw:md:grid-cols-4 ${className}`}
  >
    {summary.map((item) => (
      <div
        key={item.key}
        className="tw:rounded-2xl tw:border tw:border-gray-200 tw:bg-white tw:p-4"
      >
        <div className="tw:font-mono tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-gray-500">
          {item.label}
        </div>
        <div
          className={`tw:mt-2 tw:text-2xl tw:font-bold tw:leading-none app-amount ${
            NUMBER_CLASS[item.key] || "tw:text-gray-900"
          }`}
        >
          {item.loading ? (
            <AppSpinner size="sm" />
          ) : item.key === "totalValue" ? (
            <Amount value={Number(item.value)} />
          ) : (
            item.value
          )}
        </div>
      </div>
    ))}
  </div>
);

export default SummaryTiles;
