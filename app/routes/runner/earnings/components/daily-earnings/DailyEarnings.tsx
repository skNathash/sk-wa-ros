import clsx from "clsx";
import { DAILY_EARNINGS, DAILY_EARNINGS_LBL } from "./helper";

/**
 * The week day by day. Bars are drawn against the best day rather than a fixed
 * scale, so a slow week still reads as a shape; only today is filled, so the
 * runner can place themselves in the week without reading a single number.
 */
export default function DailyEarnings() {
  return (
    <section className="tw:flex tw:flex-col tw:gap-3 tw:px-4 tw:pt-5">
      <span className="app-label tw:text-slate-500">{DAILY_EARNINGS_LBL}</span>

      <div className="runner-chart">
        {DAILY_EARNINGS.map((day) => (
          <div key={day.key} className="runner-chart-col">
            <span
              className={clsx(
                "runner-chart-value",
                day.isToday && "runner-chart-value--today",
              )}
            >
              {day._amountLbl}
            </span>

            <span
              className={clsx(
                "runner-chart-bar",
                day.isToday && "runner-chart-bar--today",
              )}
              style={{ height: `${day._heightPct}%` }}
            />

            <span
              className={clsx(
                "runner-chart-day",
                day.isToday && "runner-chart-day--today",
              )}
            >
              {day.dayLbl}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
