import { debounce, set } from "lodash";
import SellingTypeDisplay from "~/shared/catalog/components/SellingTypeDsiplay";
import { Minus, Plus } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import { EVENTS } from "~/constants";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import CartService from "~/services/CartService";
import MiscService from "~/services/MiscService";
import ProductService from "~/services/ProductService";
import type { BuyCartType, Deal } from "~/types/CommonTypes";
import { addToCartHelper } from "./helper";
import AppPopover from "~/components/core/popover/AppPopover";
import QuantityPopoverContent from "~/shared/catalog/components/QuantityPopoverContent";
import DisplayQty from "../display-qty/DisplayQty";

interface QuantityOption {
  value: number;
  label: string;
}

type CartActionType = "add" | "update" | "remove" | "group-deal" | "price-slab";

interface AddToCartProps {
  className?: string;
  callback: (response: { action: CartActionType; data: any }) => void;
  deal: Deal;
  cartType?: BuyCartType;
  ignorePriceSlab?: boolean;
  useBusyLoader?: boolean;
  fullWidth?: boolean;
}

const AddToCart: React.FC<AddToCartProps> = ({
  deal,
  callback,
  cartType = "normal",
  ignorePriceSlab = false,
  useBusyLoader = false,
  fullWidth = false,
}) => {
  const toast = useAppToast();
  const [adding, setAdding] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showQuantitySelect, setShowQuantitySelect] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(deal?.minQty || 1);
  const [quantityOptions, setQuantityOptions] = useState<QuantityOption[]>([]);
  const [dealData, setDealData] = useState<Deal | null>(null);

  const [localQty, setLocalQty] = useState(selectedQuantity);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Which seller's shelf this card belongs to — blank for the buyer's own cart.
  const dealSellerId = deal?.buyFromOtherRetailer?.retailerId;

  useEffect(() => {
    setLocalQty(dealData?.inCart?.qty || 1);
    setShowQuantitySelect(dealData?.inCart?.status || false);
  }, [dealData?.inCart?.qty]);

  useEffect(() => {
    // The same catalog deal is sold by several sellers, so a cart event only
    // belongs to this card when the seller matches too — otherwise adding the
    // deal at one seller flips every other seller's card to "in cart".
    const isThisCard = (data: any) =>
      String(data.dealId) === String(deal.id) &&
      String(data.sellerId ?? "") === String(dealSellerId ?? "");

    const handleCartAddedEvent = (ev: any) => {
      // CustomEvent comes through as an Event with `detail` property
      const data = ev?.detail || {};
      // Coerce both sides to string to avoid number/string mismatches
      if (isThisCard(data)) {
        setSelectedQuantity(data.qty);
        setShowQuantitySelect(true);
      }
    };
    const handleCartRemovedEvent = (ev: any) => {
      const data = ev?.detail || {};
      if (isThisCard(data)) {
        setSelectedQuantity(0);
        setShowQuantitySelect(false);
      }
    };
    MiscService.listenEvent(EVENTS.CART_ITEM_ADDED, handleCartAddedEvent);
    MiscService.listenEvent(EVENTS.CART_ITEM_REMOVED, handleCartRemovedEvent);
    return () => {
      MiscService.removeEventListener(
        EVENTS.CART_ITEM_ADDED,
        handleCartAddedEvent,
      );
      MiscService.removeEventListener(
        EVENTS.CART_ITEM_REMOVED,
        handleCartRemovedEvent,
      );
    };
  }, [deal.id, dealSellerId]);

  useEffect(() => {
    setDealData(deal);
  }, [deal]);

  // Generate quantity options based on minQty, incrQty, and maxQty
  // useEffect(() => {
  //   if (dealData) {
  //     const options = [];
  //     const minQty = dealData.minQty || 1;
  //     const increment = dealData.incrQty || 1;
  //     let maxQty = dealData.maxQty;

  //     const inCartQty = dealData.inCart?.qty || 0;

  //     for (let qty = minQty; qty <= maxQty; qty += increment) {
  //       options.push({
  //         value: qty,
  //         label: qty.toString(),
  //       });
  //     }

  //     setQuantityOptions(options);

  //     if (inCartQty > 0 && inCartQty <= maxQty) {
  //       setSelectedQuantity(inCartQty);
  //     } else {
  //       setSelectedQuantity(minQty);
  //     }

  //     setShowQuantitySelect(dealData.inCart?.status || false);
  //   }
  // }, [dealData]);

  const handleCartOperation = async (
    operation: CartActionType,
    options: { quantity?: number; deal?: Deal } = {},
  ): Promise<{ status: boolean; msg: string }> => {
    const isLoading = operation === "add" ? setAdding : setUpdating;
    const toastMessage =
      operation === "add"
        ? "Product added to cart successfully!"
        : operation === "remove"
          ? "Product removed from cart successfully!"
          : "Cart quantity updated successfully!";

    isLoading(true);

    try {
      const dealId = deal.id;
      const quantity = options.quantity ?? selectedQuantity;
      // Use the helper function
      const result = await addToCartHelper({
        deal: options.deal || deal,
        quantity: quantity,
        cartType,
      });

      if (result.status) {
        if (operation === "add" || operation === "update") {
          CartService.triggerCartAddedEvent(dealId, quantity, dealSellerId);
          setDealData((prev) =>
            prev ? { ...prev, inCart: { status: true, qty: quantity } } : prev,
          );
          setLocalQty(quantity);
          setSelectedQuantity(quantity);
        }

        if (operation === "remove") {
          CartService.triggerCartRemovedEvent(dealId, dealSellerId);
          setShowQuantitySelect(false);
          // Update local dealData to reflect removal
          setDealData((prev) =>
            prev ? { ...prev, inCart: { status: false, qty: 0 } } : prev,
          );
          setLocalQty(0);
          setSelectedQuantity(0);
        }

        toast.show({
          msg: toastMessage,
          color: "success",
        });

        if (operation === "add") {
          setShowQuantitySelect(true);
        }
      } else {
        toast.show({ msg: result.message, color: "danger" });
      }

      return { status: result.status, msg: result.message };
    } catch (error) {
      console.error(`Error ${operation}ing cart:`, error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update cart";
      toast.show({ msg: errorMessage, color: "danger" });
      return { status: false, msg: errorMessage };
    } finally {
      isLoading(false);
    }
  };

  const invokeCallback = (
    callbackAction: CartActionType,
    status: boolean,
    message: string,
    quantity?: number,
  ) => {
    const extra = { showOtherDeals: deal?.showOtherDeals ?? true };
    callback({
      action: callbackAction,
      data: {
        status,
        message,
        data: {
          id: deal.id,
          quantity: quantity || selectedQuantity,
          dealId: deal._id,
          ...extra,
        },
      },
    });
  };

  const handleAddToCart = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();

    let actualDeal: Deal = deal;

    // price slab: add to cart for price-slab deals (use minQty as default)
    const hasPriceSlab =
      actualDeal.priceSlabs && actualDeal.priceSlabs.length > 0;
    if (hasPriceSlab && !ignorePriceSlab) {
      const defaultQty = actualDeal.minQty || 1;
      const { status, msg } = await handleCartOperation("add", {
        deal: actualDeal,
        quantity: defaultQty,
      });

      // Trigger callback indicating this was a price-slab add
      invokeCallback("price-slab", status, msg, defaultQty);
      return;
    }

    if (
      !hasPriceSlab &&
      actualDeal.groupDeals &&
      actualDeal.groupDeals.length > 0 &&
      !actualDeal._ignoreGroupDeals
    ) {
      callback({
        action: "group-deal",
        data: {
          deal: actualDeal,
          dealId: actualDeal?._id,
        },
      });
      return;
    }

    if (dealData?.checkPrice) {
      setAdding(true);
      const result = await ProductService.getProducts({
        filter: {
          _id: deal.id,
        },
      });

      const dealResponse = result.data?.[0] || {};
      if (!dealResponse?.id) {
        setAdding(false);
        toast.show({
          msg: "Product not found",
          color: "danger",
        });
        return;
      }
      setDealData(dealResponse);
      actualDeal = dealResponse;
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setAdding(false);
    }

    const qtyToAdd =
      selectedQuantity > 0 ? selectedQuantity : actualDeal.minQty || 1;

    const { status, msg } = await handleCartOperation("add", {
      deal: actualDeal,
      quantity: qtyToAdd,
    });
    invokeCallback("add", status, msg, qtyToAdd);
  };

  const handleQuantityChange = async (value: string) => {
    const newQuantity = Number(value);

    const previousQuantity = selectedQuantity; // Store the previous value
    setSelectedQuantity(newQuantity);

    try {
      let res;
      if (newQuantity === 0) {
        // Removing the item from cart
        res = await handleCartOperation("remove", {
          quantity: 0,
          deal: dealData || deal,
        });
      } else {
        res = await handleCartOperation("update", {
          quantity: newQuantity,
          deal: dealData || deal,
        });
      }
      const { status, msg } = res;
      if (!status) {
        throw new Error(msg); // Explicitly throw error if status is false
      }
      invokeCallback(
        newQuantity === 0 ? "remove" : "update",
        status,
        msg,
        newQuantity,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update quantity";
      toast.show({
        msg: errorMessage, // Display the error message from the API response
        color: "danger",
      });
      setSelectedQuantity(previousQuantity); // Revert to previous value on failure
      // Revert the optimistic stepper value back to the actual cart qty
      setLocalQty(dealData?.inCart?.qty ?? previousQuantity);
    } finally {
      setUpdating(false); // Ensure updating state is reset
    }
  };

  const debounceQty = useCallback(
    debounce(async (qty: number) => {
      handleQuantityChange(qty.toString());
    }, 500),
    [dealData],
  );

  const onDecr = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (updating) return;
    // If this deal has price slabs, we shouldn't perform incr/decr
    // Instead trigger the price-slab callback so caller can open slab UI
    if (
      dealData?.priceSlabs &&
      dealData.priceSlabs.length > 0 &&
      !ignorePriceSlab
    ) {
      const defaultQty = dealData.minQty || 1;
      invokeCallback("price-slab", true, "Price slab selected", defaultQty);
      return;
    }

    const minQty = dealData?.minQty || 1;
    const incr = dealData?.incrQty || 1;
    const current = localQty || minQty;

    // At (or below) the minimum qty, decrementing removes the item from cart
    if (current <= minQty) {
      setLocalQty(0);
      debounceQty(0);
      return;
    }

    const newQty = Math.max(current - incr, minQty);
    setLocalQty(newQty);
    debounceQty(newQty);
  };

  const onIncr = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (updating) return;
    // If this deal has price slabs, trigger callback instead of changing qty
    if (
      dealData?.priceSlabs &&
      dealData.priceSlabs.length > 0 &&
      !ignorePriceSlab
    ) {
      const defaultQty = dealData.minQty || 1;
      invokeCallback("price-slab", true, "Price slab selected", defaultQty);
      return;
    }

    const minQty = dealData?.minQty || 1;
    const incr = dealData?.incrQty || 1;
    const maxQty = dealData?.maxQty || 0;
    const current = localQty || minQty;
    // Step up by incrQty
    const newQty = current + incr;

    if (maxQty > 0 && newQty > maxQty) {
      toast.show({
        msg: `Only ${maxQty} in stock`,
        color: "warning",
      });
      return;
    }

    setLocalQty(newQty);
    debounceQty(newQty);
  };

  if (AuthService.isMasterLogin()) {
    return null;
  }

  if (showQuantitySelect) {
    return (
      <>
        {useBusyLoader && (
          <BusyLoader
            show={adding || updating}
            message={
              adding
                ? "Adding to cart..."
                : updating
                  ? "Updating cart..."
                  : undefined
            }
          />
        )}
        <div className={`${fullWidth ? "tw:flex tw:w-full" : "tw:inline-flex"} tw:items-center`}>
          <div className={`tw:relative ${fullWidth ? "tw:block tw:w-full" : "tw:inline-block"}`}>
            {updating ? (
              <div className="tw:flex tw:items-center tw:justify-center tw:h-8 tw:px-3 tw:rounded-md tw:border tw:border-slate-200 tw:bg-white">
                <AppSpinner className="tw:w-4 tw:h-4" />
              </div>
            ) : (
              <div onClick={(e) => e.stopPropagation()}>
                <AppPopover
                  open={popoverOpen}
                  onOpenChange={setPopoverOpen}
                  triggerContent={
                    <div className={`${fullWidth ? "tw:flex tw:w-full" : "tw:inline-flex"} tw:items-stretch tw:text-xs tw:border tw:border-slate-200 tw:rounded-md tw:bg-white tw:overflow-hidden`}>
                      <button
                        className={`tw:flex tw:items-center tw:justify-center tw:w-6 tw:h-7 tw:text-slate-600 tw:hover:bg-slate-50 tw:transition-colors tw:cursor-pointer ${updating ? "tw:opacity-50 tw:cursor-not-allowed" : ""}`}
                        onClick={onDecr}
                        disabled={updating}
                      >
                        <Minus size={12} />
                      </button>
                      <div className={`tw:flex tw:flex-col tw:items-center tw:justify-center tw:px-1.5 tw:border-x tw:border-slate-200 ${fullWidth ? "tw:flex-1" : "tw:min-w-[1.75rem]"}`}>
                        <span className="tw:font-semibold tw:text-slate-800 tw:leading-none tw:text-[11px]">
                          {updating ? (
                            <AppSpinner className="tw:w-3 tw:h-3" />
                          ) : (
                            <DisplayQty
                              qty={localQty}
                              isLooseQty={false}
                              uom={dealData?.selectedStockUom}
                              hideDefaultUom={true}
                            />
                          )}
                        </span>
                        {dealData?.sellingType && !dealData?.selectedStockUom && (
                          <span className="tw:text-[7px] tw:leading-none tw:mt-0.5 tw:text-slate-400 tw:lowercase tw:whitespace-nowrap">
                            <SellingTypeDisplay sellingType={dealData.sellingType} />
                          </span>
                        )}
                      </div>
                      <button
                        className={`tw:flex tw:items-center tw:justify-center tw:w-6 tw:h-7 tw:text-slate-600 tw:hover:bg-slate-50 tw:transition-colors tw:cursor-pointer ${updating ? "tw:opacity-50 tw:cursor-not-allowed" : ""}`}
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
                    minQty={dealData?.minQty || 1}
                    maxQty={dealData?.maxQty || 0}
                    incrQty={dealData?.incrQty || 1}
                    isUpdating={updating}
                    onClose={() => setPopoverOpen(false)}
                    sellingType={dealData?.sellingType}
                    selectedStockUom={dealData?.selectedStockUom}
                    onRemove={async () => {
                      const { status, msg } = await handleCartOperation(
                        "remove",
                        { quantity: 0, deal: dealData || deal },
                      );
                      if (status) {
                        invokeCallback("remove", status, msg, 0);
                        setPopoverOpen(false);
                      }
                    }}
                    onAdd={async (qty) => {
                      const { status, msg } = await handleCartOperation(
                        "update",
                        {
                          quantity: qty,
                        },
                      );
                      if (status) {
                        invokeCallback("update", status, msg, qty);
                        setPopoverOpen(false);
                      }
                    }}
                  />
                </AppPopover>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {useBusyLoader && (
        <BusyLoader
          show={adding || updating}
          message={
            adding
              ? "Adding to cart..."
              : updating
                ? "Updating cart..."
                : undefined
          }
        />
      )}
      <AppButton
        onClick={handleAddToCart}
        isLoading={adding}
        size="small"
        color="primary"
        noShadow={true}
        type="button"
        className={fullWidth ? "tw:w-full" : ""}
      >
        ADD
      </AppButton>
    </>
  );
};

export default AddToCart;
