import { Plus, Star, X } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppModal from "~/components/core/modal/AppModal";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import ImgRender from "~/components/core/img/ImgRender";
import AppSwiper from "~/components/core/swiper/AppSwiper";
import { useIsMobile } from "~/hooks/use-mobile";
import clsx from "clsx";
import {
  CART_ITEM_ADDED,
  CART_ITEM_REMOVED,
  DEFAULT_BROWSE_DISTANCE,
} from "~/constants";
import SellerAddToCart from "~/shared/catalog/components/SellerAddToCart";
import SellerCatalogService from "~/services/SellerCatalogService";
import type { SellerDeal, SellersArrayItem } from "~/types/CommonTypes";

// Recommendation tag → header label prefix (screenshot: PREVIOUS SELLER /
// CHEAPEST • SK NETWORK / FASTEST LOCAL).
const TAG_HEADERS: Record<string, string> = {
  cheap: "CHEAPEST",
  "previously-purchased": "PREVIOUS SELLER",
  "fast-delivery": "FASTEST",
};

// NOTE: Delivery ETA / payment method placeholders — same pattern as
// SellerListModal/Sellers. Stable per index until the API exposes them.
const STATIC_META = [
  "Today · 6pm · PayLater 15d",
  "Sat, 19 Jul · SK Wallet",
  "Today · 4pm · COD",
  "Tomorrow · PayLater 15d",
  "Today · Prepaid",
];

export interface SellerCompareModalProps {
  show: boolean;
  dealId?: string;
  distance?: number | string;
  callback?: (payload: { action: string; data?: any }) => void;
}

const getHeaderLabel = (seller: SellersArrayItem): string | null => {
  const tags = seller.tags || [];
  const primary = (["previously-purchased", "cheap", "fast-delivery"] as const)
    .map((t) => (tags.includes(t) ? TAG_HEADERS[t] : null))
    .find(Boolean);

  if (!primary) return null;

  if (primary === "PREVIOUS SELLER") return primary;

  if (primary === "CHEAPEST") {
    return seller.isSkSeller ? "CHEAPEST · SK NETWORK" : "CHEAPEST";
  }

  // FASTEST
  return seller.isSkSeller ? "FASTEST · SK NETWORK" : "FASTEST LOCAL";
};

const getLineTotal = (seller: SellersArrayItem): number => {
  const unitPrice = Number(seller.price) || 0;
  const qty =
    seller.sellingType !== "UNIT" && Number(seller.packageQty) > 0
      ? Number(seller.packageQty)
      : Number(seller.minQty) || 1;
  return unitPrice * qty;
};

const SellerCompareModal: React.FC<SellerCompareModalProps> = ({
  show,
  dealId,
  distance = DEFAULT_BROWSE_DISTANCE,
  callback,
}) => {
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<SellerDeal | null>(null);
  const [sellers, setSellers] = useState<SellersArrayItem[]>([]);
  const isMobile = useIsMobile();

  const fetchProduct = useCallback(
    async (id: string) => {
      setLoading(true);
      try {
        const response = await SellerCatalogService.getReorder(
          { filter: { dealId: id } },
          distance,
        );
        const data = response.data?.data || [];

        if (data.length > 0) {
          const formatted = SellerCatalogService.formatProductResponse(data, {
            view: "buyer",
          });
          const productData = formatted[0];
          setProduct(productData);
          setSellers(productData.sellers || []);
        } else {
          setProduct(null);
          setSellers([]);
        }
      } catch (error) {
        console.error("Error fetching seller compare data:", error);
        setProduct(null);
        setSellers([]);
      } finally {
        setLoading(false);
      }
    },
    [distance],
  );

  useEffect(() => {
    if (show && dealId) {
      fetchProduct(dealId);
    }
  }, [show, dealId, fetchProduct]);

  const handleClose = () => {
    callback?.({ action: "close", data: {} });
  };

  // Keep local seller cart state in sync after SellerAddToCart add/remove,
  // then forward the event (with sellerId) to the parent callback.
  const handleCartCallback =
    (sellerId: string) => (resp: { action: string; data: any }) => {
      if (resp.action === CART_ITEM_ADDED) {
        setSellers((prev) =>
          prev.map((s) =>
            s.id === sellerId
              ? {
                  ...s,
                  cartQuantity:
                    Number(resp.data?.qty ?? resp.data?.quantity) ||
                    s.cartQuantity,
                  itemId: resp.data?.itemId || s.itemId,
                  cartId: resp.data?.cartId || s.cartId,
                }
              : s,
          ),
        );
      } else if (resp.action === CART_ITEM_REMOVED) {
        setSellers((prev) =>
          prev.map((s) =>
            s.id === sellerId
              ? { ...s, cartQuantity: 0, itemId: "", cartId: "" }
              : s,
          ),
        );
      }
      callback?.({
        action: resp.action,
        data: { ...resp.data, sellerId, product },
      });
    };

  const handleCompareAll = () => {
    callback?.({ action: "compareAll", data: product });
  };

  const isBestSeller = (seller: SellersArrayItem) =>
    (seller.tags || []).includes("cheap");

  // Shared add-to-cart button (stepper once in cart) for both layouts.
  const renderAddToCart = (
    seller: SellersArrayItem,
    opts: { block?: boolean } = {},
  ) => {
    const isBest = isBestSeller(seller);
    const inCart = Number(seller.cartQuantity) > 0;
    const lineTotal = getLineTotal(seller);

    return (
      <SellerAddToCart
        qty={seller.cartQuantity || 0}
        maxQty={seller.qty}
        dealId={product!._id}
        dealRefId={product!.id}
        itemId={seller.itemId}
        cartId={seller.cartId}
        sellerId={seller.id}
        type={inCart ? 2 : undefined}
        isSkSeller={seller.isSkSeller}
        sellingType={seller.sellingType}
        packageQty={seller.packageQty || 0}
        callback={handleCartCallback(seller.id)}
        fill={isBest ? "solid" : "outline"}
        className={clsx(
          "tw:rounded-full tw:px-3.5 tw:py-2 tw:text-xs tw:font-bold tw:gap-1",
          opts.block && "tw:w-full tw:justify-center",
        )}
        stepperClassName={clsx(
          "tw:px-3 tw:py-2 tw:rounded-full tw:bg-white tw:font-semibold",
          opts.block
            ? "tw:w-full tw:justify-between"
            : "tw:justify-between tw:min-w-24",
        )}
      >
        <Plus size={14} strokeWidth={2.5} />
        Add · <Amount value={lineTotal} decimalPlaces={0} />
      </SellerAddToCart>
    );
  };

  // Desktop card (screenshot layout) — vertical: header label, seller name
  // with badge + rating, big price, delivery/payment lines, full-width Add.
  const renderDesktopCard = (seller: SellersArrayItem, index: number) => {
    const isBest = isBestSeller(seller);
    const headerLabel = getHeaderLabel(seller);
    const rating = seller.ratingsSummary?.avgRating;
    const meta = STATIC_META[index % STATIC_META.length].split(" · ");

    return (
      <div
        key={seller.id}
        className={clsx(
          "tw:relative tw:flex tw:h-full tw:flex-col tw:rounded-2xl tw:border tw:p-4",
          isBest ? "tw:border-emerald-300/70" : "tw:bg-white tw:border-slate-200",
        )}
        style={
          isBest
            ? { backgroundColor: "var(--accent-in-bg, #e7f4d7)" }
            : undefined
        }
      >
        {isBest && (
          <span
            className="tw:absolute tw:top-3 tw:right-3 tw:rounded-md tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-bold tw:tracking-wide tw:text-white"
            style={{ backgroundColor: "var(--accent-in, #1f8a4f)" }}
          >
            BEST
          </span>
        )}

        {headerLabel && (
          <p className="tw:mb-1 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wider tw:text-slate-400">
            {headerLabel.split(" · ")[0]}
          </p>
        )}

        <h3
          className={clsx(
            "tw:text-[15px] tw:font-bold tw:leading-tight",
            isBest ? "tw:text-(--accent-in-dark,#0f5a2e)" : "tw:text-slate-900",
          )}
        >
          {seller.name}
        </h3>

        <div className="tw:mt-1 tw:flex tw:flex-wrap tw:items-center tw:gap-1.5">
          <span
            className={clsx(
              "tw:shrink-0 tw:rounded tw:px-1.5 tw:py-0.5 tw:text-[9px] tw:font-bold tw:uppercase tw:tracking-wide",
              seller.isSkSeller
                ? "tw:bg-emerald-50 tw:text-(--accent-in-dark,#0f5a2e)"
                : "tw:bg-violet-50 tw:text-violet-700",
            )}
          >
            {seller.isSkSeller ? "SK" : "PEER"}
          </span>
          {rating != null && (
            <span className="tw:inline-flex tw:items-center tw:gap-0.5 tw:text-[11px] tw:font-medium tw:text-amber-600">
              <Star className="tw:h-3 tw:w-3 tw:fill-amber-400 tw:text-amber-400" />
              {Number(rating).toFixed(1)}
            </span>
          )}
        </div>

        <div className="tw:mt-2.5">
          <Amount
            value={seller.price || 0}
            decimalPlaces={0}
            className={clsx(
              "tw:text-2xl tw:font-bold tw:leading-none",
              isBest ? "tw:text-(--accent-in-dark,#0f5a2e)" : "tw:text-slate-900",
            )}
          />
        </div>

        <div className="tw:mt-2 tw:mb-3 tw:flex tw:flex-col tw:gap-0.5">
          {meta.map((line) => (
            <p key={line} className="tw:text-[11px] tw:text-slate-500">
              {line}
            </p>
          ))}
        </div>

        <div className="tw:mt-auto">{renderAddToCart(seller, { block: true })}</div>
      </div>
    );
  };

  return (
    <AppModal
      show={show}
      callback={handleClose}
      className="tw:max-w-lg tw:md:max-w-3xl tw:max-h-[90vh]"
    >
      <AppModal.Content noPadding>
        <div className="tw:relative tw:px-4 tw:pt-5 tw:pb-4">
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="tw:absolute tw:top-3 tw:right-3 tw:p-1.5 tw:rounded-full tw:text-slate-500 tw:hover:text-slate-900 tw:hover:bg-black/5"
          >
            <X size={18} />
          </button>
          {loading ? (
            <div className="tw:flex tw:justify-center tw:items-center tw:h-48">
              <AppSpinner />
            </div>
          ) : !product ? (
            <div className="tw:text-center tw:py-12">
              <p className="tw:text-muted-foreground">Product not found</p>
            </div>
          ) : (
            <>
              {/* Product header */}
              <div className="tw:flex tw:items-start tw:gap-3 tw:mb-4 tw:pr-8">
                <div className="tw:h-12 tw:w-12 tw:shrink-0 tw:rounded-xl tw:bg-[#e8e1d6] tw:flex tw:items-center tw:justify-center tw:overflow-hidden">
                  {product.images?.[0] ? (
                    <ImgRender
                      assetId={product.images[0]}
                      alt={product.name}
                      className="tw:h-full tw:w-full tw:object-cover"
                      size="200"
                      fallback={
                        <span className="tw:text-[10px] tw:font-bold tw:text-slate-500 tw:tracking-wide tw:text-center tw:leading-tight tw:px-1">
                          {product.brand?.name || product.companyName || ""}
                        </span>
                      }
                    />
                  ) : (
                    <span className="tw:text-[10px] tw:font-bold tw:text-slate-500 tw:tracking-wide tw:text-center tw:leading-tight tw:px-1">
                      {product.brand?.name || product.companyName || ""}
                    </span>
                  )}
                </div>

                <div className="tw:flex-1 tw:min-w-0">
                  <h2 className="tw:text-base tw:font-bold tw:text-slate-900 tw:leading-snug">
                    {product.name}
                  </h2>
                  <p className="tw:mt-0.5 tw:text-xs tw:text-slate-500">
                    MRP <Amount value={product.mrp} decimalPlaces={0} />
                    {Number(product.loggedInUserStock) > 0 && (
                      <>
                        {" "}
                        <span className="tw:mx-1">·</span> your stock{" "}
                        {product.loggedInUserStock}{" "}
                        {product.loggedInUserStockUom || "units"}
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Seller list — vertical stack on mobile, swipeable cards on desktop */}
              {sellers.length === 0 ? (
                <div className="tw:text-center tw:py-8">
                  <p className="tw:text-sm tw:text-slate-500">
                    No sellers available
                  </p>
                </div>
              ) : !isMobile ? (
                <AppSwiper
                  config={{
                    slidesPerView: Math.min(sellers.length, 3),
                    spaceBetween: 12,
                  }}
                >
                  {sellers.map((seller, index) => (
                    <AppSwiper.Slide
                      key={seller.id}
                      isAutoHeight
                      className="tw:!h-auto tw:py-1"
                    >
                      {renderDesktopCard(seller, index)}
                    </AppSwiper.Slide>
                  ))}
                </AppSwiper>
              ) : (
                <div className="tw:flex tw:flex-col tw:gap-2.5">
                  {sellers.map((seller, index) => {
                    const isBest = isBestSeller(seller);
                    const headerLabel = getHeaderLabel(seller);
                    const rating = seller.ratingsSummary?.avgRating;
                    const meta = STATIC_META[index % STATIC_META.length];

                    return (
                      <div
                        key={seller.id}
                        className={clsx(
                          "tw:relative tw:rounded-2xl tw:p-3.5 tw:border tw:transition-colors",
                          isBest
                            ? "tw:border-emerald-300/70"
                            : "tw:bg-white tw:border-slate-200",
                        )}
                        style={
                          isBest
                            ? { backgroundColor: "var(--accent-in-bg, #e7f4d7)" }
                            : undefined
                        }
                      >
                        {isBest && (
                          <span
                            className="tw:absolute tw:-top-px tw:right-3 tw:rounded-b-md tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-bold tw:tracking-wide tw:text-white"
                            style={{
                              backgroundColor: "var(--accent-in, #1f8a4f)",
                            }}
                          >
                            BEST
                          </span>
                        )}

                        <div className="tw:flex tw:items-center tw:gap-3">
                          <div className="tw:min-w-0 tw:flex-1">
                            {headerLabel && (
                              <p className="tw:mb-1 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wider tw:text-slate-400">
                                {headerLabel}
                              </p>
                            )}

                            <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-1.5">
                              <h3
                                className={clsx(
                                  "tw:text-[15px] tw:font-bold tw:leading-tight tw:truncate",
                                  isBest
                                    ? "tw:text-(--accent-in-dark,#0f5a2e)"
                                    : "tw:text-slate-900",
                                )}
                              >
                                {seller.name}
                              </h3>
                              <span
                                className={clsx(
                                  "tw:shrink-0 tw:rounded tw:px-1.5 tw:py-0.5 tw:text-[9px] tw:font-bold tw:uppercase tw:tracking-wide",
                                  seller.isSkSeller
                                    ? "tw:bg-emerald-50 tw:text-(--accent-in-dark,#0f5a2e)"
                                    : "tw:bg-violet-50 tw:text-violet-700",
                                )}
                              >
                                {seller.isSkSeller ? "SK" : "PEER"}
                              </span>
                              {rating != null && (
                                <span className="tw:inline-flex tw:items-center tw:gap-0.5 tw:text-[11px] tw:font-medium tw:text-amber-600">
                                  <Star className="tw:h-3 tw:w-3 tw:fill-amber-400 tw:text-amber-400" />
                                  {Number(rating).toFixed(1)}
                                </span>
                              )}
                            </div>

                            <div className="tw:mt-1.5">
                              <Amount
                                value={seller.price || 0}
                                decimalPlaces={0}
                                className={clsx(
                                  "tw:text-2xl tw:font-bold tw:leading-none",
                                  isBest
                                    ? "tw:text-(--accent-in-dark,#0f5a2e)"
                                    : "tw:text-slate-900",
                                )}
                              />
                            </div>

                            <p className="tw:mt-1 tw:text-[11px] tw:text-slate-500 tw:truncate">
                              {meta}
                            </p>
                          </div>

                          <div className="tw:shrink-0">
                            {renderAddToCart(seller)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Compare all link */}
              {Number(product.totalSellers) > sellers.length && (
                <button
                  type="button"
                  onClick={handleCompareAll}
                  className="tw:mt-4 tw:flex tw:items-center tw:gap-1 tw:w-full tw:text-left tw:text-sm tw:font-medium tw:text-slate-700 tw:hover:text-slate-900"
                >
                  <Plus size={16} className="tw:text-slate-500" />
                  <span>
                    Compare all {product.totalSellers} sellers{" "}
                    <span className="tw:text-slate-400 tw:font-normal">
                      — price · ETA · paylater · ratings
                    </span>
                  </span>
                  <span className="tw:ml-auto tw:text-slate-400">→</span>
                </button>
              )}
            </>
          )}
        </div>
      </AppModal.Content>
    </AppModal>
  );
};

export default SellerCompareModal;
