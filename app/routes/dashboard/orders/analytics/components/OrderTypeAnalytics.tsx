import clsx from "clsx";
import AppCard from "~/components/core/card/AppCard";

const OrderTypeAnalytics = () => {
  const data = [
    {
      title: "B2C Orders",
      count: 75,
      percentage: 82.4,
      bgColor: "tw:bg-purple-50",
      dotColor: "tw:bg-purple-500",
    },
    {
      title: "B2B Orders",
      count: 16,
      percentage: 17.6,
      bgColor: "tw:bg-blue-50",
      dotColor: "tw:bg-blue-500",
    },
  ];

  return (
    <AppCard
      title="Order Types"
      icon="package"
      iconClassName="tw:text-purple-500"
    >
      {data.map((item) => (
        <div
          className={clsx(
            "tw:flex tw:justify-between tw:mb-2 tw:py-2 tw:px-4 tw:rounded-lg",
            item.bgColor
          )}
        >
          <div className="tw:flex tw:items-center">
            <div
              className={`tw:w-3 tw:h-3 tw:rounded-full tw:mr-2 ${item.dotColor}`}
            ></div>
            <div className="tw:text-sm tw:font-medium">{item.title}</div>
          </div>
          <div className="tw:text-end">
            <div className="tw:text-sm tw:font-semibold">{item.count}</div>
            <div className="tw:text-xs tw:text-gray-500">
              {item.percentage}%
            </div>
          </div>
        </div>
      ))}
    </AppCard>
  );
};

export default OrderTypeAnalytics;
