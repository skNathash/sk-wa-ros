import { Bar, BarChart, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";

const AppChart = ({
  config,
  data,
  className,
  xAxisDataKey,
  tooltipLabelFormatter,
  tickFormatter,
}: {
  config: any;
  data: any;
  className?: string;
  xAxisDataKey?: string;
  tooltipFormatter?: (value: string) => string;
  tooltipLabelFormatter?: (value: string) => string;
  tickFormatter?: (value: string) => string;
}) => {
  return (
    <ChartContainer config={config} className={className}>
      <BarChart accessibilityLayer data={data}>
        <XAxis
          dataKey={xAxisDataKey}
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={tickFormatter}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              className="w-[150px]"
              nameKey={xAxisDataKey}
              labelFormatter={tooltipLabelFormatter}
            />
          }
        />
        {Object.keys(config).map((key) => (
          <Bar key={key} dataKey={key} fill={config[key].color} radius={4} />
        ))}
      </BarChart>
    </ChartContainer>
  );
};

export default AppChart;
