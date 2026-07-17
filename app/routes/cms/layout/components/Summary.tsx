import AppCard from "~/components/core/card/AppCard";
import { DynamicIcon } from "lucide-react/dynamic";

const summaryData = [
  {
    label: "Live Products",
    icon: "package",
    value: 0, // TODO: Replace with live products count
  },
  {
    label: "Pending Approval",
    icon: "clock",
    value: 0, // TODO: Replace with pending approval count
  },
  {
    label: "Total Brands",
    icon: "tag",
    value: 0, // TODO: Replace with total brands count
  },
  {
    label: "Total Categories",
    icon: "layers",
    value: 0, // TODO: Replace with total categories count
  },
];

const Summary = () => {
  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-4 tw:gap-4">
      {summaryData.map((item, index) => (
        <AppCard key={index} className="tw:py-4">
          <div className="tw:flex tw:justify-between tw:items-start">
            <div>
              <div className="tw:text-sm tw:font-medium tw:mb-2">
                {item.label}
              </div>
              <div className="tw:text-3xl tw:font-bold tw:mb-1">
                {item.value}
              </div>
              {/* description removed */}
            </div>
            <span className="tw:rounded-full tw:bg-gray-100 tw:p-2 tw:flex tw:items-center tw:justify-center tw:ml-2">
              <DynamicIcon
                name={item.icon as any}
                className="tw:text-xl tw:text-gray-500"
              />
            </span>
          </div>
        </AppCard>
      ))}
    </div>
  );
};

export default Summary;
