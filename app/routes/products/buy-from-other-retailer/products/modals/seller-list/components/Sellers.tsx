import clsx from "clsx";
import { MapPin } from "lucide-react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import KingSlabInfo from "~/components/feature/products/king-slab/KingSlabInfo";
import CaseQtyPopover from "~/shared/catalog/components/CaseQtyPopover";
import SellerAddToCart from "~/shared/catalog/components/SellerAddToCart";
import SellingTypeDisplay from "~/shared/catalog/components/SellingTypeDsiplay";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";
import type { Deal, SellersArrayItem } from "~/types/CommonTypes";

type Props = {
  loading: boolean;
  silentLoading?: boolean;
  sellers: Array<SellersArrayItem & { deal: Deal }>;
  onAddToCart: (response: { action: string; data: any }) => void;
  onSellerClick: (seller: SellersArrayItem & { deal: Deal }) => void;
  slabOnly?: boolean;
};

const Sellers = ({
  loading,
  silentLoading,
  sellers,
  onAddToCart,
  onSellerClick,
  slabOnly,
}: Props) => {
  if (loading) {
    return (
      <div className="tw:flex tw:justify-center tw:items-center tw:h-64">
        <AppSpinner />
      </div>
    );
  }

  return (
    <div className="tw:flex-1 tw:overflow-y-auto tw:relative">
      {silentLoading && (
        <div className="tw:absolute tw:inset-0 tw:bg-background/50 tw:backdrop-blur-[1px] tw:z-20 tw:flex tw:items-center tw:justify-center">
          <div className="tw:bg-card tw:p-3 tw:rounded-full tw:shadow-lg tw:border tw:border-border">
            <AppSpinner className="tw:w-6 tw:h-6" />
          </div>
        </div>
      )}
      {sellers.length > 0 ? (
        <div className="tw:flex tw:flex-col tw:gap-2 tw:pb-1">
          {sellers.map((seller, index) => {
            const hasSlab =
              seller.priceSlab?.isAvailable && seller.priceSlab?.configId;
            const inStock = Number(seller.qty) > 0;
            const inCart = Boolean(seller.deal?.inCart?.status);
            // Allow purchase even when seller is not serviceable
            // const notServiceable = seller.isServiceable === false;
            return (
              <div
                key={seller.id || index}
                className={clsx({
                  "tw:rounded-xl tw:border tw:p-3 tw:transition-colors": true,
                  "tw:bg-primary/5 tw:border-primary/30": hasSlab,
                  "tw:bg-card tw:border-border hover:tw:border-primary/40":
                    !hasSlab,
                  // Highlight rows already in the cart with a subtle primary ring.
                  "tw:ring-1 tw:ring-primary/30": inCart,
                  // Allow purchase even when seller is not serviceable
                  // "tw:opacity-60": notServiceable,
                  "tw:hidden": slabOnly && !hasSlab,
                })}
              >
                {seller.isConnectedSeller && (
                  <div className="tw:mb-1.5 tw:inline-flex tw:items-center tw:gap-1 tw:rounded-full tw:bg-primary/10 tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:text-primary tw:uppercase tw:tracking-wide">
                    Your connected seller
                  </div>
                )}

                {/* Header: seller name + distance chip */}
                <div className="tw:flex tw:items-start tw:justify-between tw:gap-2">
                  <div className="tw:flex-1 tw:min-w-0">
                    <div className="tw:flex tw:items-center tw:gap-2">
                      <h5
                        role="button"
                        tabIndex={0}
                        onClick={() => onSellerClick?.(seller)}
                        className={clsx({
                          "tw:font-semibold tw:text-sm tw:truncate tw:cursor-pointer": true,
                          "tw:text-primary hover:tw:underline":
                            !seller.isSkSeller,
                          "tw:text-foreground": seller.isSkSeller,
                        })}
                      >
                        {seller.name}
                      </h5>
                      <span className="tw:text-[11px] tw:text-muted-foreground tw:bg-background tw:flex tw:items-center tw:gap-0.5 tw:shrink-0 tw:border tw:border-border tw:px-1.5 tw:py-0.5 tw:rounded-full">
                        <MapPin className="tw:w-3 tw:h-3 tw:text-primary" />
                        {seller.distance?.toFixed(1) || 0} km
                      </span>
                    </div>
                    <div className="tw:mt-0.5 tw:text-xs tw:text-muted-foreground tw:truncate">
                      {seller.city} {seller.district} - {seller.pincode}
                    </div>
                  </div>

                  {hasSlab ? (
                    <KingSlabInfo slabs={seller.priceSlab.slab} size="xs" />
                  ) : null}
                </div>

                {/* Footer: price on the left, add-to-cart + stock on the right */}
                <div className="tw:mt-2.5 tw:flex tw:items-end tw:justify-between tw:gap-3">
                  <div className="tw:min-w-0">
                    {seller.b2bScheme?.status === "Running" ? (
                      <div className="tw:flex tw:flex-col">
                        <div className="tw:text-[10px] tw:font-bold tw:text-orange-600 tw:uppercase tw:flex tw:items-center tw:gap-1 tw:whitespace-nowrap">
                          <span className="tw:w-1.5 tw:h-1.5 tw:bg-orange-600 tw:rounded-full tw:animate-pulse"></span>
                          Scheme Price
                        </div>
                        <div className="tw:flex tw:items-center tw:gap-2">
                          <span className="tw:text-lg tw:font-bold tw:text-orange-600">
                            <Amount
                              value={seller.b2bScheme?.offerPrice || seller.price}
                            />
                          </span>
                          {seller.discountPercentage > 0 && (
                            <span className="tw:text-xs tw:font-bold tw:text-orange-600 tw:bg-orange-100 tw:px-1.5 tw:py-0.5 tw:rounded">
                              {seller.discountPercentage}% OFF
                            </span>
                          )}
                        </div>
                        <div className="tw:text-[10px] tw:text-muted-foreground tw:flex tw:gap-2 tw:mt-0.5">
                          <span className="tw:flex tw:items-center tw:gap-1">
                            MRP:
                            <span className="tw:line-through">
                              <Amount value={seller.mrp} />
                            </span>
                          </span>
                          <span className="tw:flex tw:items-center tw:gap-1">
                            B2B:
                            <span className="tw:font-medium tw:line-through">
                              <Amount value={seller.networkBasePrice} />
                            </span>
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="tw:flex tw:flex-col">
                        <div className="tw:text-[11px] tw:text-muted-foreground">
                          B2B Price
                        </div>
                        <div className="tw:flex tw:flex-row tw:items-center tw:gap-2">
                          {seller.price != null && (
                            <span className="tw:text-lg tw:font-bold tw:text-primary">
                              <Amount value={seller.price} />
                            </span>
                          )}
                          {seller.discountPercentage > 0 && (
                            <span className="tw:text-xs tw:text-muted-foreground tw:line-through">
                              <Amount value={seller.mrp} />
                            </span>
                          )}
                          {seller.discountPercentage > 0 && (
                            <span className="tw:text-xs tw:font-bold tw:text-orange-600 tw:bg-orange-100 tw:px-1.5 tw:py-0.5 tw:rounded">
                              {seller.discountPercentage}% OFF
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="tw:flex tw:flex-col tw:gap-1 tw:items-end tw:shrink-0">
                    {/* Allow purchase even when seller is not serviceable */}
                    {/* notServiceable */ false ? (
                      <div className="tw:flex tw:flex-col tw:items-end tw:gap-0.5">
                        <AppBadge variant="warning">Not serviceable</AppBadge>
                        <span className="tw:text-[10px] tw:text-muted-foreground tw:text-right">
                          Doesn't deliver to your location
                        </span>
                      </div>
                    ) : inStock ? (
                      <>
                        <SellerAddToCart
                          qty={seller.deal?.inCart?.qty || 0}
                          maxQty={seller.qty}
                          dealId={seller.deal?._id}
                          itemId={seller.deal?.itemId}
                          cartId={seller.deal?.cartId}
                          sellerId={seller.id}
                          callback={onAddToCart}
                          type={seller.deal?.inCart?.status ? 2 : 1}
                          dealRefId={seller.deal.id}
                          isSkSeller={seller.isSkSeller}
                          className="tw:h-6"
                          sellingType={seller.sellingType}
                          packageQty={seller.packageQty || 0}
                          selectedStockUom={(seller as any).selectedStockUom}
                        />
                        <div className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:font-medium tw:text-green-600">
                          In Stock:{" "}
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
                        </div>
                      </>
                    ) : (
                      <div className="tw:inline-block">
                        <AppBadge variant="danger">Out of stock</AppBadge>
                      </div>
                    )}
                  </div>
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
