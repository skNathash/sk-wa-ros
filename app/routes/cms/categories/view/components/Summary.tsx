import AppStatsCard from "~/components/core/stats-card/AppStatsCard";
import { SUMMARY_DATA } from "../helper";
import Amount from "~/components/core/amount/Amount";

const summaryData = SUMMARY_DATA;

const Summary = ({ summary }: { summary: any }) => {
  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-4 tw:gap-4 tw:mb-4">
      {summaryData.map((item: any) => (
        <AppStatsCard
          key={item.label}
          label={item.label}
          icon={<item.icon />}
          color={item.color}
          template={2}
        >
          <span className="tw:text-2xl tw:font-bold">
            {item.isAmount ? (
              <Amount
                value={summary[item.valueKey as keyof typeof summary] || 0}
              />
            ) : (
              summary[item.valueKey as keyof typeof summary] || 0
            )}
          </span>
        </AppStatsCard>
      ))}
    </div>
  );
};

export default Summary;
