import clsx from "clsx";
import Amount from "~/components/core/amount/Amount";
import { getBarHeight } from "./helper";
import type { PricePoint } from "./helper";

export interface PriceHistoryProps {
  points: PricePoint[];
  /** Row label on the left — whose price series this is. */
  label?: string;
  /** Weeks covered, shown in the heading; falls back to the point count. */
  weeks?: number;
  className?: string;
}

/**
 * Weekly price history — one column per week, price above a bar scaled against
 * the cheapest and dearest week in the window, so a drift up or down reads at a
 * glance. Scrolls sideways on narrow screens rather than squashing the columns.
 */
const PriceHistory = ({
  points,
  label = "You",
  weeks,
  className,
}: PriceHistoryProps) => {
  if (!points?.length) return null;

  const values = points.map((point) => point.value).filter(Boolean);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;

  return (
    <section
      className={clsx(
        "tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:px-4 tw:py-3",
        className,
      )}
    >
      <div className="tw:text-[11px] tw:font-bold tw:uppercase tw:tracking-wide tw:text-slate-500">
        Price history
        <span className="tw:text-slate-400">
          {" "}
          · {weeks || points.length} weeks
        </span>
      </div>

      <div className="tw:mt-3 tw:flex tw:items-end tw:gap-3 tw:overflow-x-auto">
        <span className="tw:shrink-0 tw:pb-4 tw:text-[11px] tw:font-bold tw:uppercase tw:tracking-wide tw:text-slate-500">
          {label}
        </span>

        <div className="tw:flex tw:min-w-0 tw:flex-1 tw:items-end tw:justify-between tw:gap-3">
          {points.map((point) => (
            <div
              key={point.key}
              className="tw:flex tw:shrink-0 tw:flex-col tw:items-center tw:gap-1"
            >
              <span className="tw:text-xs tw:font-bold tw:text-teal-700">
                {point.value ? <Amount value={point.value} /> : "—"}
              </span>

              <span
                className="tw:w-6 tw:rounded tw:bg-teal-600"
                style={{ height: `${getBarHeight(point.value, min, max)}px` }}
              />

              <span className="tw:text-[10px] tw:whitespace-nowrap tw:text-slate-500">
                {point.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PriceHistory;
