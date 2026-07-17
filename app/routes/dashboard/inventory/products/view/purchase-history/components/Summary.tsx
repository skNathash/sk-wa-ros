import React from "react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import AppStatsCard from "app/components/core/stats-card/AppStatsCard";

interface SummaryProps {
  totalUnits: number;
  totalRevenue: number;
  avgSalesPrice: number;
}

const Summary: React.FC<SummaryProps> = ({
  totalUnits,
  totalRevenue,
  avgSalesPrice,
}) => {
  const { t } = useTranslation(['common']);

  const summaryData = [
    {
      label: t('totalUnitsUsed'),
      value: totalUnits,
      icon: "package",
      key: "units",
      color: "primary" as const,
      bgColor: "bg-blue-50",
    },
    {
      label: t('totalRevenue'),
      value: totalRevenue,
      icon: "indian-rupee",
      key: "revenue",
      color: "success" as const,
      bgColor: "bg-green-50",
    },
    {
      label: t('avgSalesPrice'),
      value: avgSalesPrice,
      icon: "trending-up",
      key: "avgPrice",
      color: "warning" as const,
      bgColor: "bg-yellow-50",
    },
  ];

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-2 tw:mb-4">
      {summaryData.map((item) => (
        <AppStatsCard
          key={item.key}
          label={item.label}
          icon={item.icon}
          template={2}
          bg={false}
          color={item.color}
        >
          <span
            className={clsx(
              "tw:text-lg tw:font-bold",
              item.color === "primary" && "tw:text-blue-600",
              item.color === "success" && "tw:text-green-600",
              item.color === "warning" && "tw:text-yellow-600"
            )}
          >
            {item.value}
          </span>
        </AppStatsCard>
      ))}
    </div>
  );
};

export default Summary;
