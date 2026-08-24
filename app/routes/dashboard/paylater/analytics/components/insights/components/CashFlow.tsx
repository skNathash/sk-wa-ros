import { useEffect, useState } from "react";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import CommonService from "~/services/CommonService";
import { getCashFlow, getFlipWeek, type CashFlowWeek } from "../helper";

const WEEKS = 12;

/**
 * "Cash flow · 12 weeks" card — paired bars per week contrasting credit issued
 * (violet) with what came back (green), scaled against the tallest bar in the
 * window. Below the chart, the latest week where recovery overtook issuance.
 */
const CashFlowChart = () => {
  const [weeks, setWeeks] = useState<CashFlowWeek[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCashFlow = async () => {
      setLoading(true);
      try {
        setWeeks(await getCashFlow(WEEKS));
      } catch (e) {
        setWeeks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCashFlow();
  }, []);

  const max = Math.max(...weeks.flatMap((w) => [w.issued, w.recovered]), 0);
  const flip = getFlipWeek(weeks);

  return (
    <div className="tw:flex tw:h-full tw:flex-col tw:overflow-hidden tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:shadow-sm">
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border-b tw:border-slate-100 tw:px-5 tw:py-4">
        <div className="tw:text-base tw:font-semibold tw:text-slate-800">
          Cash flow · {WEEKS} weeks
        </div>

        <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-4 tw:text-xs tw:text-slate-500">
          <span className="tw:flex tw:items-center tw:gap-1.5">
            <span className="tw:h-2 tw:w-2 tw:rounded-full tw:bg-violet-500" />
            Issued
          </span>
          <span className="tw:flex tw:items-center tw:gap-1.5">
            <span className="tw:h-2 tw:w-2 tw:rounded-full tw:bg-emerald-500" />
            Recovered
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
                  className="tw:w-1/3 tw:max-w-3 tw:min-h-px tw:rounded-t-sm tw:bg-violet-500"
                  style={{ height: `${max ? (w.issued / max) * 100 : 0}%` }}
                  title={`${w.week} issued ${CommonService.formatCompact(w.issued)}`}
                />
                <div
                  className="tw:w-1/3 tw:max-w-3 tw:min-h-px tw:rounded-t-sm tw:bg-emerald-500"
                  style={{ height: `${max ? (w.recovered / max) * 100 : 0}%` }}
                  title={`${w.week} recovered ${CommonService.formatCompact(w.recovered)}`}
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

          {flip && (
            <div className="tw:mt-4 tw:text-center tw:text-xs tw:text-slate-500">
              <span className="tw:font-semibold tw:text-emerald-600">
                {flip.week} flip
              </span>{" "}
              — recovered {CommonService.formatCompact(flip.recovered)} against{" "}
              {CommonService.formatCompact(flip.issued)} issued.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CashFlowChart;
