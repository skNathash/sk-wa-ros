import { useEffect, useState } from "react";
import { Area, AreaChart, Tooltip, XAxis, YAxis } from "recharts";
import clsx from "clsx";
import AppCard from "~/components/core/card/AppCard";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import Amount from "~/components/core/amount/Amount";
import { ChartContainer } from "~/components/ui/chart";
import SellerCatalogService from "~/services/SellerCatalogService";

type TrendPoint = {
  month: string;
  label: string;
  shortLabel: string;
  units: number;
  value: number;
  orderCount: number;
};

type MonthlySales = {
  totalUnits: number;
  totalValue: number;
  unitsGrowthPercent: number | null;
  valueGrowthPercent: number | null;
  avgQuantityPerOrder: number | null;
  trend: TrendPoint[];
};

const chartConfig = {
  units: { label: "Units Sold", color: "#0f766e" },
};

const emptyData: MonthlySales = {
  totalUnits: 0,
  totalValue: 0,
  unitsGrowthPercent: null,
  valueGrowthPercent: null,
  avgQuantityPerOrder: null,
  trend: [],
};

const StatTile = ({
  label,
  children,
  hint,
  accent,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  accent?: boolean;
}) => (
  <div className="tw:rounded-xl tw:bg-slate-50 tw:p-4">
    <p className="tw:text-[11px] tw:font-semibold tw:tracking-wide tw:uppercase tw:text-slate-500">
      {label}
    </p>
    <div
      className={clsx(
        "tw:text-2xl tw:font-bold tw:mt-1",
        accent ? "tw:text-teal-700" : "tw:text-slate-800"
      )}
    >
      {children}
    </div>
    {hint ? (
      <p className="tw:text-[11px] tw:text-slate-400 tw:mt-0.5">{hint}</p>
    ) : null}
  </div>
);

const SalesTrend = ({ dealId }: { dealId: string }) => {
  const [data, setData] = useState<MonthlySales>(emptyData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!dealId) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const response = await SellerCatalogService.getMonthlySalesTrend(
          dealId,
          { months: 12 }
        );
        const d = response.data?.data || {};
        if (!active) return;
        setData({
          totalUnits: d.totalUnits || 0,
          totalValue: d.totalValue || 0,
          unitsGrowthPercent: d.unitsGrowthPercent ?? null,
          valueGrowthPercent: d.valueGrowthPercent ?? null,
          avgQuantityPerOrder: d.avgQuantityPerOrder ?? null,
          trend: Array.isArray(d.trend)
            ? d.trend.map((point: TrendPoint) => ({
                ...point,
                shortLabel: (point.label || point.month || "").slice(0, 3),
              }))
            : [],
        });
      } catch (error) {
        if (active) setData(emptyData);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [dealId]);

  // The last bucket in the trend is the running month — used as the last 30 days.
  const last30 = data.trend[data.trend.length - 1];
  const growth = data.unitsGrowthPercent;

  return (
    <AppCard className="tw:mb-4" bodyClassName="tw:p-4">
      <div className="tw:flex tw:items-center tw:justify-between tw:mb-2">
        <h3 className="tw:text-[11px] tw:font-semibold tw:tracking-wide tw:uppercase tw:text-slate-500">
          Units Sold · Last 12 Months
        </h3>
        {growth !== null && growth !== undefined ? (
          <span
            className={clsx(
              "tw:text-xs tw:font-bold",
              growth >= 0 ? "tw:text-teal-700" : "tw:text-red-600"
            )}
          >
            {growth >= 0 ? "↑" : "↓"} {growth >= 0 ? "+" : "-"}
            {Math.abs(growth).toFixed(0)}% YoY
          </span>
        ) : null}
      </div>

      {loading ? (
        <div className="tw:flex tw:items-center tw:justify-center tw:h-[180px]">
          <AppSpinner size="sm" />
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="tw:h-[180px] tw:w-full">
          <AreaChart
            data={data.trend}
            margin={{ top: 8, right: 4, bottom: 0, left: 4 }}
          >
            <defs>
              <linearGradient id="salesTrendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0f766e" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#0f766e" stopOpacity={0.06} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="shortLabel"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={0}
              minTickGap={0}
              tick={{ fontSize: 10, fill: "#94a3b8" }}
            />
            <YAxis hide domain={[0, "dataMax"]} />
            <Tooltip
              cursor={{ stroke: "#cbd5e1", strokeDasharray: "3 3" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as TrendPoint;
                return (
                  <div className="tw:bg-white tw:shadow-lg tw:rounded-lg tw:p-3 tw:border tw:text-xs">
                    <p className="tw:font-semibold tw:mb-1">{d.month}</p>
                    <p>Units: {d.units}</p>
                    <p>
                      Revenue: <Amount value={d.value} decimalPlaces={0} />
                    </p>
                    <p>Orders: {d.orderCount}</p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="units"
              stroke="var(--color-units)"
              strokeWidth={2}
              fill="url(#salesTrendFill)"
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ChartContainer>
      )}

      <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-3 tw:gap-3 tw:mt-3">
        <StatTile label="Last 30d Units">{last30?.units || 0}</StatTile>
        <StatTile label="Revenue" accent>
          <Amount value={last30?.value || 0} decimalPlaces={0} />
        </StatTile>
        <StatTile label="Avg Per Bill" hint="units in a basket">
          {data.avgQuantityPerOrder !== null
            ? Number(data.avgQuantityPerOrder).toFixed(1)
            : "-"}
        </StatTile>
      </div>
    </AppCard>
  );
};

export default SalesTrend;
