import { CheckCheck, Trash2 } from "lucide-react";
import React, { useState } from "react";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import ImgRender from "~/components/core/img/ImgRender";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";
import KingSlabInfo from "~/components/feature/products/king-slab/KingSlabInfo";
import PosAddToCart from "~/routes/pos/billing/components/add-to-cart/PosAddToCart";
import PosB2bAddToCart from "~/routes/pos/billing/components/add-to-cart/PosB2bAddToCart";
import AuthService from "~/services/AuthService";
import SellerCatalogService from "~/services/SellerCatalogService";
import UomPriceService from "~/services/UomPriceService";
import SellingTypeDisplay from "~/shared/catalog/components/SellingTypeDsiplay";
import DisplayPrice from "~/shared/products/display-price/DisplayPrice";
import type { CartItemProps } from "./CartItem";
import MrpSplitInfo from "./MrpSplitInfo";

const EDIT_PRICE_ROLES = ["PRICE MANAGEMENT.POS-CART-PRICE-EDIT"];

/* Deterministic avatar tints, the way WhatsApp colours a contact with no photo:
   picked by a stable hash of the product name so the same product always keeps
   the same tile down the thread. */
const AVATAR_TONES = [
  "tw:bg-sky-600",
  "tw:bg-teal-600",
  "tw:bg-indigo-500",
  "tw:bg-amber-600",
  "tw:bg-rose-500",
  "tw:bg-emerald-600",
];

/**
 * Chat-bubble line item — the theme-2 (WhatsApp) reading of a cart row.
 *
 * Same data and the same interactive parts as `CartItem` (stepper, price edit,
 * MRP split, slab info); only the arrangement changes: the product reads as an
 * outgoing message — avatar, name, a single "₹28 × 2 · GST 5%" meta line, the
 * stepper and the line total facing each other, and a sent-at footer with read
 * ticks.
 */
const CartItemBubble: React.FC<CartItemProps> = ({
  data,
  cartId,
  callback,
  index,
  removingIndex,
  type,
  quickCheckout,
  assisted,
}) => {
  const slab =
    data?.isPriceSlab && data?.priceSlab?.slab?.length > 0
      ? data.priceSlab?.slab
      : [];

  const formattedSlabs = SellerCatalogService.formatPriceSlab({
    isActive: true,
    slab,
  });

  const isB2b = ((type || "") as string).toLowerCase() === "b2b";
  const isScheme =
    type === "b2b" && data.discountInfo?.discountType === "OfferOfTheDay";
  const unitPrice = Number(data.purchasePrice) || 0;
  const qty = Number(data.quantity) || 0;
  const total = unitPrice * qty;
  const baseUom = UomPriceService.getBaseUom(data.selectedStockUom);
  const amountDecimals = baseUom ? 3 : 2;
  // Only fall back to selectedStockUom when the pack type is Unit/empty;
  // a real pack (Case/Inner Case/Ladi) shows its pack label instead.
  const isRealPack = !!data.sellingType && data.sellingType !== "UNIT";
  const removing = removingIndex === index;
  // Checked directly rather than through <Rbac>: the permission decides which
  // of two readings the price gets, not whether a block renders.
  const canEditPrice = AuthService.isRbacEnabled(EDIT_PRICE_ROLES);

  const name = data.deal?.name || "";
  const initials =
    name
      .split(/\s+/)
      .filter((word: string) => /^[a-zA-Z]/.test(word))
      .slice(0, 3)
      .map((word: string) => word[0])
      .join("")
      .toUpperCase() || "SK";
  let tone = 0;
  for (let i = 0; i < name.length; i++) tone += name.charCodeAt(i);
  const avatarTone = AVATAR_TONES[tone % AVATAR_TONES.length];

  // The name holds one line so every bubble is the same height down the
  // thread; tapping it opens the full name, tapping again folds it back.
  const [nameOpen, setNameOpen] = useState(false);

  return (
    <div
      className={`app-cart-bubble tw:relative tw:px-2 tw:py-1.5 ${
        removing ? "tw:opacity-60" : ""
      }`}
    >
      <div className="tw:flex tw:items-start tw:gap-2">
        <div className="tw:w-9 tw:h-9 tw:relative tw:shrink-0">
          <div className="tw:w-full tw:h-full tw:rounded-lg tw:overflow-hidden">
            <ImgRender
              assetId={data.images?.[0]}
              className="tw:w-full tw:h-full tw:object-cover"
              size="200x200"
              fallback={
                <div
                  className={`tw:w-full tw:h-full tw:flex tw:items-center tw:justify-center tw:text-white tw:text-[10px] tw:font-semibold tw:tracking-tight ${avatarTone}`}
                >
                  {initials}
                </div>
              }
            />
          </div>
          {data.discountPerc > 0 && (
            <span className="tw:absolute tw:-top-1 tw:-left-1 tw:z-[1] tw:bg-rose-500 tw:text-white tw:text-[9px] tw:font-semibold tw:px-1 tw:py-0.5 tw:rounded-md tw:leading-none tw:shadow-sm">
              -{data.discountPerc}%
            </span>
          )}
        </div>

        <div className="tw:flex-1 tw:min-w-0">
          <button
            type="button"
            onClick={() => setNameOpen((open) => !open)}
            title={name}
            className={`app-cart-bubble-name tw:block tw:w-full tw:text-left tw:text-[13px] tw:font-medium tw:leading-tight tw:pr-5 tw:cursor-pointer ${
              nameOpen ? "" : "tw:truncate"
            }`}
          >
            {name}
          </button>

          {/* One meta line, the way a chat message carries its detail: unit
              price × quantity, then the tax and any struck-through MRP. */}
          <div className="app-cart-bubble-meta tw:mt-0.5 tw:flex tw:items-center tw:flex-wrap tw:gap-x-1.5 tw:gap-y-0.5 tw:text-[11px] tw:leading-tight">
            <span className="tw:flex tw:items-center tw:gap-1">
              {/* The unit price is its own edit affordance: a dotted underline
                  marks it as changeable, which spends no room on the bubble the
                  way a separate Edit Price link did. Plain text without the
                  permission. Only the quantity carries weight on this line —
                  it is the one number the stepper changes. */}
              {canEditPrice ? (
                <button
                  type="button"
                  title="Edit price"
                  onClick={() => callback({ action: "editPrice", data, index })}
                  className="app-cart-bubble-price tw:cursor-pointer"
                >
                  <DisplayPrice price={unitPrice} uom={data.selectedStockUom} />
                </button>
              ) : (
                <DisplayPrice price={unitPrice} uom={data.selectedStockUom} />
              )}
              <span className="tw:opacity-60">×</span>
              <span className="tw:font-medium">
                <DisplayQty
                  qty={qty}
                  isLooseQty={false}
                  uom={isRealPack ? undefined : data.selectedStockUom}
                  hideDefaultUom={isRealPack}
                />
                {isRealPack && (
                  <span className="tw:ml-0.5 tw:lowercase">
                    <SellingTypeDisplay sellingType={data.sellingType} />
                  </span>
                )}
              </span>
            </span>
            {data.gstPerc > 0 && (
              <span className="app-cart-bubble-dim">· GST {data.gstPerc}%</span>
            )}
            {data.mrp > 0 && data.mrp !== unitPrice && (
              <span className="app-cart-bubble-dim tw:line-through">
                <DisplayPrice price={data.mrp} uom={data.selectedStockUom} />
              </span>
            )}
            {baseUom && (
              <span className="app-cart-bubble-dim">
                (<Amount value={unitPrice} decimalPlaces={amountDecimals} />/
                {baseUom})
              </span>
            )}
            {isScheme && (
              <span className="tw:text-[9px] tw:font-medium tw:uppercase tw:tracking-wide tw:text-orange-700 tw:bg-orange-100 tw:rounded-full tw:px-1.5 tw:py-0.5 tw:leading-none">
                Scheme
              </span>
            )}
            {typeof data.overridePrice === "number" && (
              <span className="tw:text-[9px] tw:font-medium tw:uppercase tw:tracking-wide tw:text-amber-700 tw:bg-amber-100 tw:rounded-full tw:px-1.5 tw:py-0.5 tw:leading-none">
                Price Modified
              </span>
            )}
          </div>
        </div>

        {/* Remove sits in the bubble's corner rather than on the line: it is the
            one destructive action here and shouldn't compete with the stepper. */}
        <button
          type="button"
          aria-label="Remove"
          onClick={() =>
            callback && callback({ action: "remove", data, index })
          }
          disabled={removing}
          className="app-cart-bubble-remove tw:absolute tw:top-1 tw:right-1 tw:p-1 tw:rounded-full tw:cursor-pointer tw:transition-colors"
        >
          {removing ? (
            <span className="tw:block tw:w-3 tw:h-3 tw:border-2 tw:border-current tw:border-t-transparent tw:rounded-full tw:animate-spin" />
          ) : (
            <Trash2 size={13} />
          )}
        </button>
      </div>

      {/* Stepper and line total face each other — the two things a biller
          actually touches on a row. */}
      <div className="tw:mt-1.5 tw:flex tw:items-center tw:justify-between tw:gap-2">
        <div className="app-cart-bubble-qty">
          {isB2b && !quickCheckout ? (
            <PosB2bAddToCart
              template={2}
              qty={data.quantity}
              maxQty={data.availableStock || 0}
              minQty={data.deal?.minQty}
              incrQty={data.deal?.incrQty}
              dealId={data.deal.id}
              itemId={data.itemId}
              cartId={cartId}
              callback={() => {
                callback({ action: "qtyChange", data: data.quantity, index });
              }}
              className="tw:bg-white"
              sellingType={data.sellingType || "UNIT"}
              packageQty={data.packageQty || 0}
              selectedStockUom={data.selectedStockUom}
            />
          ) : (
            <PosAddToCart
              template={2}
              qty={data.quantity}
              maxQty={data.availableStock || 0}
              dealId={data.deal.id}
              cartId={cartId}
              snapshots={data.snapshots}
              callback={() => {
                callback({ action: "qtyChange", data: data.quantity, index });
              }}
              customerType={type}
              quickCheckout={quickCheckout}
              overridePrice={data.overridePrice}
              purchasePrice={data.purchasePrice}
              assisted={assisted}
              selectedStockUom={data.selectedStockUom}
            />
          )}
        </div>

        <Amount
          value={total}
          decimalPlaces={amountDecimals}
          className="app-cart-bubble-total tw:text-[15px] tw:font-semibold tw:tracking-tight"
        />
      </div>

      {/* Message footer: the secondary controls sit where a chat bubble keeps
          its status line, so the row above stays clean. */}
      <div className="tw:mt-0.5 tw:flex tw:items-center tw:justify-between tw:gap-2">
        <div className="app-cart-bubble-dim tw:flex tw:items-center tw:gap-1.5 tw:text-[10px] tw:min-w-0">
          <MrpSplitInfo snapshots={data.snapshots} />
          {formattedSlabs?.slab?.length > 0 ? (
            <KingSlabInfo slabs={formattedSlabs?.slab || []} size="xs" />
          ) : null}
          {isB2b && !quickCheckout && (
            <span className="tw:truncate">
              Stock{" "}
              <DisplayQty
                qty={data.availableStock}
                isLooseQty={false}
                uom={
                  data.selectedStockUom !== "unit" ? data.selectedStockUom : ""
                }
                hideDefaultUom={true}
              />
            </span>
          )}
        </div>

        <div className="app-cart-bubble-stamp tw:flex tw:items-center tw:gap-1 tw:text-[10px] tw:shrink-0">
          <DateFormat value={data.addedAt} formatStr="h:mm a" />
          <CheckCheck size={12} className="tw:text-sky-500" />
        </div>
      </div>
    </div>
  );
};

export default CartItemBubble;
