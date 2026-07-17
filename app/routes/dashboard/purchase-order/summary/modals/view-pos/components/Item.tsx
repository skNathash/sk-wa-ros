import React from "react";
import AppCard from "~/components/core/card/AppCard";
import AppBadge from "~/components/core/badge/AppBadge";
import KeyValue from "~/components/core/key-value/KeyValue";
import DateFormat from "~/components/core/date/DateFormat";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppLink from "~/components/core/link/AppLink";
import { List } from "lucide-react";

type Props = {
  item: any;
  groupByType?: string;
};

const Item: React.FC<Props> = ({ item, groupByType }) => {
  return (
    <AppCard className="tw:mb-2">
      <div className="tw:border-b tw:border-gray-200 tw:pb-2 tw:mb-2 tw:flex tw:justify-between tw:items-center">
        <div className="tw:font-semibold tw:text-base">ID: {item.orderId}</div>
        <AppBadge variant={(item._statusColor as any) || "default"}>
          {item._statusLabel || item.status}
        </AppBadge>
      </div>

      <div className="tw:text-sm tw:text-gray-500 tw:mb-2">
        Vendor:{" "}
        <span className="tw:text-blue-600">{item.vendorInfo?.name}</span>
      </div>

      <KeyValue
        label="Ordered On"
        labelClassName="tw:w-[35%]"
        horizontal
        className="tw:mb-2"
        size="sm"
      >
        : <DateFormat value={item.createdAt} />
      </KeyValue>

      <KeyValue
        label="Ordered Items"
        labelClassName="tw:w-[35%]"
        horizontal
        className="tw:mb-2"
        size="sm"
      >
        : 10 products,
        <span className="tw:text-slate-500 tw:text-xs">5 units</span>
      </KeyValue>

      {groupByType === "received" && (
        <>
          <KeyValue
            label="Received Date"
            labelClassName="tw:w-[35%]"
            horizontal
            className="tw:mb-2"
            size="sm"
          >
            : <DateFormat value={item.receivedDate} />
          </KeyValue>

          <KeyValue
            label="Received Boxes"
            labelClassName="tw:w-[35%]"
            horizontal
            className="tw:mb-2"
            size="sm"
          >
            : <span className="tw:text-slate-500 tw:font-medium">0</span>
          </KeyValue>

          <KeyValue
            label="Received Items"
            labelClassName="tw:w-[35%]"
            horizontal
            className="tw:mb-2"
            size="sm"
          >
            : <span className="tw:text-slate-500 tw:font-medium">0</span>
          </KeyValue>

          <KeyValue
            label="Received Value"
            labelClassName="tw:w-[35%]"
            horizontal
            className="tw:mb-2"
            size="sm"
          >
            :{" "}
            <Amount
              value={item.totalAmount ?? 0}
              className="tw:text-green-600 tw:font-bold"
            />
          </KeyValue>
        </>
      )}

      <AppLink asLink href={`/dashboard/purchase-order/view/${item.poId}`}>
        <AppButton color="primary" size="small" className="tw:w-full">
          <List className="tw:w-4 tw:h-4" />
          View Details
        </AppButton>
      </AppLink>
    </AppCard>
  );
};

export default Item;
