import { ShoppingCart } from "lucide-react";
import { useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import SellerListModal from "~/shared/catalog/modals/seller-list/SellerListModal";
import type { SellerDeal } from "~/types/CommonTypes";

export interface ProductCartActionProps {
  /** Formatted seller deal (see SellerCatalogService.formatProductResponse). */
  deal: SellerDeal;
  /** Overrides the button label. */
  label?: string;
  className?: string;
}

/**
 * Buy action for the product detail page. Restocking this product means picking
 * a seller, not adding a fixed deal to the cart — so the button opens the seller
 * list modal for the deal, which owns the seller comparison and the add-to-cart
 * (slab pricing included) from there.
 */
const ProductCartAction = ({
  deal,
  label = "Add to cart",
  className,
}: ProductCartActionProps) => {
  const [showSellerList, setShowSellerList] = useState(false);

  if (!deal?._id) return null;

  return (
    <>
      <AppButton
        size="small"
        color="primary"
        fill="solid"
        noShadow
        type="button"
        onClick={() => setShowSellerList(true)}
        className={className}
      >
        <ShoppingCart size={16} />
        {label}
      </AppButton>

      <SellerListModal
        show={showSellerList}
        dealId={deal._id}
        distance={100000}
        callback={({ action }: { action: string; data?: any }) => {
          if (action === "close") setShowSellerList(false);
        }}
      />
    </>
  );
};

export default ProductCartAction;
