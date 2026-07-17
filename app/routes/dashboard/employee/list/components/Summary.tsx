import { useTranslation } from "react-i18next";
import AppStatsCard from "~/components/core/stats-card/AppStatsCard";

const Summary = ({ summary }: { summary: any[] }) => {
  const { t } = useTranslation(["common"]);
  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-4 tw:gap-4 tw:mb-4">
      {summary.map((item) => (
        <AppStatsCard
          key={item.key}
          label={t(item.langKey)}
          icon={item.icon}
          template={2}
          color={item.color as any}
        >
          <div className="tw:text-2xl tw:font-bold">{item.value}</div>
        </AppStatsCard>
      ))}
    </div>
  );
};

export default Summary;
