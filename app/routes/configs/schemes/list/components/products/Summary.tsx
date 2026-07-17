import { CalendarIcon, PackageIcon, TimerIcon, XCircle } from "lucide-react";
import AppStatsCard from "~/components/core/stats-card/AppStatsCard";

type Props = {
  summary: {
    totalCount: number;
    runningCount: number;
    upcomingCount: number;
    expiredCount?: number;
  };
};

const Summary = ({ summary }: Props) => {
  return (
    <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:gap-4 tw:mb-4">
      <AppStatsCard
        label="Total"
        color="info"
        icon={<PackageIcon />}
        template={1}
      >
        <span className="tw:text-2xl tw:font-bold">{summary.totalCount}</span>
      </AppStatsCard>

      <AppStatsCard
        label="Running"
        color="success"
        icon={<TimerIcon />}
        template={1}
      >
        <span className="tw:text-2xl tw:font-bold">{summary.runningCount}</span>
      </AppStatsCard>

      <AppStatsCard
        label="Upcoming"
        color="warning"
        icon={<CalendarIcon />}
        template={1}
      >
        <span className="tw:text-2xl tw:font-bold">
          {summary.upcomingCount}
        </span>
      </AppStatsCard>

      <AppStatsCard
        label="Expired"
        color="danger"
        icon={<XCircle />}
        template={1}
      >
        <span className="tw:text-2xl tw:font-bold">
          {summary.expiredCount || 0}
        </span>
      </AppStatsCard>
    </div>
  );
};

export default Summary;
