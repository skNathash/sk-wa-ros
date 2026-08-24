import React from "react";
import type { ElectronicsSummary } from "../helper";

/**
 * Stat strip above the electronics sheet: how much of the online-listed
 * catalogue carries a price, how many SKUs currently beat every marketplace,
 * and how many sit on a thin margin.
 *
 * The CLUB-winning figure is derived from the loaded rows — there is no API
 * for it — so it reports against the rows the sheet is showing.
 */

type Accent = "none" | "rose" | "amber";

const ACCENT: Record<Accent, string> = {
  none: "tw:border-l-transparent",
  rose: "tw:border-l-rose-500",
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
    } ${onClick ? "tw:cursor-pointer tw:transition-shadow tw:hover:shadow-sm" : ""}`}
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

const SummaryCards: React.FC<{
  summary: ElectronicsSummary | null;
  /** SKUs priced at or under every marketplace listing. */
  winningCount: number;
  /** SKUs on the sheet carrying at least one online listing. */
  onlineCount: number;
  className?: string;
}> = ({ summary, winningCount, onlineCount, className = "" }) => (
  <div
    className={`tw:grid tw:grid-cols-2 tw:gap-3 tw:lg:grid-cols-3 tw:lg:gap-4 ${className}`}
  >
    <Card
      label="Priced items"
      value={
        <span className="tw:text-gray-900">
          {summary?.pricedCount ?? 0}
          <span className="tw:text-sm tw:font-medium tw:text-gray-400">
            {" "}
            / {summary?.totalCount ?? 0}
          </span>
        </span>
      }
      hint={summary?.defaultToMrpHint || "priced for the CLUB app"}
    />
    <Card
      label="CLUB winning"
      value={<span className="tw:text-rose-600">{winningCount}</span>}
      hint={`of ${onlineCount} online SKUs`}
      accent="rose"
    />
    <Card
      label={summary?.lowMarginLabel || "Low margin"}
      value={
        <span className="tw:text-amber-500">
          {summary?.lowMarginCount ?? 0}
        </span>
      }
      hint="consider raising"
      accent="amber"
    />
  </div>
);

export default SummaryCards;
