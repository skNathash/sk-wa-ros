import Amount from "~/components/core/amount/Amount";

interface MetricsStripProps {
  stockoutValue: number;
  saveThisWeek: number;
  slowCash: number;
}

const toneMap: Record<string, { border: string; text: string }> = {
  red: {
    border: "tw:border-t-red-500",
    text: "tw:text-red-600",
  },
  green: {
    border: "tw:border-t-emerald-600",
    text: "tw:text-emerald-700",
  },
  amber: {
    border: "tw:border-t-amber-500",
    text: "tw:text-amber-700",
  },
};

const MetricCard: React.FC<{
  value: number;
  label: string;
  tone: "red" | "green" | "amber";
}> = ({ value, label, tone }) => {
  const toneStyle = toneMap[tone];
  return (
    <div
      className={`tw:flex-1 tw:min-w-0 tw:rounded-lg tw:bg-white tw:p-3 tw:shadow-sm tw:border tw:border-slate-100 tw:border-t-4 ${toneStyle.border}`}
    >
      <div className={`tw:text-lg tw:font-bold ${toneStyle.text}`}>
        <Amount value={value} decimalPlaces={0} />
      </div>
      <div className="app-label tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-slate-500">
        {label}
      </div>
    </div>
  );
};

const MetricsStrip: React.FC<MetricsStripProps> = ({
  stockoutValue,
  saveThisWeek,
  slowCash,
}) => {
  return (
    <div className="tw:grid tw:grid-cols-3 tw:gap-3">
      <MetricCard value={stockoutValue} label="STOCKOUT · WK" tone="red" />
      <MetricCard value={saveThisWeek} label="SAVE THIS WK" tone="green" />
      <MetricCard value={slowCash} label="SLOW CASH" tone="amber" />
    </div>
  );
};

export default MetricsStrip;
