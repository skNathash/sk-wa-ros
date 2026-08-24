import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { ChartContainer } from "~/components/ui/chart";
import {
  compactNumber,
  compactRupees,
  pnlPalette,
} from "~/shared/accounts/pnl-format";
import {
  emptyTrailingMonths,
  getTrailingMonths,
  type TrailingMonth,
  type TrailingMonthsData,
} from "./helper";

const chartConfig = {
  revenue: { label: "Revenue", color: pnlPalette.revenue },
  net: { label: "Net profit", color: pnlPalette.profit },
};

const LegendKey = ({ label, mark }: { label: string; mark: ReactNode }) => (
  <span className="tw:flex tw:items-center tw:gap-1.5 tw:text-[11px] tw:text-gray-500">
    {mark}
    {label}
  </span>
);

/**
 * Twelve months of revenue and net profit on one frame — the line is what came
 * through the till, the columns are what was left of it. The reported month is
 * drawn solid so the eye lands on it, and amber dots mark the months that need
 * an explanation before the shape of the curve is read as a trend.
 */
const TrailingMonths = () => {
  const { t } = useTranslation(["common"]);

  const [data, setData] = useState<TrailingMonthsData>(emptyTrailingMonths);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let result: TrailingMonthsData;
      try {
        result = await getTrailingMonths();
      } catch (e) {
        result = emptyTrailingMonths();
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

  /* The amber dots ride their own series so they can sit above the revenue
     line without being tied to its shape. */
  const series = data.months.map((month) => ({
    ...month,
    notableAt: month.notable ? month.revenue * 1.06 : null,
  }));

  return (
    <div className="tw:mb-3 tw:rounded-2xl tw:bg-white tw:shadow-sm">
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:px-4 tw:py-3">
        <div className="tw:text-sm tw:font-bold tw:text-gray-800">
          {t("pnlTrailingMonths", { defaultValue: "Trailing 12 months" })}
        </div>
        <div className="tw:flex tw:items-center tw:gap-3">
          <LegendKey
            label={t("revenue")}
            mark={
              <span
                className="tw:inline-block tw:h-0.5 tw:w-3.5 tw:rounded-full"
                style={{ background: pnlPalette.revenue }}
              />
            }
          />
          <LegendKey
            label={t("pnlNetProfit", { defaultValue: "Net profit" })}
            mark={
              <span
                className="tw:inline-block tw:h-2.5 tw:w-2.5 tw:rounded-[2px]"
                style={{ background: pnlPalette.profit }}
              />
            }
          />
          <LegendKey
            label={t("pnlNotable", { defaultValue: "Notable" })}
            mark={
              <span
                className="tw:inline-block tw:h-2.5 tw:w-2.5 tw:rounded-full"
                style={{ background: pnlPalette.notable }}
              />
            }
          />
        </div>
      </div>

      {loading ? (
        <div className="tw:p-6 tw:text-center">
          <AppSpinner />
        </div>
      ) : (
        <>
          <div className="tw:px-2 tw:pb-1">
            <ChartContainer
              config={chartConfig}
              className="tw:h-[280px] tw:w-full"
            >
              <ComposedChart
                data={series}
                margin={{ top: 16, right: 12, bottom: 4, left: 4 }}
              >
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  stroke={pnlPalette.track}
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={44}
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  tickFormatter={(value: number) => compactNumber(value)}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.03)" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const month = payload[0].payload as TrailingMonth;
                    return (
                      <div className="tw:rounded-lg tw:border tw:border-gray-100 tw:bg-white tw:p-3 tw:text-xs tw:shadow-lg">
                        <div className="tw:mb-1 tw:font-semibold tw:text-gray-800">
                          {month.label}
                        </div>
                        <div className="tw:text-gray-600">
                          {t("revenue")}: {compactRupees(month.revenue)}
                        </div>
                        <div className="tw:text-gray-600">
                          {t("pnlNetProfit", { defaultValue: "Net profit" })}:{" "}
                          {compactRupees(month.net)}
                        </div>
                        {month.notable && (
                          <div className="tw:mt-1 tw:font-semibold tw:text-amber-600">
                            {month.notable}
                          </div>
                        )}
                      </div>
                    );
                  }}
                />

                <Bar dataKey="net" radius={[3, 3, 0, 0]} barSize={26}>
                  {series.map((month) => (
                    <Cell
                      key={month.key}
                      fill={
                        month.current
                          ? pnlPalette.profit
                          : pnlPalette.profitSoft
                      }
                    />
                  ))}
                </Bar>

                <Line
                  type="linear"
                  dataKey="revenue"
                  stroke={pnlPalette.revenue}
                  strokeWidth={2}
                  dot={{
                    r: 4,
                    fill: "#fff",
                    stroke: pnlPalette.revenue,
                    strokeWidth: 2,
                  }}
                  activeDot={{ r: 6 }}
                />

                <Scatter
                  dataKey="notableAt"
                  fill={pnlPalette.notable}
                  shape="circle"
                  legendType="none"
                />
              </ComposedChart>
            </ChartContainer>
          </div>

          {/* What the amber dots stand for, in the order they appear. */}
          {data.notes.length > 0 && (
            <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-x-6 tw:gap-y-1 tw:px-4 tw:pb-3">
              {data.notes.map((note) => (
                <span
                  key={note.key}
                  className="tw:flex tw:items-center tw:gap-1.5 tw:text-[11px] tw:text-gray-500"
                >
                  <span
                    className="tw:inline-block tw:h-2 tw:w-2 tw:rounded-full"
                    style={{ background: pnlPalette.notable }}
                  />
                  <span className="tw:font-semibold tw:text-gray-600">
                    {note.label}
                  </span>
                  <span className="tw:text-gray-300">·</span>
                  {note.note}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TrailingMonths;
