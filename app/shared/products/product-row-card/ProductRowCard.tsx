import React from "react";
import { Plus, Store } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import SellerAddToCart from "~/shared/catalog/components/SellerAddToCart";
import type { SellerDeal } from "~/types/CommonTypes";

interface ProductRowCardProps {
  data: SellerDeal;
  callback?: (data: { action: string; data?: any }) => void;
  hideSellerCount?: boolean;
  hideAddToCart?: boolean;
  /**
   * Seller id for the add-to-cart action. Defaults to the deal's own
   * `buyFromOtherRetailer.retailerId`; pass this when the deal shape doesn't
   * carry it (e.g. previously-purchased deals on the retailer detail page).
   */
  sellerId?: string;
  /**
   * Drop the card chrome (radius, border, shadow, outer margin) and render the
   * row as a bare band. Used by edge-to-edge (`app-bleed-x`) mobile lists where
   * the rows are separated by dividers instead of gaps.
   */
  flush?: boolean;
}

/**
 * Horizontal (list-row) product card variant used on the buy-from-other-retailer
 * pages. Left: a brand-tinted image tile that falls back to a striped
 * placeholder. Right: a two-line product name, a price row (struck MRP + accent
 * "% OFF" chip), a mono microcap meta line (stock · sellers link), and an
 * inline add-to-cart action.
 */
const ProductRowCard: React.FC<ProductRowCardProps> = ({
  data,
  callback,
  hideSellerCount = false,
  hideAddToCart = false,
  sellerId,
  flush = false,
}) => {
  const brandName =
    data.companyName || data.brand?._displayName || data.brand?.name || "";
  // Placeholder brand codes ("111", "00000") come through on some catalog
  // data; only treat the value as a displayable brand if it has letters.
  const showBrand = /[a-z]/i.test(brandName);

  const badgeLabel = ((showBrand ? brandName : "") || data.name || "")
    .trim()
    .toUpperCase();

  const brandBadge = (
    <div
      className="tw:flex tw:h-full tw:w-full tw:items-center tw:justify-center tw:px-1 tw:text-center tw:text-[11px] tw:font-bold tw:tracking-wide tw:text-muted-foreground"
      style={{
        backgroundColor: "var(--muted, #f1f5f9)",
        backgroundImage:
          "repeating-linear-gradient(45deg, rgba(148,163,184,0.12) 0, rgba(148,163,184,0.12) 6px, transparent 6px, transparent 12px)",
      }}
    >
      <span className="tw:line-clamp-2">{badgeLabel || "—"}</span>
    </div>
  );

  const sellerCount = data.totalSellers ?? data.sellers?.length ?? 0;
  // `isOutOfStock` reflects a single deal's own availableQuantity; on
  // multi-seller network listings stock lives per seller, so the item is
  // still buyable (via the seller picker) whenever sellers exist.
  const isOutOfStock = !!data.isOutOfStock && sellerCount === 0;

  const row = (
    <div className="tw:flex tw:items-center tw:gap-3.5 tw:p-3.5">
      {/* Brand tile / product image */}
      <div
        className={`tw:relative tw:h-16 tw:w-16 tw:shrink-0 tw:overflow-hidden tw:rounded-xl${
          isOutOfStock ? " tw:opacity-50 tw:grayscale" : ""
        }`}
        style={{ backgroundColor: "var(--wa-cream, var(--muted))" }}
      >
        {data.isPromotionalDeal ? (
          <span
            className="tw:absolute tw:top-1 tw:left-1 tw:z-10 tw:rounded tw:px-1 tw:py-0.5 tw:text-[8px] tw:font-bold tw:leading-none tw:tracking-wide tw:shadow-sm"
            style={{
              backgroundColor: "var(--accent-out-bg, #fbe4d3)",
              color: "var(--accent-out-dark, #5a2506)",
            }}
          >
            PROMO
          </span>
        ) : null}
        <ImgRender
          assetId={data.images?.[0]}
          alt={data.name}
          className="tw:h-16 tw:w-16 tw:object-contain"
          fallback={brandBadge}
        />
      </div>

      {/* Details */}
      <div
        className={`tw:min-w-0 tw:flex-1${
          isOutOfStock ? " tw:opacity-60" : ""
        }`}
      >
        {showBrand ? (
          <div className="app-label tw:mb-0.5 tw:truncate tw:text-[9px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-muted-foreground">
            {brandName}
          </div>
        ) : null}
        <h3 className="tw:line-clamp-2 tw:text-[13px] tw:font-medium tw:leading-snug tw:text-foreground/85">
          {data.name}
        </h3>

        <div className="tw:mt-1.5 tw:flex tw:flex-wrap tw:items-baseline tw:gap-x-1.5 tw:gap-y-0.5">
          <Amount
            value={data.price}
            className="tw:text-base tw:font-bold tw:text-foreground"
          />
          {data.discount > 0 ? (
            <>
              <Amount
                value={data.mrp}
                className="tw:text-xs tw:text-muted-foreground tw:line-through"
              />
              <span
                className="tw:rounded tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold tw:leading-none"
                style={{
                  backgroundColor: "var(--wa-bubble, #e7f4d7)",
                  color: "var(--wa-bubble-text, #0a6b57)",
                }}
              >
                {data.discount}% OFF
              </span>
            </>
          ) : null}
        </div>

        <div className="tw:mt-2 tw:flex tw:flex-wrap tw:items-center tw:gap-x-2 tw:gap-y-1">
          {/* Miniature chat bubble (flattened lower-left corner = bubble
                tail): sellers "messaging" the buyer, in the theme's
                wa-bubble palette. Opens the seller picker. */}
          {!hideSellerCount && sellerCount > 0 ? (
            <button
              type="button"
              className="tw:inline-flex tw:cursor-pointer tw:items-center tw:gap-1 tw:rounded-lg tw:rounded-bl-[3px] tw:px-2 tw:py-1 tw:text-[10px] tw:font-bold tw:leading-none tw:transition-opacity tw:hover:opacity-80"
              style={{
                backgroundColor: "var(--wa-bubble, #e7f4d7)",
                color: "var(--wa-bubble-text, #0a6b57)",
              }}
              onClick={() => callback?.({ action: "buy", data: data._id })}
            >
              <Store size={11} strokeWidth={2.5} />
              {sellerCount} seller{sellerCount === 1 ? "" : "s"}
            </button>
          ) : null}
          <span className="app-label tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-muted-foreground">
            {data.maxQty > 0 ? `${data.maxQty} in stock` : null}
          </span>
        </div>
      </div>

      {/* Add action */}
      <div className="tw:flex tw:shrink-0 tw:flex-col tw:items-center tw:gap-1">
        {hideAddToCart ? null : data.isOutOfStock && sellerCount > 0 ? (
          <AppButton
            onClick={() => callback?.({ action: "buy", data: data._id })}
            size="small"
            className="tw:shrink-0 tw:rounded-full tw:px-3"
          >
            <Plus size={16} strokeWidth={2.5} />
            Add
          </AppButton>
        ) : !data.isOutOfStock ? (
          <SellerAddToCart
            qty={data.inCart?.qty || 0}
            maxQty={data.maxQty || 0}
            dealId={data._id}
            dealRefId={data.id}
            itemId={data.itemId}
            cartId={data.cartId}
            sellerId={sellerId ?? data.buyFromOtherRetailer?.retailerId}
            type={data.inCart?.status ? 2 : undefined}
            callback={(e) => callback?.(e)}
            sellingType={data.sellingType}
            packageQty={data.packageQty}
            selectedStockUom={data.selectedStockUom}
            className="tw:shrink-0 tw:rounded-full tw:px-3"
          />
        ) : (
          <span className="app-label tw:whitespace-nowrap tw:rounded-full tw:bg-muted tw:px-2.5 tw:py-1 tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-muted-foreground">
            Out of stock
          </span>
        )}
      </div>
    </div>
  );

  if (flush) return row;

  return (
    <AppCard noPadding className="tw:mb-0">
      {row}
    </AppCard>
  );
};

export default ProductRowCard;
