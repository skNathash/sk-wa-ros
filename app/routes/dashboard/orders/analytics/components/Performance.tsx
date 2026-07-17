import AppCard from "~/components/core/card/AppCard";

const data = [
  {
    label: "Fulfillment Rate",
    description: "Orders delivered",
    value: 69.6,
    valueColor: "tw:text-green-600",
  },
  {
    label: "Problem Rate",
    description: "Cancelled/Refunded",
    value: 1.1,
    valueColor: "tw:text-red-600",
  },
  {
    label: "In Progress",
    description: "Being processed",
    value: 26.1,
    valueColor: "tw:text-orange-500",
  },
];

const Performance = () => {
  return (
    <AppCard
      title="Performance"
      icon="trending-up"
      iconClassName="tw:text-purple-500"
    >
      <div className="tw:space-y-2">
        {data.map((item) => (
          <div
            key={item.label}
            className="tw:flex tw:justify-between tw:items-center"
          >
            <div className="tw:flex tw:flex-col tw:items-end tw:text-right">
              <div className="tw:text-sm tw:text-gray-600">{item.label}</div>
            </div>
            <div className="tw:text-right">
              <div className={`tw:text-lg tw:font-bold ${item.valueColor}`}>
                {item.value}%
              </div>
              <div className="tw:text-xs tw:text-gray-400 tw:mt-0.5">
                {item.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppCard>
  );
};

export default Performance;
