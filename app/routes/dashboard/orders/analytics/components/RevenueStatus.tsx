import clsx from "clsx";
import AppCard from "~/components/core/card/AppCard";
import Amount from "~/components/core/amount/Amount";
import Divider from "~/components/core/divider/Divider";

const revenueData = [
  {
    label: "Delivered Revenue",
    value: 3527.944,
    color: "tw:text-green-600",
  },
  {
    label: "In Transit",
    value: 1142.87,
    color: "tw:text-blue-600",
  },
  {
    label: "Processing",
    value: 2542.166,
    color: "tw:text-orange-500",
  },
];

const RevenueStatus = () => {
  return (
    <AppCard
      title="Revenue Status"
      icon="dollar-sign"
      iconClassName="tw:text-green-600"
    >
      <div className="tw:space-y-4 tw:mb-4">
        {revenueData.map((item) => (
          <div
            className="tw:flex tw:justify-between tw:items-center"
            key={item.label}
          >
            <div className="tw:text-gray-600 tw:text-sm">{item.label}</div>
            <Amount
              value={item.value}
              decimalPlaces={item.value % 1 === 0 ? 0 : 3}
              className={clsx("tw:font-semibold tw:text-sm", item.color)}
            />
          </div>
        ))}
      </div>
      <Divider className="tw:!my-2" />
      <div className="tw:flex tw:justify-between tw:items-center">
        <div className="tw:text-base tw:font-semibold tw:text-gray-800">
          Total Revenue
        </div>
        <Amount
          value={7212.98}
          decimalPlaces={2}
          className="tw:text-xl tw:font-semibold tw:text-gray-900"
        />
      </div>
    </AppCard>
  );
};

export default RevenueStatus;
