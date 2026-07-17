import React, { useMemo } from "react";
import AppCard from "~/components/core/card/AppCard";
import Amount from "~/components/core/amount/Amount";
import { DynamicIcon } from "lucide-react/dynamic";

interface VendorSummaryProps {
  data: {
    totalRevenue?: number;
    totalOrders?: number;
    pendingOrders?: number;
    products?: number;
    activeReturn?: number;
    unpaid?: number;
    // ...other fields
  };
}

const summaryConfig = [
  {
    label: "Total Spent",
    key: "totalRevenue",
    iconColor: "#16a34a", // green
    icon: "indian-rupee",
    isAmount: true,
  },
  {
    label: "Total Orders",
    key: "totalOrders",
    iconColor: "#2563eb", // blue
    icon: "package",
    isAmount: false,
  },
  {
    label: "Pending Orders",
    key: "pendingOrders",
    iconColor: "#f59e1a", // amber
    icon: "clock",
    isAmount: false,
  },
  {
    label: "Products",
    key: "products",
    iconColor: "#16a34a", // green
    icon: "check-circle",
    isAmount: false,
  },
  {
    label: "Active Returns",
    key: "activeReturn",
    iconColor: "#ef4444", // red
    icon: "alert-triangle",
    isAmount: false,
  },
  {
    label: "Unpaid",
    key: "unpaid",
    iconColor: "#ef4444", // red
    icon: "indian-rupee",
    isAmount: true,
  },
];

const VendorSummary: React.FC<VendorSummaryProps> = ({ data }) => {
  const summaries = useMemo(
    () =>
      summaryConfig.map((item) => ({
        ...item,
        value: data?.[item.key as keyof typeof data] ?? 0,
      })),
    [data]
  );

  return (
    <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-6 tw:gap-4">
      {summaries.map((item, idx) => (
        <AppCard
          key={item.key}
          className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:h-full tw:p-2"
        >
          <div className="tw:flex tw:flex-col tw:items-center tw:gap-2">
            <span className="tw:flex tw:items-center tw:justify-center tw:rounded-lg">
              <DynamicIcon
                name={item.icon as any}
                className="tw:text-2xl"
                style={{ color: item.iconColor }}
              />
            </span>
            <span className="tw:text-xl tw:font-bold tw:mt-1">
              {item.isAmount ? <Amount value={item.value} /> : item.value}
            </span>
            <span className="tw:text-xs tw:text-gray-500 tw:text-center">
              {item.label}
            </span>
          </div>
        </AppCard>
      ))}
    </div>
  );
};

export default VendorSummary;
