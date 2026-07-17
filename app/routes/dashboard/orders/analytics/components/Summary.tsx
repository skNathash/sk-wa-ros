import clsx from "clsx";
import { DynamicIcon } from "lucide-react/dynamic";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import Divider from "~/components/core/divider/Divider";
import { useEffect, useState } from "react";
import OmsService from "~/services/OmsService";
import { startOfDay } from "date-fns";
import { endOfDay } from "date-fns";

const defaultSummaryData = [
  {
    label: "Orders in Processing",
    icon: "clock",
    revenue: 1000,
    avgOrderValue: 100,
    description: "Orders placed but not yet shipped (including partial orders)",
    color: "orange",
    key: "processing",
  },
  {
    label: "Orders Shipped",
    icon: "truck",
    revenue: 1000,
    avgOrderValue: 100,
    description: "Orders shipped and in transit (including partial shipments)",
    color: "blue",
    key: "shipped",
  },
  {
    label: "Orders Delivered",
    icon: "house",
    revenue: 1000,
    avgOrderValue: 100,
    description: "Successfully completed orders (including partial deliveries)",
    color: "green",
    key: "delivered",
  },
  {
    label: "Problem Orders",
    icon: "circle-alert",
    revenue: 1000,
    avgOrderValue: 100,
    description: "Cancelled, refunded or partially cancelled orders",
    color: "red",
    key: "problem",
  },
];

const getCount = async (from: string, to: string, type: string) => {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const params: Record<string, any> = {
    filter: {
      createdAt: {
        $gte: startOfDay(fromDate),
        $lte: endOfDay(toDate),
      },
    },
  };

  let statues: string[] = [];
  if (type === "processing") {
    statues =
      OmsService.getOmsOrderStatus().find(
        (status) => status.value === "processing"
      )?.statuses || [];
  } else if (type === "shipped") {
    statues =
      OmsService.getOmsOrderStatus().find(
        (status) => status.value === "shipped"
      )?.statuses || [];
  } else if (type === "delivered") {
    statues =
      OmsService.getOmsOrderStatus().find(
        (status) => status.value === "delivered"
      )?.statuses || [];
  } else if (type === "problem") {
    const s1 =
      OmsService.getOmsOrderStatus().find(
        (status) => status.value === "partiallyDelivered"
      )?.statuses || [];
    const s2 =
      OmsService.getOmsOrderStatus().find(
        (status) => status.value === "cancelled"
      )?.statuses || [];
    const s3 =
      OmsService.getOmsOrderStatus().find(
        (status) => status.value === "returned"
      )?.statuses || [];
    statues = [...(s1 || []), ...(s2 || []), ...(s3 || [])];
  }

  if (statues.length > 0) {
    params.filter.status = {
      $in: statues,
    };
  }

  const count = await OmsService.getOrderCount(params);
  return count.data || 0;
};

const Summary = ({ from, to }: { from: string; to: string }) => {
  const [summaryData, setSummaryData] = useState<any[]>([
    ...defaultSummaryData,
  ]);

  useEffect(() => {
    const fetchData = async () => {
      // const promises = [
      //   getCount(from, to, "processing"),
      //   getCount(from, to, "shipped"),
      //   getCount(from, to, "delivered"),
      //   getCount(from, to, "problem"),
      // ];
      // const results = await Promise.all(promises);
      // setSummaryData((prev) =>
      //   prev.map((item, index) => ({
      //     ...item,
      //     count: results[index],
      //   }))
      // );
    };

    if (from && to) {
      fetchData();
    }
  }, [from, to]);

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-4 tw:gap-4">
        {summaryData.map((item) => (
          <AppCard key={item.label}>
            <div className="tw:flex tw:justify-between tw:items-center tw:mb-4">
              <span
                className={clsx(
                  "tw:p-2 tw:rounded-lg",
                  item.key === "processing" &&
                    "tw:bg-orange-50 tw:text-orange-500",
                  item.key === "shipped" && "tw:bg-blue-50 tw:text-blue-500",
                  item.key === "delivered" &&
                    "tw:bg-green-50 tw:text-green-500",
                  item.key === "problem" && "tw:bg-red-50 tw:text-red-500"
                )}
              >
                <DynamicIcon name={item.icon as any} />
              </span>
              <span className="tw:border tw:border-gray-200 tw:rounded-lg tw:px-2 tw:py-1 tw:text-xs">
                3.2%
              </span>
            </div>

            <div className="tw:text-sm tw:font-medium tw:text-gray-700 tw:mb-1">
              {item.label}
            </div>

            <div className="tw:mb-2">
              <span className="tw:text-2xl tw:text-gray-950 tw:font-medium tw:ml-1">
                {item.count}
              </span>
              <span className="tw:text-sm tw:ml-1 tw:text-gray-500">
                Orders
              </span>
            </div>

            <div className="tw:flex tw:justify-between tw:text-sm tw:text-gray-500 tw:mb-1">
              <span>Revenue</span>
              <Amount
                value={item.revenue}
                className="tw:text-gray-950 tw:font-medium"
              />
            </div>

            <div className="tw:flex tw:justify-between tw:text-xs tw:text-gray-500">
              <span>Avg. Order Value</span>
              <Amount value={item.avgOrderValue} className="tw:text-gray-900" />
            </div>

            <Divider className="tw:!my-2" />

            <div className="tw:text-xs tw:text-gray-500">
              {item.description}
            </div>

            {/* <Divider className="tw:!my-2" /> */}
          </AppCard>
        ))}
      </div>
    </>
  );
};

export default Summary;
