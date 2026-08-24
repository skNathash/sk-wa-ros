import { useState } from "react";
import AppCard from "~/components/core/card/AppCard";
import RatingModal from "~/shared/reviews/modals/RatingModal";
import type { Order, SellerGroup } from "../helper";
import ItemsSection from "./ItemsSection";
import SellerHeader from "./SellerHeader";
import ThreadFooter from "./ThreadFooter";

interface Props {
  group: SellerGroup;
}

const flatten = (orders: SellerGroup["available"]) =>
  orders.flatMap((o) => o.items || []);

// One clean card per seller: the header names the seller and shows the total,
// the body lists their items, and the footer summarises payment and order refs.
const SellerCard = ({ group }: Props) => {
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null);
  const availableItems = flatten(group.available);
  const delayedItems = flatten(group.delayed);
  const allOrders = [...group.available, ...group.delayed];
  const ratingTitle =
    ratingOrder?.items?.[0]?.dealName ||
    ratingOrder?.orderRefNo ||
    group.seller.franchiseName;

  const handleRatingModal = (data: { action: string; data?: any }) => {
    if (data.action === "close" || data.action === "submitted") {
      setRatingOrder(null);
    }
  };

  const openRating = (order: Order) => {
    if (!group.seller.franchiseId) return;
    setRatingOrder(order);
  };

  return (
    <AppCard noPadding className="tw:overflow-hidden tw:rounded-2xl">
      <SellerHeader
        seller={group.seller}
        totalAmount={group.totalAmount}
        totalItemsLabel={group.totalItemsLabel}
      />

      <div className="tw:divide-y tw:divide-gray-100 tw:bg-white">
        <ItemsSection variant="available" items={availableItems} />
        <ItemsSection variant="delayed" items={delayedItems} />
      </div>

      <ThreadFooter
        orders={allOrders}
        totalAmount={group.totalAmount}
        couponCode={group.couponCode}
        couponDiscount={group.couponDiscount}
        onRateOrder={group.seller.franchiseId ? openRating : undefined}
      />

      <RatingModal
        show={Boolean(ratingOrder)}
        callback={handleRatingModal}
        franchiseId={group.seller.franchiseId}
        orderId={ratingOrder?.orderId}
        orderNumber={ratingOrder?.orderRefNo}
        sellerName={group.seller.franchiseName}
        title={ratingTitle}
      />
    </AppCard>
  );
};

export default SellerCard;
