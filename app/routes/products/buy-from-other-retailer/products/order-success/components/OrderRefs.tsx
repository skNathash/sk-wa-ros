import AppLink from "~/components/core/link/AppLink";
import type { Order } from "../helper";

interface Props {
  orders: Order[];
}

const OrderRefs = ({ orders }: Props) => {
  if (orders.length === 0) return null;
  return (
    <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-x-3 tw:gap-y-1 tw:mt-2 tw:text-xs tw:text-gray-500">
      <span>Order {orders.length > 1 ? "Nos" : "No"}:</span>
      {orders.map((o) => (
        <AppLink
          key={o.orderId}
          href={`/dashboard/orders/view/${o.orderId}`}
          asLink
          className="tw:text-primary tw:font-medium"
        >
          #{o.orderRefNo || o.orderId}
        </AppLink>
      ))}
    </div>
  );
};

export default OrderRefs;
