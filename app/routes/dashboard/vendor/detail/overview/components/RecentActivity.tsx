import React from "react";
import AppCard from "~/components/core/card/AppCard";

const RecentActivity: React.FC = () => {
  return (
    <AppCard title="Recent Activity" icon="activity">
      <div className="tw:text-center tw:py-8 tw:text-slate-500">
        Recent activity will appear here.
      </div>
    </AppCard>
  );
};

export default RecentActivity;
