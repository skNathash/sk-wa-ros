import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppStatsCard from "~/components/core/stats-card/AppStatsCard";
import { defaultSummary } from "../helper";
import useScreenView from "~/hooks/useScreenView";

const summaryData = [...defaultSummary];

type SummaryShape = {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  uniqueCustomers: number;
};

const Summary = ({ summary }: { summary: SummaryShape }) => {
  const { t } = useTranslation(["common"]);
  const { isMobile } = useScreenView();

  const renderCard = (item: any, index: number) => (
    <AppStatsCard
      key={index}
      label={t(item.label)}
      icon={<item.icon size={16} />}
      template={isMobile ? 1 : 2}
      color={item.color as any}
    >
      <div className="tw:text-lg tw:lg:text-2xl tw:font-semibold">
        {item.isAmount ? (
          <Amount
            value={summary[item.valueKey as keyof typeof summary] || 0}
            decimalPlaces={0}
          />
        ) : (
          summary[item.valueKey as keyof typeof summary] || 0
        )}
      </div>
    </AppStatsCard>
  );

  return (
    <div className="tw:mb-4">
      <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:gap-2">
        {summaryData.map((item, index) => (
          <div key={index} className="tw:w-full">
            {renderCard(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Summary;
