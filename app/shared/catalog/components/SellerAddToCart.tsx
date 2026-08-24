import { Minus, Plus } from "lucide-react";
import SellingTypeDisplay from "~/shared/catalog/components/SellingTypeDsiplay";
import React, { useEffect, useRef, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { CART_ITEM_ADDED, CART_ITEM_REMOVED, EVENTS } from "~/constants";
import useAppToast from "~/hooks/useAppToast";
import CartService from "~/services/CartService";
import MiscService from "~/services/MiscService";
import PosService from "~/services/PosService";
import SellerCatalogService from "~/services/SellerCatalogService";
import AppPopover from "~/components/core/popover/AppPopover";
import QuantityPopoverContent from "~/shared/catalog/components/QuantityPopoverContent";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";

const SellerAddToCart: React.FC<{
  qty: number;
  maxQty: number;
  dealId: string;
  dealRefId: string;
  itemId?: string;
  cartId?: string;
  sellerId?: string;
  type?: number;
  isSkSeller?: boolean;
  callback: (response: { action: string; data: any }) => void;
  className?: string;
  /** Overrides the type-2 stepper trigger's spacing/rounding classes. */
  stepperClassName?: string;
  sellingType?: string;
  packageQty?: number;
  selectedStockUom?: string;
  /** Button fill when not in stepper mode. Defaults to solid. */
  fill?: "solid" | "outline" | "clear";
  /** Overrides the default "ADD" label (e.g. "+ ₹1,896"). */
  children?: React.ReactNode;
}> = ({
  qty,
  maxQty,
  dealId,
  itemId,
  cartId,
  sellerId,
  callback,
  type,
  isSkSeller,
  className,
  stepperClassName,
  sellingType,
  packageQty,
  selectedStockUom,
  fill = "solid",
  children,
}) => {
  const toast = useAppToast();

  const [localQty, setLocalQty] = useState(qty || 1);

  const [updating, setUpdating] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const dealRef = useRef<any | null>(null);

  // Min/increment order rules come from the fetched deal. SK deals carry them
  // as `b2bMinQuantity`/`incrementQuantity` on the seller entry; everything
  // else steps by 1.
  const effectiveMinQty = dealRef.current?.minQty || 1;
  const effectiveIncrQty = dealRef.current?.incrQty || 1;

  const handleCartUpdate = async (cartQty: number) => {
    if (cartQty > maxQty) {
      toast.show({
        msg: `Max stock available: ${maxQty}`,
        color: "warning",
      });
      return;
    }

    setUpdating(true);

    let params: Record<string, any> = {
      quantity: cartQty,
      dealId: dealId,
    };

    if (sellingType !== "UNIT") {
      const sp = SellerCatalogService.getSellingTypes().find(
        (st: any) => st.value === sellingType,
      );
      params.packType = sp?.apiValue || "";
      params.packQuantity = packageQty || 0;
      params.requestedPackQuantity = cartQty;
      params.quantity = (packageQty || 0) * cartQty;
    }

    // For buy from other retailer
    if (sellerId) {
      params.sellerId = sellerId;
    }

    const apiResponse = await PosService.addItemToCart(params);

    if (apiResponse.statusCode === 200) {
      toast.show({
        msg: "Item added to cart successfully",
        color: "success",
      });
      const newItemId = apiResponse?.data?.data?.itemId;
      const newCartId = apiResponse?.data?.data?.cartId;
      // Update local cart
      CartService.addToCartLocal(dealId, cartQty, sellerId);
      callback({
        action: CART_ITEM_ADDED,
        data: {
          dealId: dealId,
          qty: cartQty,
          itemId: newItemId,
          cartId: newCartId,
          isSkSeller: isSkSeller,
        },
      });

      // Emit document-level event using EVENTS map so other parts
      // of the app listening to EVENTS.CART_ITEM_ADDED receive it.
      MiscService.createEvent(EVENTS.CART_ITEM_ADDED, {
        dealId: dealId,
        qty: cartQty,
        itemId: newItemId,
        cartId: newCartId,
        sellerId: sellerId,
      });
    } else {
      toast.show({
        msg: apiResponse?.data?.message || "Failed to update cart",
        color: "danger",
      });
    }

    setUpdating(false);
  };

  const ensureDealFetched = async () => {
    // reuse cached deal if present
    if (dealRef.current) return dealRef.current;

    if (!dealId) return null;

    try {
      setUpdating(true);
      let params: Record<string, any> = { parent: true, filter: { dealId } };
      if (sellerId) params = { ...params, sellerId };

      const dealResp = await SellerCatalogService.getProducts(params);
      const d = dealResp.data?.data?.[0] || null;
      const formatted = d
        ? SellerCatalogService.formatProductResponse([d], {
            view: "buyer",
            sellerId,
          })?.[0]
        : null;

      if (sellerId && formatted) {
        formatted.buyFromOtherRetailer = {
          status: true,
          retailerId: String(sellerId),
        };
      }

      dealRef.current = formatted || null;
      return dealRef.current;
    } finally {
      setUpdating(false);
    }
  };

  const handleRemove = async () => {
    setUpdating(true);
    const params = {
      cartId: cartId,
      itemId: itemId,
    };

    const response = await PosService.removeItemFromCart(params);
    if (response.statusCode === 200) {
      toast.show({
        msg: "Item removed successfully",
        color: "success",
      });
      // Clear local cart
      CartService.removeFromCart(dealId, sellerId);
      callback({
        action: CART_ITEM_REMOVED,
        data: {
          dealId: dealId,
          isSkSeller: isSkSeller,
        },
      });

      MiscService.createEvent(EVENTS.CART_ITEM_REMOVED, {
        dealId: dealId,
        sellerId: sellerId,
      });
    } else {
      toast.show({
        msg: response.data?.message || "Failed to remove item from cart",
        color: "danger",
      });
    }
    setUpdating(false);
  };

  useEffect(() => {
    setLocalQty(qty || 1);
  }, [qty]);

  const handleAddToCart = async () => {
    // Fetch deal data and determine price slab source (seller-specific first)
    const dealData = await ensureDealFetched();

    const hasDealPriceSlabs = Boolean(
      dealData &&
      Array.isArray(dealData.priceSlabs) &&
      dealData.priceSlabs.length > 0,
    );

    if (hasDealPriceSlabs) {
      callback({
        action: "price-slab",
        data: { dealId, sellerId, deal: dealData },
      });
      return;
    }

    // Seed the cart at the deal's minimum order quantity (1 for deals with no
    // min configured). Read off the just-fetched deal — `effectiveMinQty` is
    // still the pre-fetch render value here.
    handleCartUpdate(dealData?.minQty || 1);
  };

  const onIncr = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const dealData = await ensureDealFetched();

    const hasDealPriceSlabs = Boolean(
      dealData &&
      Array.isArray(dealData.priceSlabs) &&
      dealData.priceSlabs.length > 0,
    );

    if (hasDealPriceSlabs) {
      callback({
        action: "price-slab",
        data: { dealId, sellerId, deal: dealData },
      });
      return;
    }

    setPopoverOpen(true);
  };

  const onDecr = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const dealData = await ensureDealFetched();

    const hasDealPriceSlabs = Boolean(
      dealData &&
      Array.isArray(dealData.priceSlabs) &&
      dealData.priceSlabs.length > 0,
    );

    if (hasDealPriceSlabs) {
      callback({
        action: "price-slab",
        data: { dealId, sellerId, deal: dealData },
      });
      return;
    }

    setPopoverOpen(true);
  };

  if (type === 2) {
    return (
      <div onClick={(e) => e.stopPropagation()}>
        <AppPopover
          open={popoverOpen}
          onOpenChange={setPopoverOpen}
          triggerContent={
            <div
              className={`tw:inline-flex tw:gap-1 tw:text-xs tw:border tw:border-slate-200 tw:items-center tw:overflow-visible ${
                stepperClassName || "tw:px-1 tw:py-2 tw:rounded"
              }`}
            >
              <button
                className={`tw:cursor-pointer ${updating ? "tw:opacity-50 tw:cursor-not-allowed" : ""}`}
                onClick={onDecr}
                disabled={updating}
              >
                <Minus size={12} />
              </button>
              <span className="tw:px-1 tw:relative tw:flex tw:flex-col tw:items-center">
                <span>
                  {updating ? (
                    <AppSpinner className="tw-w-3 tw-h-3" />
                  ) : selectedStockUom ? (
                    <DisplayQty
                      qty={localQty}
                      isLooseQty={false}
                      uom={selectedStockUom}
                      hideDefaultUom={true}
                    />
                  ) : (
                    localQty
                  )}
                </span>
                {!selectedStockUom && sellingType && (
                  <span className="tw:absolute tw:-bottom-2 tw:left-1/2 tw:-translate-x-1/2 tw:text-[8px] tw:leading-tight tw:text-slate-500 tw:lowercase tw:whitespace-nowrap">
                    <SellingTypeDisplay sellingType={sellingType} />
                  </span>
                )}
              </span>
              <button
                className={`tw:cursor-pointer ${updating ? "tw:opacity-50 tw:cursor-not-allowed" : ""}`}
                onClick={onIncr}
                disabled={updating}
              >
                <Plus size={12} />
              </button>
            </div>
          }
        >
          <QuantityPopoverContent
            initialQty={localQty}
            sellingType={dealRef.current?.sellingType}
            minQty={effectiveMinQty}
            maxQty={maxQty || 0}
            incrQty={effectiveIncrQty}
            isUpdating={updating}
            onClose={() => setPopoverOpen(false)}
            onRemove={async () => {
              await handleRemove();
              setPopoverOpen(false);
            }}
            onAdd={async (qty) => {
              await handleCartUpdate(qty);
              setLocalQty(qty);
              setPopoverOpen(false);
            }}
          />
        </AppPopover>
      </div>
    );
  }

  return (
    <AppButton
      onClick={handleAddToCart}
      isLoading={updating}
      size="small"
      color="primary"
      fill={fill}
      noShadow={true}
      type="button"
      className={className}
    >
      {children ?? "ADD"}
    </AppButton>
  );
};

export default SellerAddToCart;
