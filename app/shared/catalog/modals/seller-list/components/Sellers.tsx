import clsx from "clsx";
import { MapPin, Star } from "lucide-react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import TintTile from "~/components/core/tint/TintTile";
import { tintIndexFor } from "~/components/core/tint/tints";
import KingSlabInfo from "~/components/feature/products/king-slab/KingSlabInfo";
import CaseQtyPopover from "~/shared/catalog/components/CaseQtyPopover";
import SellerAddToCart from "~/shared/catalog/components/SellerAddToCart";
import SellingTypeDisplay from "~/shared/catalog/components/SellingTypeDsiplay";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";
import useScreenView from "~/hooks/useScreenView";
import SellersTable from "./SellersTable";
import type { Deal, SellersArrayItem } from "~/types/CommonTypes";

type Props = {
  loading: boolean;
  silentLoading?: boolean;
  sellers: Array<SellersArrayItem & { deal: Deal }>;
  onAddToCart: (response: { action: string; data: any }) => void;
  onSellerClick: (seller: SellersArrayItem & { deal: Deal }) => void;
  slabOnly?: boolean;
};

// NOTE: The values below are static placeholders for data points that are not
// yet available from the API (delivery ETA, accepted payment methods). They are
// keyed off the seller's index so each row stays stable. The rating is real —
// it comes from each seller's `ratingsSummary`.
const STATIC_DELIVERY = [
  "Tomorrow",
  "Today · 2 hr",
  "Today",
  "Tomorrow",
  "Today",
];
const STATIC_PAYMENTS: string[][] = [
  ["Paylater 15d"],
  ["Paylater", "Prepaid"],
  ["COD", "UPI"],
  ["Prepaid"],
  ["COD", "Paylater"],
];
const pick = <T,>(arr: T[], index: number): T => arr[index % arr.length];

// Two-letter monogram, e.g. "Sakti Store" -> "SA".
const monogram = (name: string) => {
  const clean = (name || "?").trim();
  const parts = clean.split(/\s+/);
  const two =
    parts.length > 1 ? parts[0][0] + parts[1][0] : clean.slice(0, 2);
  return two.toUpperCase();
};

const Sellers = ({
  loading,
  silentLoading,
  sellers,
  onAddToCart,
  onSellerClick,
  slabOnly,
}: Props) => {
  const { isMobile } = useScreenView();

  if (loading) {
    return (
      <div className="tw:flex tw:justify-center tw:items-center tw:h-64">
        <AppSpinner />
      </div>
    );
  }

  // Real derived data points (not static):
  // Cheapest = lowest priced in-stock peer (non-SK) seller.
  const peerPrices = sellers
    .filter((s) => !s.isSkSeller && Number(s.qty) > 0 && s.price != null)
    .map((s) => Number(s.price));
  const cheapestPrice = peerPrices.length ? Math.min(...peerPrices) : null;

  return (
    <div className="tw:flex-1 tw:overflow-y-auto tw:relative">
      {silentLoading && (
        <div className="tw:absolute tw:inset-0 tw:bg-background/50 tw:backdrop-blur-[1px] tw:z-20 tw:flex tw:items-center tw:justify-center">
          <div className="tw:bg-card tw:p-3 tw:rounded-full tw:shadow-lg tw:border tw:border-border">
            <AppSpinner className="tw:w-6 tw:h-6" />
          </div>
        </div>
      )}
      {!isMobile ? (
        <SellersTable
          sellers={sellers}
          onAddToCart={onAddToCart}
          onSellerClick={onSellerClick}
          slabOnly={slabOnly}
          cheapestPrice={cheapestPrice}
        />
      ) : sellers.length > 0 ? (
        <div className="tw:flex tw:flex-col tw:gap-3.5 tw:pt-2 tw:pb-1">
          {sellers.map((seller, index) => {
            const hasSlab =
              seller.priceSlab?.isAvailable && seller.priceSlab?.configId;
            const inStock = Number(seller.qty) > 0;
            const inCart = Boolean(seller.deal?.inCart?.status);
            const hasScheme = seller.b2bScheme?.status === "Running";
            const effectivePrice = hasScheme
              ? seller.b2bScheme?.offerPrice || seller.price
              : seller.price;
            const sellerDiscount = seller.discount ?? seller.discountPercentage;

            const isCheapest =
              !seller.isSkSeller &&
              cheapestPrice != null &&
              Number(seller.price) === cheapestPrice;

            const rating = seller.ratingsSummary?.avgRating;
            // Static placeholders.
            const delivery = pick(STATIC_DELIVERY, index);
            const payments = pick(STATIC_PAYMENTS, index);
            const cartQty = Number(seller.deal?.inCart?.qty) || 0;
            // Line total for what is already in the cart from this seller.
            const cartTotal = cartQty * (Number(effectivePrice) || 0);

            return (
              <div
                key={seller.id || index}
                className={clsx({
                  "tw:relative tw:rounded-2xl tw:border tw:p-3 tw:pt-3.5 tw:transition-colors": true,
                  "tw:bg-emerald-50 tw:border-emerald-300": isCheapest,
                  "tw:bg-primary/5 tw:border-primary/30": !isCheapest && hasSlab,
                  "tw:bg-card tw:border-border": !isCheapest && !hasSlab,
                  "tw:ring-1 tw:ring-primary/40": inCart,
                  "tw:hidden": slabOnly && !hasSlab,
                })}
              >
                {/* Corner ribbon — cheapest peer seller in the list */}
                {isCheapest && (
                  <span className="tw:absolute tw:-top-2 tw:left-3 tw:rounded-md tw:bg-emerald-600 tw:px-2 tw:py-0.5 tw:text-[9px] tw:font-bold tw:tracking-wide tw:text-white tw:uppercase">
                    Best price
                  </span>
                )}

                {/* Header: avatar | name + meta | price */}
                <div className="tw:flex tw:gap-2.5">
                  <TintTile
                    index={tintIndexFor(seller.name || "")}
                    className="tw:shrink-0 tw:w-11 tw:h-11 tw:rounded-xl tw:text-sm tw:font-bold"
                  >
                    {monogram(seller.name || "")}
                  </TintTile>

                  <div className="tw:flex-1 tw:min-w-0">
                    <div className="tw:flex tw:items-start tw:justify-between tw:gap-2">
                      <div className="tw:min-w-0">
                        <div className="tw:flex tw:items-center tw:gap-1.5">
                          <h5
                            role="button"
                            tabIndex={0}
                            onClick={() => onSellerClick?.(seller)}
                            className={clsx({
                              "tw:font-semibold tw:text-[15px] tw:leading-tight tw:truncate tw:cursor-pointer": true,
                              "tw:text-foreground": !seller.isSkSeller,
                              "tw:text-primary": seller.isSkSeller,
                            })}
                          >
                            {seller.name}
                          </h5>
                          {hasScheme && (
                            <span className="tw:shrink-0 tw:inline-flex tw:items-center tw:gap-1 tw:rounded-md tw:bg-orange-100 tw:px-1.5 tw:py-0.5 tw:text-[9px] tw:font-bold tw:text-orange-600 tw:uppercase">
                              <span className="tw:w-1.5 tw:h-1.5 tw:bg-orange-500 tw:rounded-full tw:animate-pulse" />
                              Scheme
                            </span>
                          )}
                        </div>

                        {/* Meta: rating · distance · delivery(static) */}
                        <div className="tw:mt-1 tw:flex tw:items-center tw:gap-1 tw:text-[11px] tw:text-muted-foreground tw:flex-wrap">
                          {rating != null && (
                            <>
                              <span className="tw:inline-flex tw:items-center tw:gap-0.5 tw:font-medium tw:text-foreground">
                                <Star className="tw:w-3 tw:h-3 tw:fill-amber-400 tw:text-amber-400" />
                                {rating.toFixed(1)}
                              </span>
                              <span>·</span>
                            </>
                          )}
                          <span className="tw:inline-flex tw:items-center tw:gap-0.5">
                            <MapPin className="tw:w-3 tw:h-3" />
                            {seller.distance?.toFixed(1) || 0} km
                          </span>
                          <span>·</span>
                          <span>{delivery}</span>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="tw:shrink-0 tw:text-right">
                        <div
                          className={clsx({
                            "tw:text-xl tw:font-bold tw:leading-none": true,
                            "tw:text-emerald-700": isCheapest,
                            "tw:text-orange-600": hasScheme && !isCheapest,
                            "tw:text-foreground": !isCheapest && !hasScheme,
                          })}
                        >
                          <Amount value={effectivePrice} />
                        </div>
                        {sellerDiscount > 0 && seller.mrp != null && (
                          <div className="tw:mt-1 tw:text-[10px] tw:font-medium tw:text-muted-foreground">
                            <span className="tw:line-through">
                              <Amount value={seller.mrp} />
                            </span>{" "}
                            · {Math.round(sellerDiscount)}% off
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stock / pack strip */}
                {(inStock || cartQty > 0) && (
                  <div
                    className={clsx(
                      "tw:mt-2.5 tw:flex tw:items-center tw:justify-between tw:gap-2 tw:rounded-lg tw:px-2.5 tw:py-1.5 tw:text-[11px]",
                      isCheapest ? "tw:bg-emerald-100/70" : "tw:bg-muted",
                    )}
                  >
                    <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-muted-foreground tw:min-w-0">
                      {inStock && (
                        <>
                          <span>Stock</span>
                          <span className="tw:font-semibold tw:text-foreground tw:inline-flex tw:items-center tw:gap-0.5">
                            {(seller as any).selectedStockUom ? (
                              <DisplayQty
                                qty={seller.qty}
                                isLooseQty={false}
                                uom={(seller as any).selectedStockUom}
                                hideDefaultUom={true}
                              />
                            ) : (
                              <>
                                {seller.qty}{" "}
                                <SellingTypeDisplay
                                  sellingType={seller.sellingType}
                                />
                              </>
                            )}
                            <CaseQtyPopover
                              packageQty={seller.packageQty || 0}
                              sellingType={seller.sellingType}
                            />
                          </span>
                        </>
                      )}
                    </span>
                    {cartQty > 0 && (
                      <span className="tw:shrink-0 tw:text-muted-foreground">
                        Total{" "}
                        <span className="tw:font-bold tw:text-foreground">
                          <Amount value={cartTotal} />
                        </span>
                      </span>
                    )}
                  </div>
                )}

                {/* Tags: connected seller, payments(static), slab */}
                <div className="tw:mt-2 tw:flex tw:flex-wrap tw:items-center tw:gap-1">
                  {seller.isConnectedSeller && (
                    <span className="tw:inline-flex tw:items-center tw:rounded-full tw:bg-primary/10 tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:text-primary tw:uppercase tw:tracking-wide">
                      Your connected seller
                    </span>
                  )}
                  {payments.map((p) => (
                    <span
                      key={p}
                      className="tw:text-[10px] tw:font-medium tw:text-muted-foreground tw:bg-card tw:border tw:border-border tw:rounded-full tw:px-1.5 tw:py-0.5"
                    >
                      {p}
                    </span>
                  ))}
                  {hasSlab && seller.priceSlab ? (
                    <KingSlabInfo slabs={seller.priceSlab.slab} size="xs" />
                  ) : null}
                </div>

                {/* Action */}
                <div className="tw:mt-2.5 tw:flex tw:items-center tw:justify-end">
                  {inStock ? (
                    <SellerAddToCart
                      qty={cartQty}
                      maxQty={seller.qty}
                      dealId={seller.deal?._id}
                      itemId={seller.deal?.itemId}
                      cartId={seller.deal?.cartId}
                      sellerId={seller.id}
                      callback={onAddToCart}
                      type={seller.deal?.inCart?.status ? 2 : 1}
                      dealRefId={seller.deal.id}
                      isSkSeller={seller.isSkSeller}
                      className="tw:h-8 tw:px-5"
                      stepperClassName="tw:px-3 tw:py-2 tw:rounded-lg tw:bg-white"
                      sellingType={seller.sellingType}
                      packageQty={seller.packageQty || 0}
                      selectedStockUom={(seller as any).selectedStockUom}
                    />
                  ) : (
                    <AppBadge variant="danger">Out of stock</AppBadge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="tw:text-center tw:py-8">
          <p className="tw:text-muted-foreground tw:text-sm">
            No sellers available
          </p>
        </div>
      )}
    </div>
  );
};

export default Sellers;
