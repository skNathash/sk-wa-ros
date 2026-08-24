import clsx from "clsx";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import CommonService from "~/services/CommonService";
import { pnlPalette } from "~/shared/accounts/pnl-format";
import {
  emptyQuarterOverQuarter,
  getQuarterOverQuarter,
  type QuarterOverQuarterData,
} from "./helper";

/**
 * The last four quarters on one scale — revenue, net profit and margin per row.
 *
 * The quarter in progress is drawn solid and labelled with how far into it the
 * shop is, so its short bar reads as "not finished yet" rather than as a
 * collapse against the three closed quarters above it.
 */
const QuarterOverQuarter = () => {
  const { t } = useTranslation(["common"]);

  const [data, setData] = useState<QuarterOverQuarterData>(
    emptyQuarterOverQuarter,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let result: QuarterOverQuarterData;
      try {
        result = await getQuarterOverQuarter();
      } catch (e) {
        result = emptyQuarterOverQuarter();
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
      <div className="tw:border-b tw:border-gray-100 tw:px-4 tw:py-3">
        <div className="tw:text-sm tw:font-bold tw:text-gray-800">
          {t("pnlQuarterOverQuarter", {
            defaultValue: "Quarter-over-quarter",
          })}
          <span className="tw:px-1.5 tw:font-normal tw:text-gray-400">·</span>
          <span className="tw:font-normal tw:text-gray-400">{data.note}</span>
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
              className="tw:flex tw:flex-col tw:gap-1.5 tw:py-2 tw:md:flex-row tw:md:items-center tw:md:gap-3"
            >
              <div className="tw:w-full tw:shrink-0 tw:md:w-44">
                <div
                  className={clsx(
                    "tw:truncate tw:text-xs",
                    row.current
                      ? "tw:font-bold tw:text-emerald-700"
                      : "tw:text-gray-600",
                  )}
                >
                  {row.label}
                </div>
                {row.progressLabel && (
                  <div className="tw:text-[11px] tw:text-gray-400">
                    {row.progressLabel}
                  </div>
                )}
              </div>

              <div className="tw:h-2.5 tw:flex-1 tw:overflow-hidden tw:rounded-full tw:bg-gray-200">
                <div
                  className="tw:h-full tw:rounded-full"
                  style={{
                    width: `${Math.min(100, Math.max(0, row.percent))}%`,
                    background: row.current
                      ? pnlPalette.profit
                      : pnlPalette.profitSoft,
                  }}
                />
              </div>

              <div className="tw:flex tw:shrink-0 tw:items-center tw:justify-between tw:gap-4 tw:md:justify-end">
                <div className="tw:w-20 tw:text-right tw:text-xs tw:font-semibold tw:text-gray-900">
                  {CommonService.formatCompact(row.revenue)}
                </div>
                <div className="tw:w-20 tw:text-right tw:text-xs tw:font-semibold tw:text-emerald-700">
                  {CommonService.formatCompact(row.net)}
                </div>
                <div
                  className={clsx(
                    "tw:w-14 tw:text-right tw:text-xs tw:font-semibold",
                    row.current ? "tw:text-emerald-700" : "tw:text-gray-700",
                  )}
                >
                  {row.margin}%
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuarterOverQuarter;
