import {
  ShoppingBasket,
  DollarSign,
  TrendingUp,
  Clock,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import AppCard from "~/components/core/card/AppCard";

const Performance = () => {
  const metrics = [
    {
      label: "Total Orders",
      value: "10",
      icon: "shopping-basket",
      color: "tw:text-blue-600",
      bgColor: "tw:bg-blue-50",
    },
    {
      label: "Total Spent",
      value: "2,450",
      icon: "indian-rupee",
      color: "tw:text-green-600",
      bgColor: "tw:bg-green-50",
    },
    {
      label: "Avg Order Value",
      value: "245",
      icon: "trending-up",
      color: "tw:text-purple-600",
      bgColor: "tw:bg-purple-50",
    },
    {
      label: "Active Orders",
      value: "3",
      icon: "clock",
      color: "tw:text-orange-600",
      bgColor: "tw:bg-orange-50",
    },
    {
      label: "Last GRN Date",
      value: "Dec 15, 2024",
      icon: "calendar",
      color: "tw:text-indigo-600",
      bgColor: "tw:bg-indigo-50",
    },
    {
      label: "Paid Orders",
      value: "8",
      icon: "check-circle",
      color: "tw:text-emerald-600",
      bgColor: "tw:bg-emerald-50",
    },
  ];

  return (
    <AppCard title="Vendor Statistics">
      <div className="tw:text-sm">
        {metrics.map((metric, index) => {
          return (
            <div
              key={index}
              className="tw:flex tw:justify-between tw:gap-2 tw:mb-1"
            >
              <div className="tw:flex tw:gap-2 tw:items-center">
                <div className={`tw:p-2 tw:rounded-lg`}>
                  <DynamicIcon
                    name={metric.icon as any}
                    className={`${metric.color}`}
                    size={16}
                  />
                </div>
                <span className="tw:text-sm tw:text-gray-600">
                  {metric.label}
                </span>
              </div>
              <div className="tw:font-semibold tw:text-gray-900">
                {metric.value}
              </div>
            </div>
          );
        })}
      </div>
    </AppCard>
  );
};

export default Performance;
