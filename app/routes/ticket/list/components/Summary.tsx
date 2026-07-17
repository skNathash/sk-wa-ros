import AppStatsCard from "~/components/core/stats-card/AppStatsCard";

type SummaryProps = {
  data: any[];
};

const Summary: React.FC<SummaryProps> = ({ data }) => {
  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-4 tw:gap-4 tw:mb-4">
      {data.map((item) => (
        <AppStatsCard
          key={item.label}
          label={item.label}
          icon={item.icon}
          color={item.color}
          template={2}
        >
          <span className="tw:text-2xl tw:font-bold">{item.value}</span>
        </AppStatsCard>
      ))}
    </div>
  );
};

export default Summary;
