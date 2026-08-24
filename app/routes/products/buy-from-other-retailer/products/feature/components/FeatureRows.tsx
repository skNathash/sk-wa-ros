import { Plus } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import NoData from "~/components/core/no-data/NoData";
import { CART_ITEM_ADDED } from "~/constants";
import SellerAddToCart from "~/shared/catalog/components/SellerAddToCart";
import ReorderCard from "~/shared/products/reorder-card/ReorderCard";
import ReorderCardSkeleton from "~/shared/products/reorder-card/ReorderCardSkeleton";
import { getFirstSeller } from "~/shared/products/reorder-card/helper";

interface FeatureRowsProps {
  data: any[];
  loading: boolean;
  callback?: (args: { action: string; data: any }) => void;
}

/**
 * Feed for the feature (data-point) list — one full-width row per product on
 * every breakpoint, so mobile and desktop read the same. Each row carries the
 * quick-add control; tapping ADD hands the deal back to the page, which opens
 * the seller list.
 */
const FeatureRows = ({ data, loading, callback }: FeatureRowsProps) => {
  if (loading) {
    return (
      <AppCard noPadding className="app-bleed-x tw:bg-white tw:mb-0!">
        <ReorderCardSkeleton />
      </AppCard>
    );
  }

  if (!data || data.length === 0) {
    return (
      <AppCard className="app-bleed-x">
        <NoData />
      </AppCard>
    );
  }

  // `app-bleed-x` pulls the feed out of the page gutter on theme-2 mobile so
  // rows run edge to edge; no-op on desktop / other themes.
  return (
    <AppCard noPadding className="app-bleed-x tw:bg-white tw:mb-0!">
      {data.map((product, index) => {
        const seller = getFirstSeller(product);
        const dealId = product?._id || product?.id;

        return (
          <ReorderCard
            key={dealId || index}
            variant="list"
            product={product}
            action={
              product?.inCart?.status ? (
                <SellerAddToCart
                  qty={product?.inCart?.qty || 0}
                  maxQty={seller?.qty || product?.maxQty || 0}
                  dealId={dealId}
                  dealRefId={product?.id}
                  itemId={product?.itemId}
                  cartId={product?.cartId}
                  sellerId={seller?.id}
                  isSkSeller={seller?.isSkSeller}
                  type={2}
                  sellingType={product?.sellingType}
                  packageQty={product?.packageQty}
                  selectedStockUom={product?.selectedStockUom}
                  className="tw:shrink-0 tw:rounded-full tw:px-4"
                  callback={(payload: { action: string; data?: any }) => {
                    if (payload.action === "price-slab") {
                      callback?.({ action: "price-slab", data: { product } });
                      return;
                    }
                    if (payload.action === CART_ITEM_ADDED) {
                      callback?.({
                        action: CART_ITEM_ADDED,
                        data: { dealId, qty: payload.data?.qty },
                      });
                    }
                  }}
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
                    callback?.({ action: "buy", data: dealId });
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
    </AppCard>
  );
};

export default FeatureRows;
