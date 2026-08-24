import { Calendar, Eye, Tag } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import Divider from "~/components/core/divider/Divider";
import NoData from "~/components/core/no-data/NoData";

interface MobileViewProps {
  data: any[];
  loading: boolean;
  callback?: (args: { action: string; data: any }) => void;
}

const MobileView = ({ data, loading, callback }: MobileViewProps) => {
  if (loading) {
    return (
      <div className="tw:space-y-4">
        {[...Array(4)].map((_, idx) => (
          <div
            key={idx}
            className="tw:animate-pulse tw:border tw:rounded-lg tw:p-4"
          >
            <div className="tw:mb-4 tw:flex tw:justify-between tw:gap-4">
              <div className="tw:h-5 tw:w-20 tw:rounded tw:bg-gray-200" />
              <div className="tw:h-5 tw:w-16 tw:rounded-full tw:bg-gray-200" />
            </div>
            <div className="tw:mb-4 tw:h-6 tw:w-32 tw:rounded tw:bg-gray-200" />
            <div className="tw:mb-4 tw:h-6 tw:w-24 tw:rounded tw:bg-gray-200" />
            <div className="tw:mb-2 tw:h-4 tw:w-40 tw:rounded tw:bg-gray-200" />
            <div className="tw:h-4 tw:w-24 tw:rounded tw:bg-gray-200" />
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <NoData />;
  }

  return (
    <>
      {data.map((item) => (
        <div
          key={item.orderId}
          className="tw:border tw:rounded-lg tw:p-4 tw:mb-4"
        >
          <div className="tw:flex tw:justify-between tw:gap-4 tw:mb-4">
            <span className="tw-border tw:rounded-lg tw:px-2 tw:py-1 tw:text-xs tw:font-medium">
              {item.orderType}
            </span>
            <AppBadge variant={item._statusColor || "default"}>
              {item.status}
            </AppBadge>
          </div>

          <div className="tw:mb-4">
            <span className="tw:bg-gray-100 tw:rounded-lg tw:p-2 tw:text-sm">
              <code>{item.orderRefNo}</code>
            </span>
          </div>

          <Amount
            value={item.orderAmount}
            decimalPlaces={2}
            className="tw:text-lg tw:font-semibold"
          />

          <Divider />

          <div className="tw:flex tw:gap-4 tw:items-center tw:mb-2">
            <Calendar className="tw:text-slate-400" />
            <span className="tw:text-sm">
              <DateFormat value={item.orderedDate} />
            </span>
          </div>

          <div className="tw:flex tw:gap-4 tw:items-center tw:mb-2">
            <Tag className="tw:text-slate-400" />
            <span className="tw:text-sm">{item.itemsCount} items</span>
          </div>

          <Divider />

          <div className="tw:flex tw:justify-center">
            <AppButton
              color="light"
              fill="outline"
              size="small"
              className="tw:w-full"
              onClick={() =>
                callback && callback({ action: "view-order", data: item })
              }
            >
              <Eye />
              View
            </AppButton>
          </div>
        </div>
      ))}
    </>
  );
};

export default MobileView;
