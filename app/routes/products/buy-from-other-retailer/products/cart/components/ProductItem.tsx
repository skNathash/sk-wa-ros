import { X } from "lucide-react";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import ImgRender from "~/components/core/img/ImgRender";
import KingSlabInfo from "~/components/feature/products/king-slab/KingSlabInfo";
import SellerCatalogService from "~/services/SellerCatalogService";
import CaseQtyPopover from "~/shared/catalog/components/CaseQtyPopover";
import SellerAddToCart from "~/shared/catalog/components/SellerAddToCart";
import SellingTypeDisplay from "~/shared/catalog/components/SellingTypeDsiplay";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";

interface ProductItemProps {
  item: {
    deal: {
      id: string;
      refId: string;
      name: string;
      type: string;
    };
    category: {
      id: string;
      categoryId: string;
      name: string;
    };
    brand: {
      id: string;
      brandId: string;
      name: string;
    };
    weight: {
      unit: string;
    };
    itemId: string;
    hsn: string;
    tax: number;
    images: string[];
    isCustomerRequestedItem: boolean;
    quantity: number;
    mrp: number;
    purchasePrice: number;
    availableStock: number;
    uom: string;
    isConsumerOffer: boolean;
    _id: string;
    snapshots: any[];
    priceSlab?: any;
    discountPerc?: number;
    packageQty: number;
    actualQuantity?: number;
    sellingType: string;
    selectedStockUom?: string;
    basePrice?: number;
    discountInfo?: {
      discountType?: string;
    };
  };
  selected?: boolean;
  callback: (a: { action: string; data: any }) => void;
  sellerId: string;
  cartId?: string;
}

const ProductItem: React.FC<ProductItemProps> = ({
  item,
  callback,
  cartId,
  sellerId,
}) => {
  const handleRemove = () => {
    callback({ action: "remove", data: item });
  };

  const getFormattedSlabs = () => {
    const raw = item.priceSlab || null;
    if (!raw) return [];

    return SellerCatalogService.formatPriceSlab(raw).slab || [];
  };

  const formattedSlabs = getFormattedSlabs();
  const isScheme = item.discountInfo?.discountType === "OfferOfTheDay";
  const uom = item.selectedStockUom;
  const isOutOfStock = !item.availableStock || item.availableStock <= 0;
  const hasSavings = item.mrp !== item.purchasePrice;
  const lineTotal =
    item.purchasePrice * (item.actualQuantity ?? item.quantity ?? 0);

  /* Struck-through reference prices (MRP, B2B) share one muted treatment so the
     payable price is the only figure competing for attention. */
  const refPrice = "tw:text-[11px] tw:leading-4 tw:text-gray-400";

  /* One flush row: tile, then everything the item is, then the stepper and what
     the line comes to. The ✕ is parked in the right margin (the row reserves
     `pr-9` for it) so it can't push the money column around, and so it stays
     out of the reading order of the figures. */
  return (
    <div className="tw:group tw:relative tw:bg-white tw:px-3 tw:pr-9 tw:py-3.5 tw:md:px-4 tw:md:pr-10 tw:md:py-3 tw:border-b tw:border-gray-100 tw:last:border-b-0 tw:transition-colors tw:hover:bg-gray-50/70">
      <button
        type="button"
        onClick={handleRemove}
        className="tw:absolute tw:right-1.5 tw:top-1/2 tw:-translate-y-1/2 tw:flex tw:h-7 tw:w-7 tw:items-center tw:justify-center tw:rounded-md tw:text-gray-300 tw:transition-colors tw:cursor-pointer tw:hover:bg-red-50 tw:hover:text-red-600 tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-red-500/40"
        aria-label={`Remove ${item.deal.name} from cart`}
      >
        <X size={16} strokeWidth={2.25} />
      </button>

      <div className="tw:flex tw:flex-nowrap tw:md:flex-wrap tw:items-center tw:gap-x-3 tw:gap-y-2">
        {/* Product image: contained on a neutral tile so packaged goods and the
            placeholder read at the same size instead of being cropped. */}
        <div className="tw:shrink-0 tw:w-12 tw:h-12 tw:rounded-lg tw:border tw:border-gray-200 tw:bg-slate-50 tw:flex tw:items-center tw:justify-center tw:overflow-hidden">
          {item.images.length > 0 ? (
            <ImgRender
              assetId={item.images[0]}
              alt={item.deal.name}
              className="tw:w-full tw:h-full tw:object-contain tw:p-0.5"
            />
          ) : (
            <span className="tw:text-[9px] tw:leading-tight tw:text-gray-400 tw:text-center">
              No
              <br />
              Image
            </span>
          )}
        </div>

        {/* Product Details. `min-w-48` is what makes the row responsive without
            a breakpoint: once the name can't hold that width the stepper and
            total wrap to their own line beneath it. */}
        <div className="tw:flex-1 tw:min-w-0 tw:md:min-w-48">
          <h3 className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:leading-snug tw:line-clamp-2">
            {item.deal.name}
          </h3>

          {/* Everything the item is, on one muted line: ID · Stock · Slabs ·
              unit price · references. Wrapped segments stay grouped (the price
              and its struck references never split across lines) and the line
              height is loosened so a two- or three-line wrap on a phone reads as
              separate facts rather than a block of text. The unit price sits
              here rather than in a block of its own — the figure that deserves
              weight in a cart row is what the line costs, and that lives on the
              right. */}
          <div className="tw:mt-1.5 tw:flex tw:flex-wrap tw:items-center tw:gap-x-1.5 tw:gap-y-1.5 tw:text-[11px] tw:leading-4 tw:text-gray-500">
            <span className="tw:tabular-nums">ID: {item.deal.refId}</span>

            <span className="tw:text-gray-300">·</span>
            <span
              className={`tw:inline-flex tw:items-center tw:gap-1 ${
                isOutOfStock ? "tw:font-medium tw:text-red-600" : ""
              }`}
            >
              Stock:
              <DisplayQty
                qty={item.availableStock}
                isLooseQty={false}
                uom={uom != "unit" ? uom : ""}
                hideDefaultUom={true}
              />
              {uom == "unit" && (
                <SellingTypeDisplay sellingType={item.sellingType} />
              )}
              <CaseQtyPopover
                packageQty={item.packageQty || 0}
                sellingType={item.sellingType}
              />
            </span>

            {formattedSlabs && formattedSlabs.length > 0 && (
              <KingSlabInfo slabs={formattedSlabs} size="xs" />
            )}

            <span className="tw:text-gray-300">·</span>

            {/* The price and everything qualifying it travel together, so a wrap
                never orphans "MRP ₹44,490" onto a line of its own. */}
            <span className="tw:inline-flex tw:flex-wrap tw:items-center tw:gap-x-1.5 tw:gap-y-1">
              {isScheme && (
                <span className="tw:rounded tw:bg-orange-100 tw:px-1.5 tw:py-0.5 tw:text-[9px] tw:font-bold tw:uppercase tw:leading-none tw:tracking-tight tw:text-orange-700">
                  Scheme
                </span>
              )}
              <span
                className={`tw:font-semibold tw:tabular-nums ${
                  isScheme ? "tw:text-orange-700" : "tw:text-gray-700"
                }`}
              >
                <Amount value={item.purchasePrice} />
                {uom ? `/${uom}` : ""}
              </span>

              {!isScheme && hasSavings && (item.discountPerc ?? 0) > 0 && (
                <span className="tw:font-semibold tw:text-rose-600">
                  {item.discountPerc}% OFF
                </span>
              )}

              {/* Reference prices, struck and last — they only qualify the price
                  that precedes them. */}
              {hasSavings && (
                <span className={refPrice}>
                  MRP{" "}
                  <span className="tw:line-through tw:tabular-nums">
                    <Amount value={item.mrp} decimalPlaces={2} />
                  </span>
                </span>
              )}
              {isScheme && (
                <span className={refPrice}>
                  B2B{" "}
                  <span className="tw:line-through tw:tabular-nums">
                    <Amount value={item.basePrice || 0} decimalPlaces={2} />
                  </span>
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Stepper and what the line comes to, as one right-hand money column.
            On phones they stack — stepper over line total — so the column stays
            on the same row as the name and the price/stock line instead of
            wrapping under it; from md up there's room for them side by side. */}
        <div className="tw:ml-auto tw:flex tw:shrink-0 tw:flex-col tw:items-end tw:gap-2 tw:md:flex-row tw:md:items-center tw:md:gap-3">
          <SellerAddToCart
            qty={item.quantity}
            maxQty={item.availableStock}
            dealId={item.deal.id}
            itemId={item.itemId}
            cartId={cartId}
            sellerId={sellerId}
            type={2}
            callback={callback}
            dealRefId={item.deal.refId}
            sellingType={item.sellingType}
            packageQty={item.packageQty || 0}
            selectedStockUom={item.selectedStockUom}
          />

          <Amount
            value={lineTotal}
            className="tw:min-w-16 tw:text-right tw:text-[15px] tw:font-bold tw:text-gray-900 tw:tabular-nums"
          />
        </div>
      </div>
    </div>
  );
};

export default ProductItem;
