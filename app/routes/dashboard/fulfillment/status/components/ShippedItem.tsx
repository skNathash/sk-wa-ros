import React from "react";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import Amount from "~/components/core/amount/Amount";

interface ShippedItemProps {
  item: any;
}

const ShippedItem: React.FC<ShippedItemProps> = ({ item }) => {
  return (
    <div className="tw:bg-white tw:rounded-md tw:shadow tw:mb-4 tw:p-4">
      <div className="tw:flex tw:items-center tw:justify-between tw:mb-2">
        <AppLink
          asLink={true}
          href={`/dashboard/orders/view/${item.orderId}`}
          className="tw:text-sm tw:font-semibold"
        >
          {item.orderRefNo}
        </AppLink>
        <AppBadge variant="primary" className="tw:text-xs">
          Shipped
        </AppBadge>
      </div>
      <div className="tw:text-sm tw:text-slate-600 tw:font-medium tw:mb-1">
        {item.customerInfo?.name}
      </div>
      <div className="tw:text-xs tw:text-gray-500 tw:mb-2">
        <DateFormat value={item.orderedDate} />
      </div>

      {/* Shipping Information */}
      {item.shippingDetails && (
        <div className="tw:border-t tw:border-gray-100 tw:pt-2 tw:mt-2">
          <div className="tw:text-xs tw:text-gray-600 tw:mb-1">
            <strong>Tracking:</strong>{" "}
            {item.shippingDetails?.trackingNumber || "N/A"}
          </div>
          <div className="tw:text-xs tw:text-gray-600 tw:mb-1">
            <strong>Carrier:</strong> {item.shippingDetails?.carrier || "N/A"}
          </div>
          <div className="tw:text-xs tw:text-gray-600">
            <strong>Shipped:</strong>{" "}
            <DateFormat value={item.shippingDetails?.shippedDate} />
          </div>
        </div>
      )}

      <div className="tw:flex tw:items-center tw:justify-between tw:mt-2">
        <div className="tw:text-xs tw:text-gray-500">
          Items: {item.itemsCount || 0}
        </div>
        <div className="tw:text-xs tw:font-medium">
          <Amount value={item.orderAmount || 0} />
        </div>
      </div>
    </div>
  );
};

export default ShippedItem;
