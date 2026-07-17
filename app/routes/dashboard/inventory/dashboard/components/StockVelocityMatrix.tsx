import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import AppCard from "~/components/core/card/AppCard";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { ChartContainer } from "~/components/ui/chart";
import type { VelocityData } from "../helper";

const chartConfig = {
  fastMoving: { label: "Fast Moving", color: "#22c55e" },
  slow: { label: "Slow", color: "#f59e0b" },
  deadStock: { label: "Dead Stock", color: "#ef4444" },
};

const formatValue = (v: number) =>
  v >= 100000
    ? `₹${(v / 100000).toFixed(1)}L`
    : v >= 1000
      ? `₹${(v / 1000).toFixed(1)}k`
      : `₹${v}`;

const StockVelocityMatrix = ({
  data,
  loading,
}: {
  data: VelocityData[];
  loading: boolean;
}) => {
  return (
    <AppCard bodyClassName="tw:p-4">
      <h3 className="tw:text-sm tw:font-semibold tw:mb-4">
        Stock Velocity Matrix
      </h3>
      {loading ? (
        <div className="tw:flex tw:items-center tw:justify-center tw:h-48">
          <AppSpinner size="sm" />
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="tw:h-[220px] tw:w-full">
          <BarChart data={data}>
            <XAxis
              dataKey="daysOfInventory"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              label={{
                value: "Days of Inventory",
                position: "insideBottom",
                offset: -5,
                fontSize: 10,
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={formatValue}
              tick={{ fontSize: 10 }}
            />
            <Tooltip formatter={(value: number) => formatValue(value)} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11 }}
            />
            <Bar
              dataKey="fastMoving"
              fill="#22c55e"
              radius={[4, 4, 0, 0]}
              name="Fast Moving"
            />
            <Bar
              dataKey="slow"
              fill="#f59e0b"
              radius={[4, 4, 0, 0]}
              name="Slow"
            />
            <Bar
              dataKey="deadStock"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
              name="Dead Stock"
            />
          </BarChart>
        </ChartContainer>
      )}
    </AppCard>
  );
};

export default StockVelocityMatrix;
