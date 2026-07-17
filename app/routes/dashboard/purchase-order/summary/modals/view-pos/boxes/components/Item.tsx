import React from "react";
import AppCard from "~/components/core/card/AppCard";
import KeyValue from "~/components/core/key-value/KeyValue";
import DateFormat from "~/components/core/date/DateFormat";
import Amount from "~/components/core/amount/Amount";
import AppLink from "~/components/core/link/AppLink";
import AppButton from "~/components/core/button/AppButton";
import AppPopover from "~/components/core/popover/AppPopover";
import ItemListPopover from "./ItemListPopover";
import { List } from "lucide-react";

type Props = {
  item: any;
};

const Item: React.FC<Props> = ({ item }) => {
  const boxNo = item.boxNo || "-";
  const vendor = "StoreKing";
  const receivedOn = item.receivedOn;
  const receivedItems = item.items?.length ?? 0;
  const receivedValue = item.receivedValue ?? item.totalAmount ?? 0;
  const vendorOrderId = item.orderId || "-";
  const poId = "-";
  const invoiceNo = item.actualInvoiceNo || "-";

  return (
    <AppCard className="tw:mb-2">
      <div className="tw:border-b tw:border-gray-200 tw:pb-2 tw:mb-2 tw:flex tw:justify-between tw:items-center">
        <div className="tw:font-semibold tw:text-base">Box: {boxNo}</div>
      </div>

      <div className="tw:text-sm tw:text-gray-500 tw:mb-2">
        Vendor: <span className="tw:text-blue-600">{vendor}</span>
      </div>

      <KeyValue
        label="Received On"
        labelClassName="tw:w-[35%]"
        horizontal
        className="tw:mb-2"
        size="sm"
      >
        : {receivedOn ? <DateFormat value={receivedOn} /> : "-"}
      </KeyValue>

      <KeyValue
        label="Received Items"
        labelClassName="tw:w-[35%]"
        horizontal
        className="tw:mb-2"
        size="sm"
      >
        :{" "}
        <span className="tw:text-slate-500 tw:font-medium">
          {receivedItems}
        </span>
        {receivedItems > 0 && (
          <AppPopover
            triggerContent={
              <button className="tw:ml-2 tw:cursor-pointer tw:text-xs tw:text-blue-600">
                View
              </button>
            }
          >
            <ItemListPopover items={item.items} />
          </AppPopover>
        )}
      </KeyValue>

      <KeyValue
        label="Received Value"
        labelClassName="tw:w-[35%]"
        horizontal
        className="tw:mb-2"
        size="sm"
      >
        : (
        <Amount
          value={receivedValue ?? 0}
          className="tw:text-green-600 tw:font-bold"
        />
        )
      </KeyValue>

      <KeyValue
        label="Vendor Order ID"
        labelClassName="tw:w-[35%]"
        horizontal
        className="tw:mb-2"
        size="sm"
      >
        : <span className="tw:text-slate-500">{vendorOrderId}</span>
      </KeyValue>

      <KeyValue
        label="PO ID"
        labelClassName="tw:w-[35%]"
        horizontal
        className="tw:mb-2"
        size="sm"
      >
        : <span className="tw:text-slate-500">{poId}</span>
      </KeyValue>

      <KeyValue
        label="Invoice No"
        labelClassName="tw:w-[35%]"
        horizontal
        className="tw:mb-2"
        size="sm"
      >
        : <span className="tw:text-slate-500">{invoiceNo}</span>
      </KeyValue>

      
    </AppCard>
  );
};

export default Item;
