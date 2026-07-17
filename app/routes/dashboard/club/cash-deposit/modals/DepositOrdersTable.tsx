import React from "react";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import KeyValue from "app/components/core/key-value/KeyValue";
import type { TableHeaderItem } from "~/types/CommonTypes";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "app/components/core/link/AppLink";

interface DepositOrdersTableProps {
  orders: any[];
  hasMore: boolean;
  onLoadMore: () => void | Promise<void>;
  loadingMore?: boolean;
  loading: boolean;
}

const headers: TableHeaderItem[] = [
  { label: "Sl No", key: "slNo", width: "60px", isCentered: true },
  { label: "Ref No", key: "_id", width: "120px" },
  { label: "Order ID", key: "orderId", width: "120px" },
  { label: "Ordered On", key: "orderDate", width: "140px" },
  { label: "Amount", key: "totalAmount", width: "100px", isCentered: true },
  { label: "Payment Mode", key: "paymentMode", width: "120px" },
];

const DepositOrdersTable: React.FC<
  DepositOrdersTableProps & { onOrderClick?: (order: any) => void }
> = ({ orders, hasMore, onLoadMore, loading, onOrderClick }) => {
  return (
    <>
      {orders.length === 0 && !loading ? (
        <AppCard className="tw:w-full">
          <div className="tw:text-center tw:p-4">No orders found</div>
        </AppCard>
      ) : (
        <div className="tw:grid tw:gap-4">
          {orders.map((order, idx) => (
            <AppCard className="tw:w-full" key={order._id || idx}>
              <div className="tw:grid tw:grid-cols-2 tw:gap-4 tw:pb-4">
                <KeyValue label="Ref No">{order._id}</KeyValue>
                <KeyValue label="Order ID">
                  <AppLink onClick={() => onOrderClick && onOrderClick(order)}>
                    {order.orderId}
                  </AppLink>
                </KeyValue>
                <KeyValue label="Ordered On">
                  <DateFormat value={order.orderDate} />
                </KeyValue>
                <KeyValue label="Amount">{order.totalAmount}</KeyValue>
                <KeyValue label="Payment Mode">{order.paymentMode}</KeyValue>
              </div>
            </AppCard>
          ))}
        </div>
      )}
      {hasMore && !loading && (
        <div className="tw-flex tw:justify-center tw:mt-6">
          <AppButton
            fill="outline"
            color="light"
            size="small"
            onClick={onLoadMore}
          >
            Load more
          </AppButton>
        </div>
      )}
    </>
  );
};

export default DepositOrdersTable;
