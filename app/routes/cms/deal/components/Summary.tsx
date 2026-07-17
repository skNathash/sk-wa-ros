import React from "react";
import AppStatsCard from "~/components/core/stats-card/AppStatsCard";

interface SummaryProps {
  data: Array<{
    label: string;
    value: number;
    icon: string;
    color: string;
  }>;
}

const Summary: React.FC<SummaryProps> = ({ data }) => {
  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-4 tw:gap-4 tw:mb-4">
      {data.map((item) => (
        <AppStatsCard
          key={item.label}
          label={item.label}
          icon={item.icon}
          color={
            item.color as
              | "primary"
              | "success"
              | "info"
              | "warning"
              | "secondary"
              | "danger"
          }
        >
          <span className="tw:text-2xl tw:font-bold">
            {item.value.toLocaleString()}
          </span>
        </AppStatsCard>
      ))}
    </div>
  );
};

export default Summary;
