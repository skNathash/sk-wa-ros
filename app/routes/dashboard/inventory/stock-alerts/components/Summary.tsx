import React from "react";
import AppStatsCard from "~/components/core/stats-card/AppStatsCard";

const summaryData = [
  {
    label: "Critical Errors",
    value: 15,
    key: "critical_errors",
    color: "danger",
    icon: "alert-circle",
  },
  {
    label: "Low Stock Items",
    value: 45,
    key: "low_stock",
    color: "warning",
    icon: "package-minus",
  },
  {
    label: "Slow Moving",
    value: 80,
    key: "slow_moving",
    color: "warning",
    icon: "turtle",
  },
  {
    label: "At Risk Value",
    value: 120,
    key: "at_risk",
    color: "danger",
    icon: "trending-down",
  },
];

const StockAlertSummary: React.FC = () => {
  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-4 tw:gap-4 tw:mb-4">
      {summaryData.map((item, index) => (
        <AppStatsCard
          key={index}
          label={item.label}
          icon={item.icon}
          color={item.color as any}
          template={2}
        >
          <div className="tw:text-2xl tw:font-bold">{item.value}</div>
        </AppStatsCard>
      ))}
    </div>
  );
};

export default StockAlertSummary;
