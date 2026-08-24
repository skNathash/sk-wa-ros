import clsx from "clsx";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import CommonService from "~/services/CommonService";
import { pnlPalette } from "~/shared/accounts/pnl-format";
import {
  emptyYearComparison,
  getYearComparison,
  type ComparisonTone,
  type YearComparisonData,
} from "./helper";

/* Last year's bars stay grey throughout so the eye reads them as the backdrop;
   this year's carry the line's own colour — blue for the top line and its costs,
   green for what survives as profit. */
const barColor: Record<ComparisonTone, string> = {
  revenue: pnlPalette.revenue,
  profit: pnlPalette.profit,
};

/**
 * The P&L laid out twice — this year so far against the same months last year,
 * one line at a time, so a gain in revenue can be read next to what it cost to
 * earn and what was left at the end of it.
 */
const YearComparison = () => {
  const { t } = useTranslation(["common"]);

  const [data, setData] = useState<YearComparisonData>(emptyYearComparison);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let result: YearComparisonData;
      try {
        result = await getYearComparison();
      } catch (e) {
        result = emptyYearComparison();
      }
      if (cancelled) return;
      setData(result);
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="tw:mb-3 tw:overflow-hidden tw:rounded-2xl tw:bg-white tw:shadow-sm">
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border-b tw:border-gray-100 tw:px-4 tw:py-3">
        <div className="tw:text-sm tw:font-bold tw:text-gray-800">
          {t("pnlYtdThisYearVsLastYear", {
            defaultValue: "YTD · this year vs last year",
          })}
        </div>
        <div className="tw:shrink-0 tw:text-[11px] tw:text-gray-400">
          {data.note}
        </div>
      </div>

      {loading ? (
        <div className="tw:p-6 tw:text-center">
          <AppSpinner />
        </div>
      ) : (
        <div className="tw:px-4 tw:py-3">
          {data.rows.map((row) => (
            <div
              key={row.key}
              className="tw:flex tw:flex-col tw:gap-2 tw:py-2.5 tw:md:flex-row tw:md:items-center tw:md:gap-4"
            >
              <div
                className={clsx(
                  "tw:w-full tw:shrink-0 tw:truncate tw:text-xs tw:md:w-36",
                  row.tone === "profit"
                    ? "tw:font-bold tw:text-gray-900"
                    : "tw:text-gray-600",
                )}
              >
                {row.label}
              </div>

              <div className="tw:flex tw:flex-1 tw:flex-col tw:gap-2 tw:sm:flex-row tw:sm:gap-4">
                {/* This year, then the same months last year — same scale. */}
                <div className="tw:flex-1">
                  <div className="tw:text-[10px] tw:text-gray-400">
                    {data.currentLabel}
                  </div>
                  <div className="tw:mt-0.5 tw:h-2 tw:overflow-hidden tw:rounded-full tw:bg-gray-200">
                    <div
                      className="tw:h-full tw:rounded-full"
                      style={{
                        width: `${Math.min(100, Math.max(0, row.currentPercent))}%`,
                        background: barColor[row.tone],
                      }}
                    />
                  </div>
                  <div className="tw:mt-0.5 tw:text-xs tw:font-semibold tw:text-gray-900">
                    {CommonService.formatCompact(row.current)}
                  </div>
                </div>

                <div className="tw:flex-1">
                  <div className="tw:text-[10px] tw:text-gray-400">
                    {data.previousLabel}
                  </div>
                  <div className="tw:mt-0.5 tw:h-2 tw:overflow-hidden tw:rounded-full tw:bg-gray-200">
                    <div
                      className="tw:h-full tw:rounded-full"
                      style={{
                        width: `${Math.min(100, Math.max(0, row.previousPercent))}%`,
                        background: "#9ca3af",
                      }}
                    />
                  </div>
                  <div className="tw:mt-0.5 tw:text-xs tw:font-semibold tw:text-gray-500">
                    {CommonService.formatCompact(row.previous)}
                  </div>
                </div>
              </div>

              <div
                title={row.deltaNote || undefined}
                className={clsx(
                  "tw:w-16 tw:shrink-0 tw:text-right tw:text-xs tw:font-semibold",
                  row.delta === null
                    ? "tw:text-gray-400"
                    : row.delta >= 0
                      ? "tw:text-emerald-600"
                      : "tw:text-red-600",
                )}
              >
                {row.deltaText}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default YearComparison;
