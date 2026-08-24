import clsx from "clsx";
import { Bell, Eye, Layers, ShoppingCart, Trash2 } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import useAppNav from "~/hooks/useAppNav";
import RemoveSubscribeBtn from "~/shared/catalog/components/subscribe-buttons/RemoveSubscribeBtn";
import SubscribeBtn from "~/shared/catalog/components/subscribe-buttons/SubscribeBtn";

const CART_PATH = "/dashboard/inventory/subscribe/cart";

export interface SubscribeActionsProps {
  /** Formatted subscribe deal (see InventorySubscribeService.formatDealResponse). */
  deal: any;
  /** Open the variant picker (products sold in more than one pack/flavour). */
  onChooseVariant?: () => void;
  /** Product went into the catalog cart. */
  onSubscribed?: (data: { action: string; data?: any }) => void;
  /** Product came back out of the catalog cart. */
  onRemoved?: (data: { action: string; data?: any }) => void;
  /** Drop the secondary "View cart" action — the mobile bar is too tight for it. */
  compact?: boolean;
  className?: string;
}

/**
 * The page's primary action: subscribe the product into the catalog cart,
 * pull it back out, or pick a variant first. Once the product is already in the
 * seller's catalog it turns into the link across to their own item page.
 * Rendered both beside the hero on desktop and in the mobile footer bar.
 */
const SubscribeActions = ({
  deal,
  onChooseVariant,
  onSubscribed,
  onRemoved,
  compact = false,
  className,
}: SubscribeActionsProps) => {
  const appNav = useAppNav();

  if (!deal?._id) return null;

  const size = compact ? "small" : "large";
  const primaryClass = compact ? "" : "tw:flex-1";
  const hasVariants = !!deal.groupDeals?.length;

  // Already in the catalog — the buying flow is done, so the only thing left is
  // the seller's own item page.
  if (deal.isSubscribed) {
    return (
      <div className={clsx("tw:flex tw:flex-wrap tw:gap-2", className)}>
        <AppButton
          size={size}
          color="primary"
          className={primaryClass}
          onClick={() =>
            appNav.to(`/dashboard/inventory/products/view/${deal._id}`)
          }
        >
          <Eye size={16} />
          View in my catalog
        </AppButton>
      </div>
    );
  }

  return (
    <div className={clsx("tw:flex tw:flex-wrap tw:gap-2", className)}>
      {deal.isInCart ? (
        <RemoveSubscribeBtn
          itemId={deal.itemId}
          size={size}
          color="danger"
          fill="outline"
          className={primaryClass}
          callback={(data) => onRemoved?.(data)}
        >
          <Trash2 size={16} />
          Remove from cart
        </RemoveSubscribeBtn>
      ) : hasVariants ? (
        <AppButton
          size={size}
          color="primary"
          className={primaryClass}
          onClick={onChooseVariant}
        >
          <Layers size={16} />
          Choose option
        </AppButton>
      ) : (
        <SubscribeBtn
          dealId={deal._id}
          dealName={deal.name}
          mrp={deal.mrp || 0}
          price={deal.price || deal.mrp || 0}
          images={deal.images || []}
          size={size}
          color="primary"
          className={primaryClass}
          callback={(data) => onSubscribed?.(data)}
        >
          <Bell size={16} />
          Subscribe
        </SubscribeBtn>
      )}

      {!compact && (
        <AppButton
          size={size}
          fill="outline"
          color="light"
          className="tw:md:w-36"
          onClick={() => appNav.to(CART_PATH)}
        >
          <ShoppingCart size={16} />
          View cart
        </AppButton>
      )}
    </div>
  );
};

export default SubscribeActions;
