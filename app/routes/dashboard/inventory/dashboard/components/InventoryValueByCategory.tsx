import { Bar, BarChart, XAxis, YAxis, Tooltip, Cell } from "recharts";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { ChartContainer } from "~/components/ui/chart";
import type { CategoryValue } from "../helper";

const COLORS = [
  "#22c55e",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#f97316",
  "#14b8a6",
  "#6366f1",
];

const chartConfig = {
  inventoryValue: { label: "Inventory Value", color: "#22c55e" },
};

const InventoryValueByCategory = ({
  data,
  loading,
}: {
  data: CategoryValue[];
  loading: boolean;
}) => {
  return (
    <AppCard className="app-chart-card" bodyClassName="tw:p-4">
      <h3 className="tw:text-sm tw:font-semibold tw:mb-4 app-chart-title">
        Top 10 Categories by Inventory Value
      </h3>
      {loading ? (
        <div className="tw:flex tw:items-center tw:justify-center tw:h-60">
          <AppSpinner size="sm" />
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="tw:h-[280px] tw:w-full">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 0, right: 10, top: 0, bottom: 0 }}
          >
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) =>
                v >= 100000
                  ? `₹${(v / 100000).toFixed(0)}L`
                  : v >= 1000
                    ? `₹${(v / 1000).toFixed(0)}k`
                    : `₹${v}`
              }
            />
            <YAxis
              type="category"
              dataKey="category"
              tickLine={false}
              axisLine={false}
              width={140}
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="tw:bg-white tw:shadow-lg tw:rounded-lg tw:p-3 tw:border tw:text-xs">
                    <p className="tw:font-semibold tw:mb-1">
                      {d.category}
                    </p>
                    <p>
                      Inventory: <Amount value={d.inventoryValue} />
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="inventoryValue" radius={[0, 4, 4, 0]}>
              {data.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </AppCard>
  );
};

export default InventoryValueByCategory;
