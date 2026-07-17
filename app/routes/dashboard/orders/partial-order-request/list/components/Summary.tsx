import { useTranslation } from "react-i18next";
import AppStatsCard from "~/components/core/stats-card/AppStatsCard";
import { defaultSummary } from "../helper";
import useScreenView from "~/hooks/useScreenView";

type SummaryShape = {
  total: number;
  "approval pending": number;
  approved: number;
  rejected: number;
};

const Summary = ({ summary }: { summary: SummaryShape }) => {
  const { t } = useTranslation(["common"]);
  const { isMobile } = useScreenView();

  const renderCard = (item: any) => (
    <AppStatsCard
      key={item.key}
      label={t(item.label)}
      icon={<item.icon size={16} />}
      template={isMobile ? 1 : 2}
      color={item.color as any}
    >
      <div className="tw:text-lg tw:lg:text-2xl tw:font-semibold">
        {summary[item.key as keyof SummaryShape] || 0}
      </div>
    </AppStatsCard>
  );

  return (
    <div className="tw:mb-4">
      <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:gap-2">
        {defaultSummary.map((item) => (
          <div key={item.key} className="tw:w-full">
            {renderCard(item)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Summary;
