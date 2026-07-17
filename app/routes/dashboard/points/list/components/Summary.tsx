import AppStatsCard from "~/components/core/stats-card/AppStatsCard";
import { useTranslation } from "react-i18next";

import { defaultSummary } from "../helper";
type SummaryProps = {
  summary: {
    totalEarned: number;
    totalRedeemed: number;
  };
};

const summaryData = [...defaultSummary];

const Summary = ({ summary }: SummaryProps) => {
  const { t } = useTranslation(["common"]);

  return (
    <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:gap-4 tw:mb-4">
      {summaryData.map((item: any) => (
        <AppStatsCard
          key={item.key}
          label={t(item.langKey)}
          icon={<item.icon />}
          template={1}
          color={item.color as any}
        >
          <div className="tw:text-2xl tw:font-bold">
            {summary[item.valueKey as keyof typeof summary] || 0}
          </div>
          {item.description && (
            <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
              {t(item.description)}
            </div>
          )}
        </AppStatsCard>
      ))}
    </div>
  );
};

export default Summary;
