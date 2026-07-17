import AppStatsCard from "~/components/core/stats-card/AppStatsCard";

type Props = {
  summary: {
    totalCount: number;
    refundedCount: number;
    pendingCount: number;
  };
};

const fmt = (n: number) => new Intl.NumberFormat().format(n || 0);

const cards: Array<{
  label: string;
  key: "totalCount" | "pendingCount" | "refundedCount";
  color: "primary" | "warning" | "success";
  icon: string;
}> = [
  {
    label: "Total Refunds",
    key: "totalCount",
    color: "primary",
    icon: "receipt-text",
  },
  {
    label: "Pending",
    key: "pendingCount",
    color: "warning",
    icon: "clock",
  },
  {
    label: "Refunded",
    key: "refundedCount",
    color: "success",
    icon: "circle-check",
  },
];

const Summary = ({ summary }: Props) => {
  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4 tw:mb-4">
      {cards.map((card) => (
        <AppStatsCard
          key={card.label}
          label={card.label}
          icon={card.icon}
          color={card.color}
          template={2}
        >
          <span className="tw:text-2xl tw:font-bold tw:tabular-nums tw:text-slate-900">
            {fmt(summary[card.key])}
          </span>
        </AppStatsCard>
      ))}
    </div>
  );
};

export default Summary;
