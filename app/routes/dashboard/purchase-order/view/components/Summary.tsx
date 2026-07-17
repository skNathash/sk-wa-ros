import { Building2, Calendar, DollarSign, Package } from "lucide-react";
import AppLink from "~/components/core/link/AppLink";
import DateFormat from "~/components/core/date/DateFormat";
import Amount from "~/components/core/amount/Amount";

interface SummaryData {
  vendor: string;
  vendorId?: string;
  orderDate: string | Date;
  totalValue: number;
  items: number;
}

interface SummaryProps {
  data?: SummaryData;
}

const Summary = ({ data }: SummaryProps) => {
  // If no data provided, don't render anything
  if (!data || Object.keys(data).length === 0) {
    return null;
  }

  const summaryData = data;

  const summaryItems = [
    {
      icon: Building2,
      label: "Vendor",
      value: summaryData.vendor,
      vendorId: summaryData.vendorId,
      iconColor: "text-blue-600",
      isLink: true,
      type: "text" as const,
    },
    {
      icon: Calendar,
      label: "Order Date",
      value: summaryData.orderDate,
      iconColor: "text-green-600",
      isLink: false,
      type: "date" as const,
    },
    {
      icon: DollarSign,
      label: "Total Value",
      value: summaryData.totalValue,
      iconColor: "text-green-600",
      isLink: false,
      type: "amount" as const,
    },
    {
      icon: Package,
      label: "Items",
      value: summaryData.items,
      iconColor: "text-purple-600",
      isLink: false,
      type: "text" as const,
    },
  ];

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:lg:grid-cols-4 tw:gap-4">
      {summaryItems.map((item, index) => {
        const IconComponent = item.icon;
        return (
          <div
            key={index}
            className="tw:bg-white tw:rounded-lg tw:shadow-sm tw:p-4 tw:border tw:border-gray-100"
          >
            <div className="tw:flex tw:flex-col tw:space-y-2">
              <div className="tw:flex tw:items-center tw:space-x-2">
                <IconComponent className={`w-5 h-5 ${item.iconColor}`} />
                <span className="tw:text-sm tw:text-gray-500 tw:font-medium">
                  {item.label}
                </span>
              </div>
              <div className="tw:text-lg tw:font-semibold tw:text-gray-900">
                {item.isLink && item.vendorId ? (
                  <AppLink
                    asLink
                    href={`/dashboard/vendor/view/${item.vendorId}`}
                    className="tw:text-blue-600 hover:tw:text-blue-800"
                  >
                    {item.value}
                  </AppLink>
                ) : item.type === "date" ? (
                  <DateFormat value={item.value as string | Date} />
                ) : item.type === "amount" ? (
                  <Amount value={item.value as number} decimalPlaces={2} />
                ) : (
                  item.value
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Summary;
