import { ChevronRight } from "lucide-react";
import React from "react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import type { HealthScore, RiskInsights } from "../../helper";

/**
 * Theme-2 "open the dedicated pages" list from the Analytics design — one
 * colour-edged row per action-oriented view (reorder / near expiry / category
 * split / all items), each opening the matching tab or route, plus the dashed
 * insight box at the bottom carrying the existing inventory health score.
 *
 * Row counts come from the existing risk-insight APIs; nothing new is fetched.
 */
type Row = {
  key: string;
  title: React.ReactNode;
  caption: string;
  edgeClass: string;
  onClick: () => void;
};

const scoreClass = (score: number) => {
  if (score >= 80) return "tw:text-emerald-700";
  if (score >= 60) return "tw:text-amber-600";
  if (score >= 40) return "tw:text-orange-600";
  return "tw:text-red-600";
};

const QuickPagesList: React.FC<{
  risk: RiskInsights;
  riskLoading: boolean;
  health: HealthScore;
  healthLoading: boolean;
  onOpenTab: (tabKey: string) => void;
  onViewAllItems: () => void;
  className?: string;
}> = ({
  risk,
  riskLoading,
  health,
  healthLoading,
  onOpenTab,
  onViewAllItems,
  className = "",
}) => {
  const count = (n: number) => (riskLoading ? "…" : n);

  const rows: Row[] = [
    {
      key: "reorder",
      title: <>Reorder · {count(risk.reorderRequired)} SKUs</>,
      caption: "Selling but low in stock. Buy again soon.",
      edgeClass: "tw:bg-teal-600",
      onClick: () => onOpenTab("reorder"),
    },
    {
      key: "near_expiry",
      title: <>Near expiry · {count(risk.expiryRisk)} SKUs</>,
      caption: "Expiring in the next 30 days. Sell them quickly.",
      edgeClass: "tw:bg-amber-500",
      onClick: () => onOpenTab("near_expiry"),
    },
    {
      key: "category_wise",
      title: "Category wise",
      caption: "Your stock split by product category.",
      edgeClass: "tw:bg-indigo-500",
      onClick: () => onOpenTab("category_wise"),
    },
    {
      key: "all_items",
      title: "All items",
      caption: "The full product list with stock and prices.",
      edgeClass: "tw:bg-gray-400",
      onClick: onViewAllItems,
    },
  ];

  return (
    <div className={className}>
      <div className="tw:mb-2 tw:font-mono tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-gray-500 app-section-label">
        Open the dedicated pages
      </div>
      <div className="tw:grid tw:grid-cols-1 tw:gap-2.5 tw:lg:grid-cols-2">
        {rows.map((row) => (
          <button
            key={row.key}
            type="button"
            onClick={row.onClick}
            className="tw:flex tw:cursor-pointer tw:items-center tw:gap-3 tw:overflow-hidden tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white tw:py-3 tw:pr-3 tw:text-left tw:transition-shadow tw:hover:shadow-sm"
          >
            <span className={`tw:h-9 tw:w-1 tw:shrink-0 tw:rounded-r ${row.edgeClass}`} />
            <span className="tw:min-w-0 tw:flex-1">
              <span className="tw:block tw:text-sm tw:font-semibold tw:text-gray-900">
                {row.title}
              </span>
              <span className="tw:mt-0.5 tw:block tw:text-xs tw:text-gray-500">
                {row.caption}
              </span>
            </span>
            <ChevronRight size={16} className="tw:shrink-0 tw:text-gray-400" />
          </button>
        ))}
      </div>

      {/* Dashed insight box — carries the existing inventory health score. */}
      <div className="tw:mt-3 tw:rounded-xl tw:border tw:border-dashed tw:border-indigo-300 tw:bg-indigo-50/50 tw:p-3.5">
        <div className="tw:font-mono tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-indigo-600">
          Stock health
        </div>
        <div className="tw:mt-1 tw:text-sm tw:text-gray-700">
          {healthLoading ? (
            <AppSpinner size="sm" />
          ) : (
            <>
              Your inventory health score is{" "}
              <span
                className={`tw:text-base tw:font-bold app-amount ${scoreClass(health.score)}`}
              >
                {health.score}%
              </span>
              {health.status && <> — {health.status}</>}. A higher score means
              your stock sells well and your money is not stuck.
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickPagesList;
