import { BoxIcon, PackageIcon } from "lucide-react";
import AppStatsCard from "~/components/core/stats-card/AppStatsCard";

type Props = {
  summary: {
    totalCount: number;
    caseCount: number;
    innerCaseCount: number;
  };
};

const Summary = ({ summary }: Props) => {
  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4 tw:mb-4">
      <AppStatsCard
        label="Total Count"
        color="info"
        icon={<PackageIcon />}
        template={1}
      >
        <span className="tw:text-2xl tw:font-bold">{summary.totalCount}</span>
      </AppStatsCard>
      <AppStatsCard
        label="Sell In Case Count"
        color="success"
        icon={<BoxIcon />}
        template={1}
      >
        <span className="tw:text-2xl tw:font-bold">{summary.caseCount}</span>
      </AppStatsCard>
      <AppStatsCard
        label="Sell In Inner Case Count"
        color="warning"
        icon={<PackageIcon />}
        template={1}
      >
        <span className="tw:text-2xl tw:font-bold">
          {summary.innerCaseCount}
        </span>
      </AppStatsCard>
    </div>
  );
};

export default Summary;
