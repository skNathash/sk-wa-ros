import { Pencil, Trash2 } from "lucide-react";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import DisplayPrice from "~/shared/products/display-price/DisplayPrice";
import AppButton from "~/components/core/button/AppButton";
import PosAddToCart from "~/routes/pos/billing/components/add-to-cart/PosAddToCart";
import PosB2bAddToCart from "~/routes/pos/billing/components/add-to-cart/PosB2bAddToCart";
import MrpSplitInfo from "./MrpSplitInfo";
import ImgRender from "~/components/core/img/ImgRender";
import KingSlabInfo from "~/components/feature/products/king-slab/KingSlabInfo";
import Rbac from "~/components/core/rbac/Rbac";
import SellerCatalogService from "~/services/SellerCatalogService";
import CaseQtyPopover from "~/shared/catalog/components/CaseQtyPopover";
import SellingTypeDisplay from "~/shared/catalog/components/SellingTypeDsiplay";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";
import UomPriceService from "~/services/UomPriceService";

export type CartItemProps = {
  data: any;
  cartId?: string;
  callback: (payload: { action: string; data?: any; index: number }) => void;
  index: number;
  removingIndex: number | null;
  type?: string;
  quickCheckout?: boolean;
  assisted?: boolean;
};

const EDIT_PRICE_ROLES = ["PRICE MANAGEMENT.POS-CART-PRICE-EDIT"];

const EditPriceControl: React.FC<{
  overridePrice: any;
  onEdit: () => void;
}> = ({ overridePrice, onEdit }) => (
  <Rbac roles={EDIT_PRICE_ROLES}>
    <div className="tw:flex tw:items-center tw:gap-1.5 tw:mt-1">
      <button
        type="button"
        onClick={onEdit}
        className="tw:text-blue-600 tw:text-[10px] tw:font-medium tw:flex tw:items-center tw:gap-0.5 tw:cursor-pointer hover:tw:underline"
      >
        <Pencil size={10} />
        Edit Price
      </button>
      {typeof overridePrice === "number" && (
        <span className="tw:text-[9px] tw:font-bold tw:uppercase tw:tracking-wide tw:text-amber-700 tw:bg-amber-100 tw:border tw:border-amber-200 tw:rounded-full tw:px-1.5 tw:py-0.5 tw:leading-none">
          Price Modified
        </span>
      )}
    </div>
  </Rbac>
);

const CartItem: React.FC<CartItemProps> = ({
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
  // Only fall back to selectedStockUom when the pack type is Unit/empty/undefined;
  // a real pack (Case/Inner Case/Ladi) shows its pack label instead.
  const isRealPack = !!data.sellingType && data.sellingType !== "UNIT";

  return (
    <div className="app-cart-item tw:relative tw:flex tw:gap-3 tw:py-2.5 tw:pr-1 tw:border-b tw:border-slate-100 last:tw:border-b-0 tw:group hover:tw:bg-slate-50/40 tw:transition-colors">
      <div className="tw:w-11 tw:h-11 tw:relative tw:shrink-0">
        {/* overflow-hidden lives on an inner wrapper so the discount badge
            (offset outside the tile) isn't clipped by the rounded corners */}
        <div className="tw:w-full tw:h-full tw:bg-slate-50 tw:rounded-lg tw:overflow-hidden tw:border tw:border-slate-200/60 tw:shadow-sm">
          <ImgRender
            assetId={data.images?.[0]}
            className="tw:w-full tw:h-full tw:object-cover"
            size="200x200"
          />
        </div>
        {data.discountPerc > 0 && (
          <span className="tw:absolute tw:-top-1 tw:-left-1 tw:z-[1] tw:bg-rose-500 tw:text-white tw:text-[9px] tw:font-bold tw:px-1 tw:py-0.5 tw:rounded-md tw:leading-none tw:shadow-sm">
            -{data.discountPerc}%
          </span>
        )}
      </div>

      <div className="tw:flex-1 tw:min-w-0">
        <div className="tw:flex tw:items-start tw:justify-between tw:gap-2 tw:mb-0.5">
          <div className="tw:font-medium tw:text-[13px] tw:line-clamp-2 tw:text-slate-800 tw:leading-snug">
            {data.deal?.name}
          </div>
          <button
            type="button"
            aria-label="Remove"
            onClick={() =>
              callback && callback({ action: "remove", data, index })
            }
            disabled={removingIndex === index}
            className="tw:text-slate-400 hover:tw:text-red-500 tw:p-1 tw:rounded-md hover:tw:bg-red-50 tw:transition-all tw:cursor-pointer tw:shrink-0"
          >
            {removingIndex === index ? (
              <span className="tw:block tw:w-4 tw:h-4 tw:border-2 tw:border-red-500 tw:border-t-transparent tw:rounded-full tw:animate-spin" />
            ) : (
              <Trash2 size={15} />
            )}
          </button>
        </div>

        <div className="tw:flex tw:items-start tw:justify-between tw:gap-2">
          <div className="tw:min-w-0">
            {isScheme ? (
              <div className="tw:flex tw:flex-col tw:gap-0.5">
                <div className="tw:text-[9px] tw:font-bold tw:text-orange-600 tw:uppercase tw:flex tw:items-center tw:gap-1 tw:tracking-wider">
                  <span className="tw:w-1 tw:h-1 tw:bg-orange-500 tw:rounded-full tw:animate-pulse" />
                  Scheme Price
                </div>
                <div className="tw:flex tw:items-baseline tw:gap-1.5 tw:flex-wrap tw:text-xs">
                  <DisplayPrice
                    price={data.purchasePrice}
                    uom={data.selectedStockUom}
                    className="tw:text-orange-600 tw:font-bold tw:tabular-nums"
                    uomClassName="tw:text-[10px] tw:text-orange-600"
                  />
                  {data.mrp > 0 && (
                    <span className="tw:text-[10px] tw:text-slate-400 tw:line-through tw:tabular-nums">
                      MRP <DisplayPrice price={data.mrp} uom={data.selectedStockUom} />
                    </span>
                  )}
                  {data.basePrice > 0 && (
                    <span className="tw:text-[10px] tw:text-slate-400 tw:tabular-nums">
                      B2B <DisplayPrice price={data.basePrice} uom={data.selectedStockUom} />
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="tw:flex tw:items-center tw:gap-1.5 tw:flex-wrap">
                <DisplayPrice
                  price={data.purchasePrice}
                  uom={data.selectedStockUom}
                  className="tw:text-xs tw:font-bold tw:text-emerald-600 tw:tabular-nums"
                  uomClassName="tw:text-[10px] tw:text-gray-500"
                />
                {data.mrp > 0 && data.mrp !== data.purchasePrice && (
                  <span className="tw:text-[11px] tw:text-slate-400 tw:line-through tw:tabular-nums">
                    <DisplayPrice price={data.mrp} uom={data.selectedStockUom} />
                  </span>
                )}
                {baseUom && (
                  <span className="tw:text-[10px] tw:text-slate-400 tw:tabular-nums">
                    (<Amount value={unitPrice} decimalPlaces={amountDecimals} />/{baseUom})
                  </span>
                )}
              </div>
            )}
            <div className="tw:flex tw:items-center tw:gap-2 tw:mt-0.5">
              <EditPriceControl
                overridePrice={data.overridePrice}
                onEdit={() => callback({ action: "editPrice", data, index })}
              />
              <MrpSplitInfo snapshots={data.snapshots} />
            </div>
          </div>

          <div className="tw:flex tw:flex-col tw:items-end tw:gap-1 tw:shrink-0">
            {/* Quick-checkout B2B items carry snapshots, so they use the
                snapshot-aware stepper (same as B2C). */}
            {isB2b && !quickCheckout ? (
              <>
                <div className="tw:flex tw:items-center tw:gap-1">
                  <span className="tw:text-[11px] tw:text-gray-600 tw:uppercase tw:tracking-wide">
                    Qty
                  </span>
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
                      callback({
                        action: "qtyChange",
                        data: data.quantity,
                        index,
                      });
                    }}
                    className="tw:bg-white"
                    sellingType={data.sellingType || "UNIT"}
                    packageQty={data.packageQty || 0}
                    selectedStockUom={data.selectedStockUom}
                  />
                </div>
                <div className="tw:text-[10px] tw:text-slate-400 tw:flex tw:items-center tw:gap-1 tw:mt-0.5">
                  <span>In Stock:</span>
                  <span className="tw:font-medium tw:text-slate-600">
                    <DisplayQty
                      qty={data.availableStock}
                      isLooseQty={false}
                      uom={
                        data.selectedStockUom !== "unit"
                          ? data.selectedStockUom
                          : ""
                      }
                      hideDefaultUom={true}
                    />{" "}
                    {data.selectedStockUom === "unit" && (
                      <SellingTypeDisplay sellingType={data.sellingType} />
                    )}
                  </span>
                  <CaseQtyPopover
                    packageQty={data.packageQty || 0}
                    sellingType={data.sellingType}
                  />
                </div>
              </>
            ) : (
              <PosAddToCart
                template={2}
                qty={data.quantity}
                maxQty={data.availableStock || 0}
                dealId={data.deal.id}
                cartId={cartId}
                snapshots={data.snapshots}
                callback={() => {
                  callback({
                    action: "qtyChange",
                    data: data.quantity,
                    index,
                  });
                }}
                customerType={type}
                quickCheckout={quickCheckout}
                overridePrice={data.overridePrice}
                purchasePrice={data.purchasePrice}
                assisted={assisted}
                selectedStockUom={data.selectedStockUom}
              />
            )}
            {formattedSlabs?.slab?.length > 0 ? (
              <KingSlabInfo slabs={formattedSlabs?.slab || []} size="xs" />
            ) : null}
          </div>
        </div>

        {qty > 0 && (
          <div className="app-cart-item-total tw:mt-2 tw:flex tw:items-center tw:justify-between tw:text-[11px] tw:text-slate-500 tw:bg-slate-50/60 tw:rounded-lg tw:px-2.5 tw:py-1 tw:border tw:border-slate-100">
            <div className="tw:flex tw:items-center tw:gap-1 tw:tabular-nums tw:font-medium">
              <DisplayPrice
                price={unitPrice}
                uom={data.selectedStockUom}
                className="tw:text-slate-500"
              />
              <span className="tw:text-slate-400 tw:font-light">×</span>
              <span className="tw:text-slate-700 tw:font-semibold">
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
            </div>
            <div className="tw:flex tw:items-center tw:gap-1">
              <span className="tw:text-slate-400 tw:text-[10px] tw:mr-0.5">=</span>
              <Amount
                value={total}
                decimalPlaces={amountDecimals}
                className="tw:text-xs tw:font-bold tw:text-slate-800 tw:tabular-nums"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartItem;
