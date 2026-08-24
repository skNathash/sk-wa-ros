import clsx from "clsx";
import { MapPin, Star } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import KingSlabInfo from "~/components/feature/products/king-slab/KingSlabInfo";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";
import CaseQtyPopover from "~/shared/catalog/components/CaseQtyPopover";
import SellerAddToCart from "~/shared/catalog/components/SellerAddToCart";
import SellingTypeDisplay from "~/shared/catalog/components/SellingTypeDsiplay";
import type { TableHeaderItem } from "~/types/CommonTypes";
import type { Deal, SellersArrayItem } from "~/types/CommonTypes";

type Props = {
  sellers: Array<SellersArrayItem & { deal: Deal }>;
  onAddToCart: (response: { action: string; data: any }) => void;
  onSellerClick: (seller: SellersArrayItem & { deal: Deal }) => void;
  slabOnly?: boolean;
  /** Lowest priced in-stock peer (non-SK) seller price, or null. */
  cheapestPrice: number | null;
};

const headers: TableHeaderItem[] = [
  { label: "Seller Info", key: "name", width: "32%" },
  { label: "MRP", key: "mrp", width: "10%", isRightAligned: true },
  { label: "Price", key: "price", width: "12%", isRightAligned: true },
  { label: "Discount", key: "discount", width: "10%", isCentered: true },
  { label: "Stock", key: "qty", width: "12%" },
  { label: "Distance", key: "distance", width: "9%" },
  { label: "Action", key: "action", width: "15%", isRightAligned: true },
];

const SellersTable = ({
  sellers,
  onAddToCart,
  onSellerClick,
  slabOnly,
  cheapestPrice,
}: Props) => {
  const visible = slabOnly
    ? sellers.filter((s) => s.priceSlab?.isAvailable && s.priceSlab?.configId)
    : sellers;

  // No `container` here — the parent already scrolls vertically, and the sticky
  // header latches onto it. This wrapper only handles horizontal overflow.
  return (
    <div className="tw:overflow-x-auto thin-scrollbar">
      <AppTable size="sm" stickyHeader condensed minWidth="820px">
        <AppTable.Header>
          <TableHeader headers={headers} />
        </AppTable.Header>
        <AppTable.Body>
          {visible.length > 0 ? (
            visible.map((seller, index) => {
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
              const initial = (seller.name || "?")
                .trim()
                .charAt(0)
                .toUpperCase();

              return (
                <AppTable.Row
                  key={seller.id || index}
                  className={clsx({
                    "tw:bg-primary/5": hasSlab,
                    "tw:bg-primary/10": inCart && !hasSlab,
                  })}
                >
                  {/* Seller info */}
                  <AppTable.Cell>
                    <div className="tw:flex tw:items-center tw:gap-2">
                      <div className="tw:shrink-0 tw:w-8 tw:h-8 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:text-xs tw:font-bold tw:bg-primary/10 tw:text-primary">
                        {initial}
                      </div>
                      <div className="tw:min-w-0">
                        <div className="tw:flex tw:items-center tw:gap-1.5">
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={() => onSellerClick?.(seller)}
                            className={clsx({
                              "tw:font-semibold tw:text-sm tw:truncate tw:cursor-pointer": true,
                              "tw:text-foreground hover:tw:underline":
                                !seller.isSkSeller,
                              "tw:text-primary": seller.isSkSeller,
                            })}
                          >
                            {seller.name}
                          </span>
                          {isCheapest && (
                            <AppBadge variant="success" className="tw:shrink-0">
                              Cheapest
                            </AppBadge>
                          )}
                        </div>
                        <div className="tw:mt-0.5 tw:flex tw:items-center tw:gap-1.5 tw:text-[11px] tw:text-muted-foreground tw:flex-wrap">
                          {seller.isConnectedSeller && (
                            <span className="tw:font-semibold tw:text-primary tw:uppercase tw:tracking-wide">
                              Connected
                            </span>
                          )}
                          {rating != null && (
                            <span className="tw:inline-flex tw:items-center tw:gap-0.5 tw:text-amber-600 tw:font-medium">
                              <Star className="tw:w-3 tw:h-3 tw:fill-amber-500 tw:text-amber-500" />
                              {rating.toFixed(1)}
                            </span>
                          )}
                          {hasScheme && (
                            <span className="tw:font-bold tw:text-orange-600 tw:uppercase">
                              Scheme
                            </span>
                          )}
                          {hasSlab && seller.priceSlab ? (
                            <KingSlabInfo
                              slabs={seller.priceSlab.slab}
                              size="xs"
                            />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </AppTable.Cell>

                  {/* MRP */}
                  <AppTable.Cell className="tw:text-right">
                    {seller.mrp != null ? (
                      <span
                        className={clsx({
                          "tw:text-xs tw:text-muted-foreground": true,
                          "tw:line-through": sellerDiscount > 0,
                        })}
                      >
                        <Amount value={seller.mrp} />
                      </span>
                    ) : (
                      <span className="tw:text-xs tw:text-muted-foreground">
                        -
                      </span>
                    )}
                  </AppTable.Cell>

                  {/* Price */}
                  <AppTable.Cell className="tw:text-right">
                    <div
                      className={clsx({
                        "tw:text-sm tw:font-bold tw:leading-tight": true,
                        "tw:text-emerald-600": isCheapest,
                        "tw:text-orange-600": hasScheme && !isCheapest,
                        "tw:text-foreground": !isCheapest && !hasScheme,
                      })}
                    >
                      <Amount value={effectivePrice} />
                    </div>
                  </AppTable.Cell>

                  {/* Discount */}
                  <AppTable.Cell className="tw:text-center">
                    {sellerDiscount > 0 ? (
                      <span className="tw:text-xs tw:font-bold tw:text-orange-600 tw:bg-orange-100 tw:px-1.5 tw:py-0.5 tw:rounded">
                        {sellerDiscount}% OFF
                      </span>
                    ) : (
                      <span className="tw:text-xs tw:text-muted-foreground">
                        -
                      </span>
                    )}
                  </AppTable.Cell>

                  {/* Stock */}
                  <AppTable.Cell>
                    {inStock ? (
                      <span className="tw:text-xs tw:text-emerald-600 tw:font-medium tw:inline-flex tw:items-center tw:gap-0.5">
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
                    ) : (
                      <AppBadge variant="danger">Out of stock</AppBadge>
                    )}
                  </AppTable.Cell>

                  {/* Distance */}
                  <AppTable.Cell>
                    <span className="tw:inline-flex tw:items-center tw:gap-0.5 tw:text-xs tw:text-muted-foreground">
                      <MapPin className="tw:w-3 tw:h-3 tw:text-primary" />
                      {seller.distance?.toFixed(1) || 0} km
                    </span>
                  </AppTable.Cell>

                  {/* Action */}
                  <AppTable.Cell>
                    <div className="tw:flex tw:justify-end">
                      {inStock ? (
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
                          className="tw:h-7"
                          sellingType={seller.sellingType}
                          packageQty={seller.packageQty || 0}
                          selectedStockUom={(seller as any).selectedStockUom}
                        />
                      ) : (
                        <span className="tw:text-xs tw:text-muted-foreground">
                          Unavailable
                        </span>
                      )}
                    </div>
                  </AppTable.Cell>
                </AppTable.Row>
              );
            })
          ) : (
            <AppTable.Row>
              <AppTable.Cell
                colSpan={headers.length}
                className="tw:text-center"
              >
                <span className="tw:text-muted-foreground tw:text-sm">
                  No sellers available
                </span>
              </AppTable.Cell>
            </AppTable.Row>
          )}
        </AppTable.Body>
      </AppTable>
    </div>
  );
};

export default SellersTable;
