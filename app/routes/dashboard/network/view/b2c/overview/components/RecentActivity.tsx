import React from "react";
import AppCard from "~/components/core/card/AppCard";
import NoData from "~/components/core/no-data/NoData";

interface RecentActivityProps {
  activities?: Array<{ id?: string | number; text: React.ReactNode }>;
  className?: string;
}

const RecentActivity: React.FC<RecentActivityProps> = ({
  activities = [],
  className = "",
}) => {
  return (
    <AppCard title="Recent Activity" className={className} noShadow>
      {activities.length === 0 ? (
        <NoData />
      ) : (
        <ul className="tw-list-none tw-p-0 tw-m-0 tw-flex tw-flex-col tw-gap-2">
          {activities.map((a) => (
            <li key={String(a.id ?? a.text)} className="tw-text-sm">
              {a.text}
            </li>
          ))}
        </ul>
      )}
    </AppCard>
  );
};

export default RecentActivity;
