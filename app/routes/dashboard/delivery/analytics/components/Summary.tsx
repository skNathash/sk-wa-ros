import React from "react";
import AppStatsCard from "app/components/core/stats-card/AppStatsCard";

const summaryData = [
  {
    label: "Deliveries Today",
    icon: "truck",
    color: "success",
    value: 42,
  },
  {
    label: "Orders In Transit",
    icon: "package",
    color: "info",
    value: 15,
  },
  {
    label: "Avg. Delivery Time",
    icon: "clock",
    color: "warning",
    value: "1h 23m",
  },
];

const Summary: React.FC = () => {
  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-3 tw:mb-4">
      {summaryData.map((item) => (
        <AppStatsCard
          key={item.label}
          label={item.label}
          icon={item.icon}
          color={item.color as any}
        >
          <span className="tw:text-2xl tw:font-bold">{item.value}</span>
        </AppStatsCard>
      ))}
    </div>
  );
};

export default Summary;
