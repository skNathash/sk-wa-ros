import AppCard from "~/components/core/card/AppCard";
import { DynamicIcon } from "lucide-react/dynamic";
import clsx from "clsx";

const data = [
  {
    label: "New Customers",
    value: 36,
    icon: "user-plus",
    color: "primary",
    description: "This month",
  },
  {
    label: "Repeat Customers",
    value: 36,
    icon: "user-plus",
    color: "warning",
    description: "This month",
  },
  {
    label: "Peak Day",
    value: "Sunday",
    icon: "calendar",
    color: "info",
    description: "Most active day",
  },
  {
    label: "Growth Rate",
    value: "12%",
    icon: "trending-up",
    color: "success",
    description: "Compared to last month",
  },
];

const colorClasses = {
  primary: {
    bg: "tw:bg-blue-50",
    text: "tw:text-blue-600",
  },
  warning: {
    bg: "tw:bg-orange-50",
    text: "tw:text-orange-600",
  },
  info: {
    bg: "tw:bg-cyan-50",
    text: "tw:text-cyan-600",
  },
  success: {
    bg: "tw:bg-green-50",
    text: "tw:text-green-600",
  },
};

const Insight = () => {
  return (
    <AppCard title="Customer Insights">
      {data.map((item) => {
        const colorClass =
          colorClasses[item.color as keyof typeof colorClasses];
        return (
          <div
            key={item.label}
            className="tw:flex tw:items-center tw:gap-3 tw:p-3"
          >
            {/* First column: Icon with light background */}
            <div className={clsx("tw:p-2 tw:rounded-lg", colorClass.bg)}>
              <DynamicIcon
                name={item.icon as any}
                className={clsx("tw:w-5 tw:h-5", colorClass.text)}
              />
            </div>

            {/* Second column: Title and description */}
            <div className="tw:flex-1 tw:flex tw:flex-col">
              <span className="tw:text-sm tw:font-medium tw:text-gray-900">
                {item.label}
              </span>
              <span className="tw:text-xs tw:text-gray-500">
                {item.description}
              </span>
            </div>

            {/* Third column: Value */}
            <div className="tw:text-lg tw:font-semibold tw:text-gray-900">
              {item.value}
            </div>
          </div>
        );
      })}
    </AppCard>
  );
};

export default Insight;
