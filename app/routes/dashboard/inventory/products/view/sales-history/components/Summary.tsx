import React from "react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import AppStatsCard from "app/components/core/stats-card/AppStatsCard";
import Amount from "~/components/core/amount/Amount";

interface SummaryProps {
  totalUnits: number;
  totalRevenue: number;
  totalOrders: number;
}

const Summary: React.FC<SummaryProps> = ({
  totalUnits,
  totalRevenue,
  totalOrders,
}) => {
  const { t } = useTranslation(["common"]);

  const summaryData = [
    {
      label: t("totalOrders"),
      value: totalOrders || 0,
      icon: "trending-up",
      key: "totalOrders",
      color: "warning" as const,
      bgColor: "bg-yellow-50",
      isAmount: false,
    },
    {
      label: t("totalUnitsUsed"),
      value: totalUnits,
      icon: "package",
      key: "units",
      color: "primary" as const,
      bgColor: "bg-blue-50",
      isAmount: false,
    },
    {
      label: t("totalRevenue"),
      value: totalRevenue,
      icon: "indian-rupee",
      key: "revenue",
      color: "success" as const,
      bgColor: "bg-green-50",
      isAmount: true,
    },
  ];

  const items = summaryData;
  return (
    <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-3 tw:gap-2 tw:mb-4">
      {items.map((item, index) => (
        <div
          key={item.key}
          className={
            index === items.length - 1 ? "tw:col-span-2 tw:md:col-span-1" : ""
          }
        >
          <AppStatsCard
            label={item.label}
            // icon={item.icon}
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
              {item.isAmount ? <Amount value={item.value} /> : item.value}
            </span>
          </AppStatsCard>
        </div>
      ))}
    </div>
  );
};

export default Summary;
