import clsx from "clsx";
import AppCard from "~/components/core/card/AppCard";

export default function Performance({ data }: { data: any }) {
  const summary = [
    {
      label: "On-Time Delivery",
      value: data?.onTimeDelivery || 0,
      color: "tw:text-blue-600",
      bgColor: "tw:bg-blue-50",
    },
    {
      label: "Damage Rate",
      value: data?.damageRate || 0,
      color: "tw:text-green-600",
      bgColor: "tw:bg-green-50",
    },
    {
      label: "Return Rate",
      value: data?.returnRate || 0,
      color: "tw:text-purple-600",
      bgColor: "tw:bg-purple-50",
    },
    {
      label: "Orders/Month",
      value: "0.0",
      color: "tw:text-orange-600",
      bgColor: "tw:bg-orange-50",
    },
  ];

  return (
    <AppCard title="Performance Overview" icon="trending">
      <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:gap-6">
        {summary.map((item) => (
          <div
            key={item.label}
            className={clsx(
              "tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-4 tw:rounded-xl",
              item.bgColor
            )}
          >
            <span className={clsx("tw:text-xl tw:font-semibold", item.color)}>
              {item.value}
            </span>
            <span className={clsx("tw:mt-1 tw:text-sm", item.color)}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </AppCard>
  );
}
