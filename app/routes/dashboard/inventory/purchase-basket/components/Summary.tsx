import React from "react";
import AppStatsCard from "~/components/core/stats-card/AppStatsCard";

interface SummaryItem {
  label: string;
  key: string;
  value: string | number;
  icon: string;
  color: "primary" | "secondary" | "warning" | "danger" | "info" | "success";
}

const Summary: React.FC = () => {
  const summaryData: SummaryItem[] = [
    {
      label: "Total Items",
      key: "totalItems",
      value: "1,247",
      icon: "package",
      color: "primary",
    },
    {
      label: "Est. Total Value",
      key: "totalValue",
      value: "$45,230.50",
      icon: "indian-rupee",
      color: "success",
    },
    {
      label: "Urgent Items",
      key: "urgentItems",
      value: "23",
      icon: "alert-triangle",
      color: "danger",
    },
    {
      label: "Vendors",
      key: "vendors",
      value: "12",
      icon: "users",
      color: "info",
    },
  ];

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:lg:grid-cols-4 tw:gap-4 tw:mb-6">
      {summaryData.map((item) => (
        <AppStatsCard
          key={item.key}
          label={item.label}
          icon={item.icon}
          color={item.color}
          template={2}
          className="tw:h-full"
        >
          <div className="tw:text-2xl tw:font-bold tw:text-gray-900">
            {item.value}
          </div>
        </AppStatsCard>
      ))}
    </div>
  );
};

export default Summary;
