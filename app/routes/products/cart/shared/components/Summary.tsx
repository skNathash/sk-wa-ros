import { BoxIcon, IndianRupee, PackageIcon } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppStatsCard from "~/components/core/stats-card/AppStatsCard";

const Summary = ({ summary }: { summary: any }) => {
  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:md:gap-6 tw:gap-2 tw:mb-4">
      <AppStatsCard
        label="Total Items"
        icon={<PackageIcon />}
        template={2}
        color="info"
      >
        <span className="tw:text-xl tw:font-bold">{summary.totalItems}</span>
      </AppStatsCard>

      <AppStatsCard
        label="Total Units"
        icon={<BoxIcon />}
        template={2}
        color="primary"
      >
        <span className="tw:text-xl tw:font-bold">{summary.totalUnits}</span>
      </AppStatsCard>

      <AppStatsCard
        label="Total Value"
        icon={<IndianRupee />}
        template={2}
        color="success"
      >
        <span className="tw:text-xl tw:font-bold">
          <Amount value={summary.totalValue} />
        </span>
      </AppStatsCard>
    </div>
  );
};

export default Summary;
