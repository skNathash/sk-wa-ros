import clsx from "clsx";
import { Plus } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import ImgRender from "~/components/core/img/ImgRender";
import { AppTable, TableHeader, TableSkeletonLoader } from "~/components/core/table";
import SellerAddToCart from "~/shared/catalog/components/SellerAddToCart";
import type { SellerDeal, TableHeaderItem } from "~/types/CommonTypes";

interface DesktopViewProps {
  data: SellerDeal[];
  loading?: boolean;
  /**
   * Seller id for the add-to-cart action. Defaults to the deal's own
   * `buyFromOtherRetailer.retailerId`; pass it when the deal shape doesn't
   * carry it (the seller-deal listing on the retailer detail page doesn't).
   */
  sellerId?: string;
  hideAddToCart?: boolean;
  /** Same contract as ProductRowCard: "buy" | "price-slab" | cart events. */
  callback?: (data: { action: string; data?: any }) => void;
}

// Percentage widths + `fixedLayout` on the table: the columns always add up to
// the container, so the whole row fits the viewport and the long item names
// truncate instead of pushing the price/reorder columns off-screen.
const headers: TableHeaderItem[] = [
  { label: "Item · Pack", key: "name", width: "34%" },
  { label: "Brand · Cat", key: "brand", width: "18%" },
  {
    label: "Seller price · MRP",
    key: "price",
    width: "14%",
    isRightAligned: true,
  },
  { label: "Stock", key: "minQty", width: "12%", isRightAligned: true },
  { label: "Terms", key: "terms", width: "9%" },
  { label: "Reorder", key: "reorder", width: "13%", isRightAligned: true },
];

/** Tile colours for the SKU thumb — stable per deal name, not per position. */
const TILE_COLORS = [
  "tw:bg-amber-500",
  "tw:bg-yellow-400",
  "tw:bg-rose-500",
  "tw:bg-green-500",
  "tw:bg-teal-600",
  "tw:bg-sky-500",
  "tw:bg-violet-500",
];

const getTileColor = (name?: string) => {
  const key = (name || "").trim();
  if (!key) return TILE_COLORS[0];
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash + key.charCodeAt(i)) % TILE_COLORS.length;
  }
  return TILE_COLORS[hash];
};

/** Units the network buys per month — the 90-day figure averaged over 3. */
const getMonthlyRate = (deal: any): number => {
  const last90 = Number(deal?.salesAnalytics?.last90Days?.quantity) || 0;
  return Math.round(last90 / 3);
};

/**
 * Trade terms carried on the deal itself. PayLater/delivery windows are a
 * seller-level relationship and aren't part of the seller-deal payload, so the
 * column shows only what the deal actually states.
 */
const getTerms = (deal: any): { label: string; className: string }[] => {
  const terms: { label: string; className: string }[] = [];

  if (deal?.priceSlabs?.length) {
    terms.push({
      label: "Slab",
      className: "tw:bg-violet-50 tw:text-violet-600",
    });
  }
  if (deal?.isPromotionalDeal) {
    terms.push({ label: "Promo", className: "tw:bg-amber-50 tw:text-amber-700" });
  }
  if (deal?.consumerOffer?.enabled) {
    terms.push({
      label: "Offer",
      className: "tw:bg-emerald-50 tw:text-emerald-700",
    });
  }

  return terms;
};

const brandLabel = (deal: SellerDeal) => {
  const name =
    deal.companyName || deal.brand?._displayName || deal.brand?.name || "";
  // Placeholder brand codes ("111", "00000") come through on some catalog
  // data; only treat the value as a displayable brand if it has letters.
  return /[a-z]/i.test(name) ? name : "";
};

/**
 * Desktop (md and up) presentation of the seller's catalog: one dense table row
 * per SKU — item, brand/category, buy price against MRP, order rules and the
 * inline reorder action. The mobile breakpoint keeps the ProductRowCard list.
 */
const DesktopView = ({
  data,
  loading = false,
  sellerId,
  hideAddToCart = false,
  callback,
}: DesktopViewProps) => {
  return (
    <div className="tw:overflow-hidden tw:rounded-2xl tw:bg-white tw:shadow-sm tw:ring-1 tw:ring-slate-200/70">
      <AppTable size="sm" condensed fixedLayout minWidth="100%">
        <AppTable.Header>
          <TableHeader
            headers={headers}
            className="tw:[&_th]:text-[10px] tw:[&_th]:font-semibold tw:[&_th]:uppercase tw:[&_th]:tracking-wider tw:[&_th]:text-slate-500"
          />
        </AppTable.Header>
        <AppTable.Body>
          {loading ? (
            <TableSkeletonLoader cols={headers.length} rows={10} />
          ) : (
            data.map((deal) => {
              const brand = brandLabel(deal);
              const monthly = getMonthlyRate(deal);
              const discount = Math.round(Number(deal.discount) || 0);
              const moq = deal.minQty || 0;
              const sellerCount = deal.totalSellers ?? deal.sellers?.length ?? 0;
              const terms = getTerms(deal);

              return (
                <AppTable.Row key={deal._id}>
                  {/* Item · pack */}
                  <AppTable.Cell>
                    <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-3">
                      <div
                        className={clsx(
                          "tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-lg tw:text-[10px] tw:font-bold tw:tracking-wide tw:text-white",
                          getTileColor(deal.name),
                          deal.isOutOfStock && "tw:opacity-50 tw:grayscale",
                        )}
                      >
                        <ImgRender
                          assetId={deal.images?.[0]}
                          alt={deal.name}
                          className="tw:h-10 tw:w-10 tw:object-contain"
                          fallback={<span>SKU</span>}
                        />
                      </div>

                      <div className="tw:min-w-0">
                        {/* Badges sit inline inside the clamped paragraph so a
                            long name wraps to two lines and the chip follows
                            the last word instead of pinning to the first. */}
                        <p className="tw:line-clamp-2 tw:text-[13px] tw:font-medium tw:leading-snug tw:text-slate-800">
                          {deal.name}
                          {deal.movementType?.toLowerCase() === "fast moving" ? (
                            <span className="tw:ml-1.5 tw:inline-block tw:rounded tw:bg-emerald-600 tw:px-1.5 tw:py-0.5 tw:align-middle tw:text-[9px] tw:font-bold tw:uppercase tw:tracking-wide tw:text-white">
                              Best
                            </span>
                          ) : null}
                          {deal.isPromotionalDeal ? (
                            <span className="tw:ml-1.5 tw:inline-block tw:rounded tw:bg-violet-100 tw:px-1.5 tw:py-0.5 tw:align-middle tw:text-[9px] tw:font-bold tw:uppercase tw:tracking-wide tw:text-violet-700">
                              Exclusive
                            </span>
                          ) : null}
                        </p>
                        <p className="tw:mt-0.5 tw:flex tw:flex-wrap tw:items-center tw:gap-x-1 tw:text-[11px] tw:text-slate-400">
                          <span>
                            MRP <Amount value={deal.mrp} decimalPlaces={0} />
                          </span>
                          {monthly > 0 ? (
                            <>
                              <span>·</span>
                              <span>sold {monthly}/mo</span>
                            </>
                          ) : null}
                        </p>
                      </div>
                    </div>
                  </AppTable.Cell>

                  {/* Brand · category */}
                  <AppTable.Cell>
                    {brand ? (
                      <p className="tw:truncate tw:text-[13px] tw:font-medium tw:text-slate-800">
                        {brand}
                      </p>
                    ) : null}
                    <p className="tw:truncate tw:text-[11px] tw:text-slate-400">
                      {deal.category?._displayName || deal.category?.name || "—"}
                    </p>
                  </AppTable.Cell>

                  {/* Seller price · MRP */}
                  <AppTable.Cell className="tw:text-right">
                    <Amount
                      value={deal.displayPrice ?? deal.price}
                      className="tw:text-sm tw:font-bold tw:text-emerald-700"
                    />
                    <p className="tw:mt-0.5 tw:flex tw:items-center tw:justify-end tw:gap-1 tw:text-[11px] tw:text-slate-400">
                      <Amount
                        value={deal.mrp}
                        decimalPlaces={0}
                        className="tw:line-through"
                      />
                      {discount > 0 ? (
                        <>
                          <span>·</span>
                          <span>−{discount}%</span>
                        </>
                      ) : null}
                    </p>
                  </AppTable.Cell>

                  {/* Stock */}
                  <AppTable.Cell className="tw:text-right">
                    <p className="tw:text-[13px] tw:font-bold tw:text-slate-900">
                      {deal.maxQty > 0 ? deal.maxQty : "—"}
                    </p>
                    <p className="tw:mt-0.5 tw:text-[11px] tw:text-slate-400">
                      {deal.maxQty > 0 ? "in stock" : "Out of stock"}
                    </p>
                  </AppTable.Cell>

                  {/* Terms */}
                  <AppTable.Cell>
                    <div className="tw:flex tw:flex-wrap tw:gap-1">
                      {terms.length ? (
                        terms.map((term) => (
                          <span
                            key={term.label}
                            className={clsx(
                              "tw:rounded tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide",
                              term.className,
                            )}
                          >
                            {term.label}
                          </span>
                        ))
                      ) : (
                        <span className="tw:text-[11px] tw:text-slate-300">
                          —
                        </span>
                      )}
                    </div>
                  </AppTable.Cell>

                  {/* Reorder */}
                  <AppTable.Cell className="tw:text-right">
                    <div className="tw:flex tw:justify-end">
                      {hideAddToCart ? null : deal.isOutOfStock &&
                        sellerCount > 0 ? (
                        // Own stock is exhausted but other sellers carry the
                        // SKU — hand off to the seller picker in the detail
                        // modal instead of adding directly.
                        <AppButton
                          onClick={() =>
                            callback?.({ action: "buy", data: deal._id })
                          }
                          size="small"
                          className="tw:rounded-lg tw:px-3"
                        >
                          <Plus size={14} strokeWidth={2.5} />
                          Add
                        </AppButton>
                      ) : !deal.isOutOfStock ? (
                        <SellerAddToCart
                          qty={deal.inCart?.qty || 0}
                          maxQty={deal.maxQty || 0}
                          dealId={deal._id}
                          dealRefId={deal.id}
                          itemId={deal.itemId}
                          cartId={deal.cartId}
                          sellerId={
                            sellerId ?? deal.buyFromOtherRetailer?.retailerId
                          }
                          type={deal.inCart?.status ? 2 : undefined}
                          callback={(e) => callback?.(e)}
                          sellingType={deal.sellingType}
                          packageQty={deal.packageQty}
                          selectedStockUom={deal.selectedStockUom}
                          className="tw:rounded-lg tw:px-3"
                        >
                          <span className="tw:flex tw:items-center tw:gap-1">
                            <Plus size={14} strokeWidth={2.5} />
                            Add{moq > 0 ? ` ${moq}` : ""}
                          </span>
                        </SellerAddToCart>
                      ) : (
                        <span className="tw:rounded-full tw:bg-slate-100 tw:px-2.5 tw:py-1 tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-slate-400">
                          Out of stock
                        </span>
                      )}
                    </div>
                  </AppTable.Cell>
                </AppTable.Row>
              );
            })
          )}
        </AppTable.Body>
      </AppTable>
    </div>
  );
};

export default DesktopView;
export type { DesktopViewProps };
