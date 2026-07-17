import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import useAppToast from "~/hooks/useAppToast";
import PosService from "~/services/PosService";
import MiscService from "~/services/MiscService";
import { POS_SCAN_INCREMENT_CART_ITEM } from "~/constants";
import { Minus, Plus } from "lucide-react";
import AppPopover from "~/components/core/popover/AppPopover";
import QuantityPopoverContent from "~/shared/catalog/components/QuantityPopoverContent";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import SellerCatalogService from "~/services/SellerCatalogService";
import SellingTypeDisplay from "~/shared/catalog/components/SellingTypeDsiplay";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";

type PosB2bAddToCartProps = {
  template?: 1 | 2;
  qty: number;
  maxQty: number;
  minQty?: number;
  incrQty?: number;
  callback: () => void;
  dealId?: string;
  itemId?: string;
  cartId?: string;
  className?: string;
  sellingType?: string;
  packageQty?: number;
  autoAdd?: boolean;
  selectedStockUom?: string;
  scannedQty?: number;
};

const PosB2bAddToCart = ({
  template = 1,
  qty,
  maxQty,
  minQty = 1,
  incrQty = 1,
  callback,
  dealId,
  itemId,
  cartId,
  className,
  sellingType,
  packageQty,
  autoAdd,
  selectedStockUom,
  scannedQty,
}: PosB2bAddToCartProps) => {
  const { t } = useTranslation(["common"]);
  const toast = useAppToast();
  const [loading, setLoading] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const autoAddTriggered = useRef(false);
  const forceAutoAddedRef = useRef(false);

  // A "real pack" is anything other than Unit/empty/undefined. Only when the
  // pack type is Unit (or absent) should the display fall back to the
  // selectedStockUom; otherwise show the pack label (Case/Inner Case/Ladi).
  const isRealPack = !!sellingType && sellingType !== "UNIT";

  // Auto-add to cart when single search result (fresh add, not in cart yet).
  useEffect(() => {
    if (autoAdd && !autoAddTriggered.current && !loading) {
      autoAddTriggered.current = true;
      callAddToCart(scannedQty && scannedQty > 0 ? scannedQty : minQty);
    }
    if (!autoAdd) {
      autoAddTriggered.current = false;
    }
  }, [autoAdd]);

  // Listen for scan-increment event when this component is mounted in the
  // cart panel (template=2). qty here is the accurate in-cart quantity.
  useEffect(() => {
    if (template !== 2) return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent)?.detail || {};
      if (!detail.dealId || detail.dealId !== dealId) return;
      const add =
        detail.scannedQty && detail.scannedQty > 0
          ? detail.scannedQty
          : minQty;
      if (add > maxQty) {
        toast.show({
          msg: "You've reached the maximum available stock for this item.",
          color: "error",
        });
        return;
      }
      forceAutoAddedRef.current = true;
      callAddToCart((qty || 0) + add);
    };
    MiscService.listenEvent(POS_SCAN_INCREMENT_CART_ITEM, handler);
    return () => {
      MiscService.removeEvent(POS_SCAN_INCREMENT_CART_ITEM, handler);
    };
  }, [template, dealId, qty, maxQty, minQty]);

  const callAddToCart = async (quantity: number) => {
    if (!dealId) {
      toast.show({
        msg: t("missingDealId") || "Missing deal id",
        color: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, any> = {
        dealId: dealId,
        quantity,
        snapshots: [],
      };

      if (cartId) payload.cartId = cartId;

      if (sellingType != "UNIT") {
        const sp = SellerCatalogService.getSellingTypes().find(
          (st: any) => st.value === sellingType,
        );
        payload.packType = sp?.apiValue || "";
        payload.packQuantity = packageQty || 0;
        payload.requestedPackQuantity = quantity;
        payload.quantity = (packageQty || 0) * quantity;
      }

      const result = await PosService.addItemToCart(payload);
      if (result && result.statusCode === 200) {
        PosService.triggerAddToCartEvent({
          dealId,
          quantity,
          autoAdded: !!autoAdd || forceAutoAddedRef.current,
          ...(cartId ? { cartId } : {}),
        });
        forceAutoAddedRef.current = false;
        callback();
        toast.show({
          msg:
            result.data?.message ||
            t("productAddedToCart") ||
            "Product added to cart",
          color: "success",
        });
      } else {
        toast.show({
          msg:
            result?.data?.message ||
            t("failedToAddToCart") ||
            "Failed to add product to cart",
          color: "error",
        });
      }
    } catch (e) {
      toast.show({
        msg: t("failedToAddToCart") || "Failed to add product to cart",
        color: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const callRemoveFromCart = async () => {
    if (!dealId && !itemId) return;
    setLoading(true);
    try {
      const payload: Record<string, any> = {};
      if (itemId) payload.itemId = itemId;
      else if (dealId) payload.dealId = dealId;

      if (cartId) payload.cartId = cartId;

      const result = await PosService.removeItemFromCart(payload);
      if (result && result.statusCode === 200) {
        PosService.triggerRemoveFromCartEvent({
          dealId,
          ...(cartId ? { cartId } : {}),
        });
        callback();
        setPopoverOpen(false);
        toast.show({
          msg: result.data?.message || t("productRemoved") || "Product removed",
          color: "success",
        });
      }
    } catch (e) {
      toast.show({
        msg: t("failedToRemove") || "Failed to remove",
        color: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const onIncr = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPopoverOpen(true);
  };

  const onDecr = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPopoverOpen(true);
  };

  const handleAddClick = async () => {
    await callAddToCart(minQty);
  };

  return (
    <div className={className}>
      {template === 2 ? (
        <div onClick={(e) => e.stopPropagation()}>
          <AppPopover
            open={popoverOpen}
            onOpenChange={setPopoverOpen}
            triggerContent={
              <div className="tw:inline-flex tw:items-center tw:bg-slate-100/80 tw:border tw:border-slate-200/50 tw:rounded-lg tw:p-0.5 tw:h-7">
                <button
                  className={`tw:h-5 tw:w-5 tw:flex tw:items-center tw:justify-center tw:text-slate-500 hover:tw:text-slate-800 disabled:tw:opacity-40 tw:rounded-md tw:transition-colors tw:cursor-pointer ${
                    loading ? "tw:opacity-50 tw:cursor-not-allowed" : ""
                  }`}
                  onClick={onDecr}
                  disabled={loading}
                >
                  <Minus size={12} />
                </button>
                <div className="tw:min-w-[24px] tw:text-center tw:px-1">
                  <div className="tw:text-xs tw:font-bold tw:text-slate-800 tw:leading-none">
                    {loading ? (
                      <AppSpinner className="tw:w-3 tw:h-3 tw:mx-auto" />
                    ) : (
                      <DisplayQty
                        qty={qty}
                        isLooseQty={false}
                        uom={isRealPack ? undefined : selectedStockUom}
                        hideDefaultUom={isRealPack}
                      />
                    )}
                  </div>
                  {isRealPack && !loading && (
                    <div className="tw:text-[8px] tw:leading-none tw:text-slate-400 tw:lowercase tw:mt-0.5">
                      <SellingTypeDisplay sellingType={sellingType} />
                    </div>
                  )}
                </div>
                <button
                  className={`tw:h-5 tw:w-5 tw:flex tw:items-center tw:justify-center tw:text-slate-500 hover:tw:text-slate-800 disabled:tw:opacity-40 tw:rounded-md tw:transition-colors tw:cursor-pointer ${
                    loading ? "tw:opacity-50 tw:cursor-not-allowed" : ""
                  }`}
                  onClick={onIncr}
                  disabled={loading}
                >
                  <Plus size={12} />
                </button>
              </div>
            }
          >
            <QuantityPopoverContent
              initialQty={qty}
              minQty={minQty}
              maxQty={maxQty}
              incrQty={incrQty}
              isUpdating={loading}
              sellingType={sellingType}
              selectedStockUom={selectedStockUom}
              onClose={() => setPopoverOpen(false)}
              onRemove={callRemoveFromCart}
              onAdd={async (newQty) => {
                await callAddToCart(newQty);
                setPopoverOpen(false);
              }}
            />
          </AppPopover>
        </div>
      ) : (
        <AppButton
          onClick={handleAddClick}
          disabled={loading || maxQty <= 0}
          size="small"
          color="success"
          fill="solid"
          className="tw:uppercase tw:font-bold tw:px-6"
          isLoading={loading}
        >
          <Plus size={14} />
        </AppButton>
      )}
    </div>
  );
};

export default PosB2bAddToCart;
