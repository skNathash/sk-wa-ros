import React, { useEffect, useState } from "react";
import { ArrowRight, ShoppingCart } from "lucide-react";

import AppButton from "~/components/core/button/AppButton";
import useAppNav from "~/hooks/useAppNav";
import SubscribeBtn from "~/shared/catalog/components/subscribe-buttons/SubscribeBtn";
import type { ReviewItem } from "../../helper";

const CART_HREF = "/dashboard/inventory/subscribe/cart?from=barcode-scan-bulk";

interface SubscribeActionProps {
  item: ReviewItem;
  className?: string;
}

/**
 * Per-row subscribe control for a row matched to the SK catalog. Those rows
 * need no product creation — the deal already exists, so the only decision left
 * is whether to subscribe to it, and this puts that one tap on the row instead
 * of making the seller commit the whole batch from the footer.
 *
 * Once the deal is in the subscribe cart the button flips to "In cart", which
 * routes to the cart rather than adding a duplicate line. The initial state
 * comes from the formatted deal (`isInCart`, read off the local cart) and is
 * kept in local state so subscribing one row doesn't disturb the others.
 */
const SubscribeAction: React.FC<SubscribeActionProps> = ({
  item,
  className,
}) => {
  const appNav = useAppNav();
  const deal = item.deal;
  const [inCart, setInCart] = useState(!!deal?.isInCart);

  useEffect(() => {
    setInCart(!!deal?.isInCart);
  }, [deal?.id, deal?.isInCart]);

  // Only SK-catalog rows can subscribe directly — AI/not-found rows still need
  // the product created first, and an already-subscribed deal has nothing left
  // to do (its status chip already says so).
  if (
    item.matchStatus !== "FoundInSk" ||
    item.status === "Requested" ||
    !deal ||
    deal.isSubscribed
  ) {
    return null;
  }

  if (inCart) {
    return (
      <AppButton
        size="small"
        fill="outline"
        color="primary"
        className={`tw:font-semibold ${className || ""}`}
        onClick={() => appNav.to(CART_HREF)}
      >
        In cart
        <ArrowRight className="tw:w-3.5 tw:h-3.5 tw:ml-1" />
      </AppButton>
    );
  }

  return (
    <SubscribeBtn
      dealId={deal.id}
      dealName={deal.title}
      mrp={deal.mrp}
      price={deal.price}
      images={deal.images || []}
      quantity={item.qty}
      barcode={item.barcode}
      size="small"
      className={`tw:font-semibold ${className || ""}`}
      callback={(r) => {
        if (r.action === "subscribed") setInCart(true);
      }}
    >
      <ShoppingCart className="tw:w-3.5 tw:h-3.5 tw:mr-1" />
      Subscribe
    </SubscribeBtn>
  );
};

export default SubscribeAction;
