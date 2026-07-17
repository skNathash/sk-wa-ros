import AppCard from "~/components/core/card/AppCard";
import type { SellerGroup } from "../helper";
import CouponBlock from "./CouponBlock";
import ItemsSection from "./ItemsSection";
import OrderRefs from "./OrderRefs";
import PaymentSummary from "./PaymentSummary";
import SellerHeader from "./SellerHeader";

interface Props {
  group: SellerGroup;
}

const flatten = (orders: SellerGroup["available"]) =>
  orders.flatMap((o) => o.items || []);

const SellerCard = ({ group }: Props) => {
  const availableItems = flatten(group.available);
  const delayedItems = flatten(group.delayed);
  const allOrders = [...group.available, ...group.delayed];

  return (
    <AppCard noContentPadding>
      <div className="tw:p-3 tw:sm:p-4">
        <SellerHeader
          seller={group.seller}
          totalAmount={group.totalAmount}
          totalItemsLabel={group.totalItemsLabel}
        />
        <ItemsSection variant="available" items={availableItems} />
        <ItemsSection variant="delayed" items={delayedItems} />
        <CouponBlock
          code={group.couponCode}
          discount={group.couponDiscount}
          totalAmount={group.totalAmount}
        />
        <PaymentSummary orders={allOrders} />
        <OrderRefs orders={allOrders} />
      </div>
    </AppCard>
  );
};

export default SellerCard;
