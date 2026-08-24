import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import useAppNav from "~/hooks/useAppNav";
import { CART_ITEM_ADDED, DEFAULT_BROWSE_DISTANCE } from "~/constants";
import SellerCatalogService from "~/services/SellerCatalogService";
import ProductSlabModal from "~/shared/catalog/modals/product-slab/ProductSlabModal";
import SellerCompareModal from "~/shared/products/modals/seller-compare/SellerCompareModal";
import AppButton from "~/components/core/button/AppButton";
import { Plus } from "lucide-react";
import ReorderCard from "~/shared/products/reorder-card/ReorderCard";
import {
  type ReorderItem,
  getFirstSeller,
  mapProductToReorderItem,
} from "~/shared/products/reorder-card/helper";
import SellerAddToCart from "~/shared/catalog/components/SellerAddToCart";

export type { ReorderItem };

export interface TopReorderListProps {
  /** Maximum number of items to show. */
  limit?: number;
  /** Optional click handler for the “See all” link. */
  onSeeAll?: () => void;
  /** Optional click handler when an item row is tapped. */
  onItemClick?: (item: ReorderItem) => void;
  /** Optional extra classes for the outer wrapper. */
  className?: string;
  /** Browse distance for network deals. */
  distance?: number | string;
  /** Callback for cart events. */
  callback?: (data: { action: string; data: any }) => void;
}

/**
 * Compact reorder list for the network-products browse page.
 * Shows the top N products running low on stock with a quick-add action.
 */
const TopReorderList: React.FC<TopReorderListProps> = ({
  limit = 5,
  onSeeAll,
  onItemClick,
  className,
  distance = DEFAULT_BROWSE_DISTANCE,
  callback,
}) => {
  const { t } = useTranslation("common");
  const { to } = useAppNav();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceSlabModal, setPriceSlabModal] = useState<{
    show: boolean;
    dealId: string;
    sellerId: string;
  }>({ show: false, dealId: "", sellerId: "" });
  const [compareDealId, setCompareDealId] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = SellerCatalogService.getNetworkReorderParams({
          page: 1,
          count: limit,
        });
        const response = await SellerCatalogService.getNetworkDeals(
          params,
          distance,
        );
        const data = response.data?.data || [];
        const formatted = SellerCatalogService.formatProductResponse(data);
        setProducts(formatted);
      } catch (error) {
        console.error("Error fetching reorder products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [distance, limit]);

  const items = products.map(mapProductToReorderItem);
  const displayed = items.slice(0, limit);

  const handleSeeAll = () => {
    if (onSeeAll) {
      onSeeAll();
      return;
    }
    to("/products/buy-from-other-retailer/products/reorder", {
      distance: distance,
    });
  };

  const handleAddToCartCallback = useCallback(
    (product: any) => (data: { action: string; data?: any }) => {
      if (data.action === "price-slab") {
        const seller = getFirstSeller(product);
        setPriceSlabModal({
          show: true,
          dealId: product._id || product.id,
          sellerId: seller?.id || "",
        });
        return;
      }

      if (data.action === CART_ITEM_ADDED) {
        const dealId = data.data?.dealId;
        if (dealId) {
          setProducts((prev) =>
            prev.map((p) => {
              if (p._id === dealId || p.id === dealId) {
                return {
                  ...p,
                  inCart: { status: true, qty: data.data?.qty || 1 },
                };
              }
              return p;
            }),
          );
          callback?.({
            action: CART_ITEM_ADDED,
            data: { dealId },
          });
        }
      }
    },
    [callback],
  );

  const handlePriceSlabModalCallback = useCallback(
    (payload: { action: string; data?: any }) => {
      if (payload.action === "close") {
        setPriceSlabModal({ show: false, dealId: "", sellerId: "" });
      }
    },
    [],
  );

  // Compare modal: only close on explicit close; cart events keep it open
  // and just sync local/parent state.
  const handleCompareModalCallback = useCallback(
    (payload: { action: string; data?: any }) => {
      if (payload.action === "close") {
        setCompareDealId("");
        return;
      }

      if (payload.action === "price-slab") {
        setCompareDealId("");
        setPriceSlabModal({
          show: true,
          dealId: payload.data?.dealId || "",
          sellerId: payload.data?.sellerId || "",
        });
        return;
      }

      if (payload.action === CART_ITEM_ADDED) {
        const dealId = payload.data?.dealId;
        if (dealId) {
          setProducts((prev) =>
            prev.map((p) => {
              if (p._id === dealId || p.id === dealId) {
                return {
                  ...p,
                  inCart: { status: true, qty: payload.data?.qty || 1 },
                };
              }
              return p;
            }),
          );
          callback?.({ action: CART_ITEM_ADDED, data: { dealId } });
        }
      }
    },
    [callback],
  );

  if (loading) {
    return (
      <div className={className}>
        <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:mb-1 tw:mt-4">
          <h2 className="tw:text-sm tw:font-bold tw:tracking-wide tw:text-foreground">
            TOP OF REORDER
          </h2>
        </div>
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-2">
          {Array.from({ length: limit }).map((_, idx) => (
            <div
              key={idx}
              className="tw:h-20 tw:rounded-2xl tw:bg-card tw:shadow-sm tw:animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:mb-1 tw:mt-4">
        <div className="tw:flex tw:items-baseline tw:gap-2">
          <h2 className="tw:text-sm tw:font-bold tw:tracking-wide tw:text-foreground">
            TOP OF REORDER
          </h2>
        </div>
        <button
          type="button"
          onClick={handleSeeAll}
          className="tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:font-semibold tw:text-primary tw:hover:text-primary-dark tw:transition-colors"
        >
          {t("seeAll", { defaultValue: "See all" })}
          <span>→</span>
        </button>
      </div>

      {/* Items */}
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-2">
        {displayed.map((item, index) => {
          const product = products[index];
          const seller = getFirstSeller(product);
          return (
            <ReorderCard
              key={item.id}
              product={product}
              item={item}
              action={
                <div
                  onClick={(e) => {
                    if (onItemClick) {
                      e.stopPropagation();
                      onItemClick(item);
                    }
                  }}
                >
                  {product?.inCart?.status ? (
                    <SellerAddToCart
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
                        setCompareDealId(
                          String(product?._id || product?.id || ""),
                        );
                      }}
                    >
                      <Plus size={14} />
                      Add
                    </AppButton>
                  )}
                </div>
              }
            />
          );
        })}
      </div>

      <ProductSlabModal
        show={priceSlabModal.show}
        dealId={priceSlabModal.dealId}
        sellerId={priceSlabModal.sellerId}
        callback={handlePriceSlabModalCallback}
      />

      <SellerCompareModal
        show={Boolean(compareDealId)}
        dealId={compareDealId}
        distance={distance}
        callback={handleCompareModalCallback}
      />
    </div>
  );
};

export default TopReorderList;
