import { ArrowDown, Zap } from "lucide-react";
import React from "react";

/**
 * Catch-up strip: how many SKUs are currently priced above their cheapest
 * online listing, and a button that narrows the sheet to exactly those rows so
 * they can be matched one by one. Renders nothing when the sheet is already
 * winning everywhere — there is no action to offer.
 */
const MatchAllBanner: React.FC<{
  count: number;
  /** Average % the prices come down by, across the SKUs being matched. */
  avgDropPct: number;
  onMatchAll: () => void;
  className?: string;
}> = ({ count, avgDropPct, onMatchAll, className = "" }) => {
  if (!count) return null;

  return (
    <div
      className={`tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3 tw:rounded-xl tw:bg-emerald-50 tw:px-4 tw:py-3.5 ${className}`}
    >
      <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-3">
        <span className="tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-emerald-600 tw:text-white">
          <Zap size={18} />
        </span>
        <div className="tw:min-w-0">
          <div className="tw:text-sm tw:font-bold tw:text-emerald-900">
            Match {count} {count === 1 ? "SKU" : "SKUs"} to the cheapest online
            price
          </div>
          <div className="tw:mt-0.5 tw:text-xs tw:text-emerald-700">
            avg drop ~{avgDropPct}% per item · your CLUB price stops losing to
            Amazon &amp; Flipkart
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onMatchAll}
        className="tw:inline-flex tw:shrink-0 tw:cursor-pointer tw:items-center tw:gap-1.5 tw:rounded-lg tw:bg-emerald-600 tw:px-4 tw:py-2 tw:text-sm tw:font-semibold tw:text-white tw:transition-colors hover:tw:bg-emerald-700"
      >
        <ArrowDown size={15} />
        Match all {count}
      </button>
    </div>
  );
};

export default MatchAllBanner;
