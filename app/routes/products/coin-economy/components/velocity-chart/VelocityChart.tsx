import { useEffect, useState } from "react";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { formatCoins } from "../../helper";
import { getData, getRedemptionShift, type CoinTrendWeek } from "./helper";

const WEEKS = 12;

/**
 * "Velocity · 12 weeks" — paired bars per week contrasting coins earned (amber)
 * with coins redeemed (violet), scaled against the tallest bar in the window.
 * Below the bars, how the redeem side moved over the second half.
 */
const VelocityChart = () => {
  const [weeks, setWeeks] = useState<CoinTrendWeek[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTrend = async () => {
      setLoading(true);
      try {
        setWeeks(await getData(WEEKS));
      } catch (e) {
        setWeeks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrend();
  }, []);

  const max = Math.max(...weeks.flatMap((w) => [w.earned, w.redeemed]), 0);
  const shift = getRedemptionShift(weeks);

  return (
    <div className="tw:flex tw:h-full tw:flex-col tw:overflow-hidden tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:shadow-sm">
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border-b tw:border-slate-100 tw:px-5 tw:py-4">
        <div className="tw:text-base tw:font-semibold tw:text-slate-800">
          Velocity · {WEEKS} weeks
        </div>

        <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-4 tw:text-xs tw:text-slate-500">
          <span className="tw:flex tw:items-center tw:gap-1.5">
            <span className="tw:h-2 tw:w-2 tw:rounded-full tw:bg-amber-400" />
            Earned
          </span>
          <span className="tw:flex tw:items-center tw:gap-1.5">
            <span className="tw:h-2 tw:w-2 tw:rounded-full tw:bg-violet-500" />
            Redeemed
          </span>
        </div>
      </div>

      {loading ? (
        <div className="tw:flex tw:flex-1 tw:items-center tw:justify-center tw:py-12">
          <AppSpinner className="tw:h-6 tw:w-6" />
        </div>
      ) : !weeks.length ? (
        <div className="tw:flex tw:flex-1 tw:items-center tw:justify-center">
          <NoData />
        </div>
      ) : (
        <div className="tw:flex tw:flex-1 tw:flex-col tw:px-5 tw:py-5">
          <div className="tw:flex tw:min-h-40 tw:flex-1 tw:items-end tw:gap-2">
            {weeks.map((w) => (
              <div
                key={w.week}
                className="tw:flex tw:h-full tw:flex-1 tw:items-end tw:justify-center tw:gap-1"
              >
                <div
                  className="tw:w-1/3 tw:max-w-3 tw:min-h-px tw:rounded-t-sm tw:bg-amber-400"
                  style={{ height: `${max ? (w.earned / max) * 100 : 0}%` }}
                  title={`${w.week} earned ${formatCoins(w.earned)}`}
                />
                <div
                  className="tw:w-1/3 tw:max-w-3 tw:min-h-px tw:rounded-t-sm tw:bg-violet-500"
                  style={{ height: `${max ? (w.redeemed / max) * 100 : 0}%` }}
                  title={`${w.week} redeemed ${formatCoins(w.redeemed)}`}
                />
              </div>
            ))}
          </div>

          <div className="tw:mt-2 tw:flex tw:gap-2">
            {weeks.map((w) => (
              <div
                key={w.week}
                className="tw:flex-1 tw:text-center tw:text-[10px] tw:text-slate-400"
              >
                {w.week}
              </div>
            ))}
          </div>

          {shift && (
            <div className="tw:mt-4 tw:text-center tw:text-xs tw:text-slate-500">
              Redeem side is{" "}
              <span className="tw:font-semibold tw:text-violet-600">
                {shift.multiple}× the earlier weeks
              </span>{" "}
              over the last {shift.weeks} — the Coin Store push is working.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VelocityChart;
