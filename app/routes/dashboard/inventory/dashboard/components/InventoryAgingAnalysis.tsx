import { Bar, BarChart, XAxis, YAxis, Tooltip, Cell } from "recharts";
import AppCard from "~/components/core/card/AppCard";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { ChartContainer } from "~/components/ui/chart";

type SkuMovementData = {
  name: string;
  value: number;
  color: string;
};

const chartConfig = {
  value: { label: "SKU Count", color: "#22c55e" },
};

const COLORS: Record<string, string> = {
  "Fast Moving": "#22c55e",
  "Slow Moving": "#f59e0b",
  "Non-Moving": "#ef4444",
};

const InventoryAgingAnalysis = ({
  data,
  loading,
}: {
  data: SkuMovementData[];
  loading: boolean;
}) => {
  return (
    <AppCard bodyClassName="tw:p-4">
      <h3 className="tw:text-sm tw:font-semibold tw:mb-4">
        Inventory Aging Analysis
      </h3>
      {loading ? (
        <div className="tw:flex tw:items-center tw:justify-center tw:h-48">
          <AppSpinner size="sm" />
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="tw:h-[220px] tw:w-full">
          <BarChart data={data} margin={{ top: 5, right: 10, bottom: 20, left: 10 }}>
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              label={{
                value: "Movement",
                position: "insideBottom",
                offset: -12,
                style: { fontSize: 11, fill: "#6b7280" },
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10 }}
              label={{
                value: "SKUs",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 11, fill: "#6b7280", textAnchor: "middle" },
              }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="tw:bg-white tw:shadow-lg tw:rounded-lg tw:p-3 tw:border tw:text-xs">
                    <p className="tw:font-semibold tw:mb-1">{d.name}</p>
                    <p>SKU Count: {d.value}</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, idx) => (
                <Cell key={idx} fill={COLORS[entry.name] || "#8884d8"} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </AppCard>
  );
};

export default InventoryAgingAnalysis;
