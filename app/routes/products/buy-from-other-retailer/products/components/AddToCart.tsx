import { Minus, Plus } from "lucide-react";
import SellingTypeDisplay from "~/shared/catalog/components/SellingTypeDsiplay";
import React, { useCallback, useEffect, useRef, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { CART_ITEM_ADDED, CART_ITEM_REMOVED, EVENTS } from "~/constants";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import CartService from "~/services/CartService";
import MiscService from "~/services/MiscService";
import PosService from "~/services/PosService";
import ProductService from "~/services/ProductService";
import SellerCatalogService from "~/services/SellerCatalogService";
import AppPopover from "~/components/core/popover/AppPopover";
import QuantityPopoverContent from "~/shared/catalog/components/QuantityPopoverContent";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";

const getSkDeal = async (dealRefId: string) => {
  const skDealResp = await ProductService.getProducts({
    filter: {
      _id: dealRefId,
    },
  });
  return skDealResp?.data?.[0] || null;
};

const AddToCart: React.FC<{
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
  sellingType?: string;
  packageQty?: number;
  selectedStockUom?: string;
}> = ({
  qty,
  maxQty,
  dealId,
  itemId,
  cartId,
  sellerId,
  dealRefId,
  callback,
  type,
  isSkSeller,
  className,
  sellingType,
  packageQty,
  selectedStockUom,
}) => {
  const toast = useAppToast();

  const [localQty, setLocalQty] = useState(qty || 1);

  const [updating, setUpdating] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const skDealRef = useRef<Record<string, any> | null>(null);
  const dealRef = useRef<any | null>(null);

  const getMaxQty = useCallback(() => {
    if (isSkSeller) {
      const skDeal = skDealRef.current || {};
      return skDeal.maxQty || maxQty;
    }

    return maxQty;
  }, [isSkSeller, maxQty]);

  const handleSkFlow = async (quantity: number) => {
    const userId = AuthService.getLoggedInUserId(true);

    if (!userId) {
      toast.show({
        msg: "User not authenticated",
        color: "danger",
      });
      return;
    }

    setUpdating(true);
    const skDeal = skDealRef.current || {};

    // If the SK deal is out of stock (based on formatted response), show toast and skip add-to-cart
    const skMaxQty = skDeal.maxQty || 0;
    const skIsOutOfStock = skDeal.isOutOfStock || skMaxQty <= 0;
    if (skIsOutOfStock) {
      setUpdating(false);
      toast.show({
        msg: "Item is out of stock",
        color: "warning",
      });
      return;
    }

    const resp = await CartService.addToCart("B2B", userId, {
      fulfilledBy: skDeal.fulfilledBy,
      quantity: quantity,
      whId: skDeal.isSfToSf ? skDeal.fulfilledBy : skDeal.whId || 1,
      _id: skDeal.id,
      ...(skDeal.isSfToSf && { processType: "SFTOSF" }),
    });
    setUpdating(false);

    if (resp.statusCode === 200) {
      toast.show({
        msg: "Item added to cart successfully",
        color: "success",
      });
      const newItemId = resp?.data?.itemId;
      const newCartId = resp?.data?.cartId;
      callback({
        action: CART_ITEM_ADDED,
        data: {
          dealId: dealId,
          quantity: quantity,
          itemId: newItemId,
          cartId: newCartId,
          isSkSeller,
        },
      });

      MiscService.createEvent(EVENTS.CART_ITEM_ADDED, {
        dealId: dealId,
        quantity: quantity,
        itemId: newItemId,
        cartId: newCartId,
        sellerId: sellerId,
      });
    } else {
      toast.show({
        msg: resp.data?.message || "Failed to update cart",
        color: "danger",
      });
    }
  };

  const handleCartUpdate = async (cartQty: number) => {
    const currentMax = getMaxQty();
    if (cartQty > currentMax) {
      toast.show({
        msg: `Max stock available: ${currentMax}`,
        color: "warning",
      });
      return;
    }

    if (isSkSeller) {
      // Reuse cached SK deal if available, otherwise fetch it.
      let skDeal = skDealRef.current;
      if (!skDeal) {
        if (!dealRefId) {
          toast.show({ msg: "Invalid product details", color: "danger" });
          return;
        }
        try {
          setUpdating(true);
          skDeal = await getSkDeal(dealRefId);
        } finally {
          setUpdating(false);
        }

        if (skDeal && skDeal._id) {
          skDealRef.current = skDeal;
        } else {
          skDealRef.current = null;
          toast.show({
            msg: "Failed to fetch product details",
            color: "danger",
          });
          return;
        }
      }

      // Check for out-of-stock based on ProductService.format output
      const skMaxQty = skDeal.maxQty || 0;
      const skIsOutOfStock = skDeal.isOutOfStock || skMaxQty <= 0;
      if (skIsOutOfStock) {
        toast.show({ msg: "Item is out of stock", color: "warning" });
        return;
      }

      await handleSkFlow(cartQty);
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

    handleCartUpdate(1);
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
    // If this is an SK seller ensure we have sk deal details first.
    const ensureSkDeal = async () => {
      if (!isSkSeller) return true;

      // If already fetched, reuse it.
      if (skDealRef.current) return true;

      if (!dealRefId) {
        toast.show({ msg: "Invalid product details", color: "danger" });
        return false;
      }

      try {
        setUpdating(true);
        const skDeal = await getSkDeal(dealRefId);
        if (skDeal && skDeal._id) {
          skDealRef.current = skDeal;
          return true;
        }

        skDealRef.current = null;
        toast.show({ msg: "Failed to fetch product details", color: "danger" });
        return false;
      } finally {
        setUpdating(false);
      }
    };

    let ok = false;
    try {
      ok = await ensureSkDeal();
    } catch (e) {
      console.error("Error fetching SK deal:", e);
      toast.show({ msg: "Failed to fetch product details", color: "danger" });
      ok = false;
    }
    if (!ok) return;

    // Determine increment step. For SK deals, use the deal's `incrQty` as formatted by ProductService.
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
    const ensureSkDeal = async () => {
      if (!isSkSeller) return true;

      if (skDealRef.current) return true;

      if (!dealRefId) {
        toast.show({ msg: "Invalid product details", color: "danger" });
        return false;
      }

      try {
        setUpdating(true);
        const skDeal = await getSkDeal(dealRefId);
        if (skDeal && skDeal._id) {
          skDealRef.current = skDeal;
          return true;
        }

        skDealRef.current = null;
        toast.show({ msg: "Failed to fetch product details", color: "danger" });
        return false;
      } finally {
        setUpdating(false);
      }
    };

    let ok = false;
    try {
      ok = await ensureSkDeal();
    } catch (e) {
      console.error("Error fetching SK deal:", e);
      toast.show({ msg: "Failed to fetch product details", color: "danger" });
      ok = false;
    }
    if (!ok) return;

    setPopoverOpen(true);
  };

  if (type === 2) {
    return (
      <div onClick={(e) => e.stopPropagation()}>
        <AppPopover
          open={popoverOpen}
          onOpenChange={setPopoverOpen}
          triggerContent={
            <div className="tw:inline-flex tw:gap-1 tw:text-xs tw:border tw:border-slate-200 tw:px-1 tw:py-2 tw:rounded tw:items-center tw:overflow-visible">
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
                  ) : selectedStockUom != "unit" ? (
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
                {sellingType && !selectedStockUom && (
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
            selectedStockUom={selectedStockUom}
            minQty={
              isSkSeller
                ? skDealRef.current?.minQty || 1
                : dealRef.current?.minQty || 1
            }
            maxQty={getMaxQty() || 0}
            incrQty={isSkSeller ? skDealRef.current?.incrQty || 1 : 1}
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
      noShadow={true}
      type="button"
      className={className}
    >
      ADD
    </AppButton>
  );
};

export default AddToCart;
