import { Plus } from "lucide-react";
import { useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import NoData from "~/components/core/no-data/NoData";
import { CART_ITEM_ADDED } from "~/constants";
import SellerCompareModal from "~/shared/products/modals/seller-compare/SellerCompareModal";
import ReorderCard from "~/shared/products/reorder-card/ReorderCard";
import ReorderCardSkeleton from "~/shared/products/reorder-card/ReorderCardSkeleton";
import AddToCart from "../../components/AddToCart";
import { getFirstSeller, mapProductToReorderItem } from "../helper";

interface ReorderRowsProps {
  data: any[];
  loading: boolean;
  callback?: (args: { action: string; data: any }) => void;
}

/**
 * Reorder feed — one full-width row per product on every breakpoint, so mobile
 * and desktop read the same. Tapping ADD opens the seller comparison for the
 * deal; rows already in the cart carry the quantity stepper instead.
 */
const ReorderRows = ({ data, loading, callback }: ReorderRowsProps) => {
  const [compareDealId, setCompareDealId] = useState<string>("");

  // Loading state
  if (loading) {
    return (
      <AppCard noPadding className="app-bleed-x tw:bg-white tw:mb-0!">
        <ReorderCardSkeleton />
      </AppCard>
    );
  }

  // No data state
  if (!data || data.length === 0) {
    return (
      <AppCard className="app-bleed-x">
        <NoData />
      </AppCard>
    );
  }

  const handleAddToCartCallback =
    (product: any) => (payload: { action: string; data?: any }) => {
      if (payload.action === "price-slab") {
        callback?.({ action: "price-slab", data: { product } });
        return;
      }
      if (payload.action === CART_ITEM_ADDED) {
        callback?.({ action: CART_ITEM_ADDED, data: payload.data });
      }
    };

  // Data state — `app-bleed-x` pulls the feed out of the page gutter on
  // theme-2 mobile so rows run edge to edge; no-op on desktop / other themes.
  return (
    <AppCard noPadding className="app-bleed-x tw:bg-white tw:mb-0!">
      {data.map((product) => {
        const item = mapProductToReorderItem(product);
        const seller = getFirstSeller(product);
        return (
          <ReorderCard
            key={item.id}
            variant="list"
            product={product}
            item={item}
            action={
              product?.inCart?.status ? (
                <AddToCart
                  qty={product?.inCart?.qty || 0}
                  maxQty={seller?.qty || product?.maxQty || 0}
                  dealId={product?._id || product?.id}
                  dealRefId={product?.id}
                  itemId={product?.itemId}
                  cartId={product?.cartId}
                  sellerId={seller?.id}
                  isSkSeller={seller?.isSkSeller}
                  type={2}
                  callback={handleAddToCartCallback(product)}
                  sellingType={product?.sellingType}
                  packageQty={product?.packageQty}
                  selectedStockUom={product?.selectedStockUom}
                  className="tw:shrink-0 tw:rounded-full tw:px-4"
                />
              ) : (
                <AppButton
                  size="small"
                  color="primary"
                  noShadow={true}
                  type="button"
                  className="tw:shrink-0 tw:rounded-full tw:px-4"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    setCompareDealId(String(product?._id || product?.id || ""));
                  }}
                >
                  <Plus size={14} />
                  Add
                </AppButton>
              )
            }
          />
        );
      })}

      <SellerCompareModal
        show={Boolean(compareDealId)}
        dealId={compareDealId}
        callback={(payload) => {
          // Only close on explicit close; cart events keep the modal open.
          if (payload.action === "close") {
            setCompareDealId("");
            return;
          }
          if (payload.action === "price-slab") {
            setCompareDealId("");
            callback?.({
              action: "price-slab",
              data: { product: payload.data?.product },
            });
            return;
          }
          if (payload.action === CART_ITEM_ADDED) {
            callback?.({ action: CART_ITEM_ADDED, data: payload.data });
          }
        }}
      />
    </AppCard>
  );
};

export default ReorderRows;
