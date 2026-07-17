import { User } from "lucide-react";
import React from "react";
import clsx from "clsx";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import Amount from "~/components/core/amount/Amount";

interface GeneralItemProps {
  item: any;
  status?: string;
}

const GeneralItem: React.FC<GeneralItemProps> = ({ item, status }) => {
  const isPicked = status === "picked";
  const isPacked = status === "packed";

  return (
    <div
      className={clsx(
        "tw:bg-white tw:rounded-lg tw:border tw:border-gray-300 tw:p-4 tw:mb-3 tw:transition-shadow tw:duration-200 tw:hover:shadow-md",
        {
          "tw:border-l-4 tw:border-l-orange-500": isPicked,
          "tw:border-l-4 tw:border-l-yellow-500": isPacked,
        }
      )}
    >
      <div className="tw:flex tw:items-center tw:justify-between tw:mb-3">
        <AppLink
          asLink={true}
          href={`/dashboard/orders/view/${item.orderId}`}
          className="tw:text-sm tw:font-bold tw:text-gray-800"
        >
          {item.orderRefNo || `TXN-${item.orderId}`}
        </AppLink>
        <AppBadge
          variant={item.orderType === "B2B" ? "primary" : "secondary"}
          className="tw:text-xs tw:bg-purple-100 tw:text-purple-700 tw:border-purple-200"
        >
          {item.orderType}
        </AppBadge>
      </div>

      <div className="tw:flex tw:items-center tw:mb-2 tw:gap-2">
        <User size={16} className="tw:text-gray-500" />
        <div className="tw:text-sm tw:text-gray-800 tw:font-medium">
          {item.customerInfo?.name}
        </div>
      </div>

      <div className="tw:text-xs tw:text-gray-500 tw:mb-3">
        <DateFormat value={item.orderedDate} />
      </div>

      <div className="tw:flex tw:items-center tw:justify-between tw:mt-2">
        <div className="tw:text-xs tw:text-gray-500">
          {item.itemsCount || 0} items
        </div>
        <div className="tw:text-xs tw:font-medium">
          <Amount value={item.orderAmount || 0} />
        </div>
      </div>

      {isPicked && item.activePicking?.id ? (
        <div className="tw:mt-3">
          <div className="tw:mb-2">
            <div className="tw:text-gray-500 tw:text-xs">Picked by</div>
            <div className="tw:font-medium tw:text-xs">
              {item.activePicking?.pickedBy || "Ramesh"}
            </div>
          </div>
          <div className="tw:mt-3">
            <div className="tw:text-gray-500 tw:text-xs">
              Picking Started At
            </div>
            <div className="tw:font-medium tw:text-xs">
              <DateFormat value={item.activePicking?.startedOn} />
            </div>
          </div>
          <div className="tw:mt-3">
            <div className="tw:text-gray-500 tw:text-xs">Picking Closed At</div>
            <div className="tw:font-medium tw:text-xs">
              <DateFormat value={item.activePicking?.endedOn} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default GeneralItem;
