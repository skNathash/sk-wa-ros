import React from "react";
import { DynamicIcon } from "lucide-react/dynamic";
import DateFormat from "~/components/core/date/DateFormat";

type Props = {
  item: any;
};

const Item = ({ item }: Props) => {
  // Extract display fields with fallbacks
  const title = item.reason || "--";
  const date = item.createdAt || "";
  const points = item.amount || 0;
  const balance = item.closingBalance || 0;
  const isCredit = item.type === "earn";

  return (
    <div className="tw:flex tw:items-center tw:py-3 tw:border-b tw:border-gray-100">
      <div className="tw:w-12 tw:flex-shrink-0 tw:text-center">
        <div className="tw:bg-gray-50 tw:p-2 tw:rounded-full tw:inline-block">
          <DynamicIcon name={(item._icon || "star") as any} size={18} />
        </div>
      </div>

      <div className="tw:flex-1 tw:pl-4 tw:pr-4">
        <div className="tw:flex tw:justify-between tw:items-start">
          <div>
            <div className="tw:font-semibold tw:text-sm">{title}</div>
            <div className="tw:text-xs tw:text-gray-500">
              <DateFormat value={date} />
            </div>
          </div>
        </div>
      </div>

      <div className="tw:w-40 tw:text-right tw:pl-4 tw:flex-shrink-0">
        <div
          className={`tw:font-semibold ${
            isCredit ? "tw:text-green-600" : "tw:text-red-600"
          }`}
        >
          {isCredit ? `+${points}` : `-${points}`}
        </div>
        <div className="tw:text-xs tw:text-gray-500">Bal: {balance}</div>
      </div>
    </div>
  );
};

export default Item;
