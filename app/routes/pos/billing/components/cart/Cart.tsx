import { ArrowLeft, ChevronLeft, ShoppingCart } from "lucide-react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";
import CartItem from "./CartItem";
import EditPriceModal from "../../modals/edit-price/EditPriceModal";
import Rbac from "~/components/core/rbac/Rbac";

type CartProps = {
  data: any[];
  cartId?: string;
  callback: (args: { action: string; data?: any }) => void;
  summary: {
    subtotal: number;
    couponDiscount: number;
    coinsDiscount: number;
    totalDiscount: number;
    finalPrice: number;
    orderAmount: number;
  };
  discount?: number;
  type: string;
  quickCheckout?: boolean;
  scrollToDealId?: string | null;
  onScrollComplete?: () => void;
  assisted?: boolean;
};

import { useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import useAppToast from "~/hooks/useAppToast";
import PosService from "~/services/PosService";
import FranchiseService from "~/services/FranchiseService";
import useScreenView from "~/hooks/useScreenView";
import AuthService from "~/services/AuthService";

const Cart = ({
  data,
  cartId,
  callback,
  summary,
  discount = 0,
  type,
  scrollToDealId,
  onScrollComplete,
  assisted,
  quickCheckout,
}: CartProps) => {
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { isMobile } = useScreenView();
  const appToast = useAppToast();
  const { t } = useTranslation(["posbilling", "common"]);

  const [cartItems, setCartItems] = useState(data);
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);
  const [editPriceModal, setEditPriceModal] = useState<{
    show: boolean;
    data: {
      cartId: string;
      dealId: string;
      dealName?: string;
      currentPrice: number;
      dealPrice: number;
      mrp: number;
      leastMrp: number;
      hasOverride?: boolean;
    } | null;
  }>({ show: false, data: null });

  // Local input value for the cart discount; the source of truth is the
  // server-stored discount passed in via the `discount` prop.
  const [discountInput, setDiscountInput] = useState<number>(discount || 0);

  // Keep the input in sync whenever the server-stored discount changes.
  useEffect(() => {
    setDiscountInput(discount || 0);
  }, [discount]);

  // Debounce the add/remove discount API calls so we don't hit the
  // backend on every keystroke.
  const applyDiscount = useDebouncedCallback(async (value: number) => {
    if (!cartId) return;
    try {
      const response =
        value > 0
          ? await PosService.addCartDiscount({ discount: value, cartId })
          : await PosService.removeCartDiscount({ cartId });

      if (response.statusCode !== 200) {
        // Revert the input to the last server-stored discount on failure.
        setDiscountInput(discount || 0);
        appToast.show({
          msg:
            response.data?.message ||
            t(
              "cart.messages.failedToUpdateDiscount",
              "Failed to update discount",
            ),
          color: "danger",
        });
        return;
      }

      callback({ action: "refreshCart" });
    } catch (e) {
      console.error("Failed to update cart discount", e);
      // Revert the input to the last server-stored discount on failure.
      setDiscountInput(discount || 0);
      appToast.show({
        msg: t(
          "cart.messages.failedToUpdateDiscount",
          "Failed to update discount",
        ),
        color: "danger",
      });
    }
  }, 600);

  const handleDiscountChange = (raw: string) => {
    const max = summary?.finalPrice || 0;
    let val = Math.max(0, Number(raw) || 0);
    if (max && val > max) val = max;
    setDiscountInput(val);
    applyDiscount(val);
  };

  const handleProceedCheckout = async () => {
    if (AuthService.isMasterLogin()) {
      appToast.show({
        msg: t("youAreNotAuthorizedToDoThisAction", { ns: "common" }),
        color: "error",
      });
      return;
    }
    if (cartItems.length === 0) {
      appToast.show({
        msg: t("cart.messages.addProductsToCart"),
        color: "danger",
      });
      return;
    }
    try {
      // Only enforce minimum cart amount for B2B flow
      if (0 && type === "b2b") {
        const configType = "B2B_ORDER_CONFIG";

        const resp = await FranchiseService.getFranchiseSettings({
          configType,
        });

        const minValue = resp?.data?.data?.configValue?.minOrderAmount;

        const orderAmount = summary?.finalPrice || 0;

        if (typeof minValue !== "undefined" && minValue !== null) {
          if (orderAmount < Number(minValue)) {
            appToast.show({
              msg:
                t("cart.messages.minCartNotSatisfied", { value: minValue }) ||
                `Minimum cart value is ₹${minValue}`,
              color: "danger",
            });
            return;
          }
        }
      }

      callback({ action: "checkout" });
    } catch (e: any) {
      // If settings call fails, allow proceed but notify user
      console.warn("Failed to fetch min cart settings:", e);
      callback({ action: "checkout" });
    }
  };

  useEffect(() => {
    setCartItems(data);
  }, [data]);

  useEffect(() => {
    if (scrollToDealId) {
      const el = itemRefs.current[scrollToDealId];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("tw:animate-pulse", "tw:bg-yellow-50");
        setTimeout(() => {
          el.classList.remove("tw:animate-pulse", "tw:bg-yellow-50");
        }, 1500);
      }
      onScrollComplete?.();
    }
  }, [scrollToDealId, onScrollComplete]);

  const handleCartItemCallback = (payload: {
    action: string;
    data?: any;
    index: number;
  }) => {
    const { action, data: actionData, index } = payload;
    if (action === "remove") {
      handleRemoveItem(index);
    } else if (action === "qtyChange") {
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === actionData.id ? { ...item, qty: actionData.qty } : item,
        ),
      );
    } else if (action === "editPrice") {
      if (!cartId) {
        appToast.show({
          msg: t("cart.messages.cartIdNotFound"),
          color: "danger",
        });
        return;
      }
      setEditPriceModal({
        show: true,
        data: {
          cartId,
          dealId: actionData?.deal?.id,
          dealName: actionData?.deal?.name,
          currentPrice: actionData?.purchasePrice,
          dealPrice: actionData?.dealPrice ?? actionData?.deal?.price ?? 0,
          mrp: actionData?.mrp,
          leastMrp: actionData?.leastMrp ?? actionData?.mrp,
          hasOverride: actionData?.overridePrice != null,
        },
      });
    }
  };

  const handleEditPriceCallback = (payload: { action: string; data?: any }) => {
    const { action } = payload;
    if (action === "close") {
      setEditPriceModal({ show: false, data: null });
      return;
    }
    if (action === "updated" || action === "removed") {
      setEditPriceModal({ show: false, data: null });
      callback({ action: "refreshCart" });
    }
  };

  const handleRemoveItem = async (index: number) => {
    if (!cartId) {
      appToast.show({
        msg: t("cart.messages.cartIdNotFound"),
        color: "danger",
      });
      return;
    }

    setRemovingIndex(index);
    const item = cartItems[index];

    const itemId = item.itemId;

    if (!itemId) {
      appToast.show({
        msg: t("cart.messages.itemIdNotFound"),
        color: "danger",
      });
      setRemovingIndex(null);
      return;
    }

    const response = await PosService.removeItemFromCart({
      cartId: cartId,
      itemId: itemId,
    });
    setRemovingIndex(null);
    if (response.statusCode === 200) {
      // Trigger global remove-from-cart event so other components (like Products)
      // can react and update their local stock / maxQty values.
      try {
        PosService.triggerRemoveFromCartEvent({
          dealId: item?.deal?.id || null,
          quantity: item?.quantity || 0,
          cartId,
        });
      } catch (e) {
        // swallow - event creation shouldn't block the UI
        console.warn("Failed to trigger remove-from-cart event", e);
      }
      setCartItems((prev) => prev.filter((_, i) => i !== index));
      appToast.show({
        msg: response.data?.message || t("cart.messages.itemRemoved"),
        color: "success",
      });
    } else {
      appToast.show({
        msg: response.data?.message || t("cart.messages.failedToRemoveItem"),
        color: "danger",
      });
    }
  };

  return (
    <AppCard
      className="tw:flex tw:flex-col tw:h-full tw:bg-white tw:border tw:border-border tw:shadow-md tw:rounded-2xl"
      noPadding
    >
      <div className="tw:px-4 tw:py-3.5 tw:border-b tw:border-border tw:flex tw:justify-between tw:items-center tw:bg-muted/40">
        <div className="tw:text-sm tw:font-bold tw:text-foreground tw:flex tw:items-center tw:gap-2">
          <div className="tw:block tw:md:hidden">
            <ArrowLeft
              size={16}
              className="tw:text-muted-foreground hover:tw:text-foreground tw:cursor-pointer"
              onClick={() => callback({ action: "back" })}
            />
          </div>
          <span className="tw:tracking-tight">{t("cart.title")}</span>
          <span className="wa-mono tw:text-xs tw:font-bold tw:text-primary tw:bg-primary/10 tw:px-2 tw:py-0.5 tw:rounded-full">
            {cartItems.length} {t("items")}
          </span>
        </div>
        {quickCheckout && (
          <AppBadge className="tw:text-xs tw:uppercase" variant="warning">
            Quick Checkout
          </AppBadge>
        )}
      </div>
      <AppScrollArea className="wa-cart-scroll tw:flex-1 tw:overflow-y-auto tw:h-[calc(100vh-370px)]">
        {/* Padding lives inside the scroll viewport so absolutely-positioned
            overhangs (e.g. the discount badge) aren't clipped at its edge */}
        <div className="tw:px-4 tw:py-2 tw:min-h-full">
          {cartItems.length === 0 && (
            <div className="tw:flex tw:flex-col tw:justify-center tw:items-center tw:h-full tw:bg-muted/40 tw:rounded-xl tw:border tw:border-dashed tw:border-border tw:p-8">
              <ShoppingCart size={44} className="tw:text-muted-foreground/40 tw:mb-3" />
              <div className="tw:text-base tw:font-bold tw:text-muted-foreground tw:mb-1">
                {t("cart.emptyCart.title")}
              </div>
              <div className="tw:text-sm tw:text-muted-foreground/70">
                {t("cart.emptyCart.subtitle")}
              </div>
            </div>
          )}
          {cartItems.map((item, index) => (
            <div
              key={item.id}
              ref={(el) => {
                if (item.deal?.id) itemRefs.current[item.deal.id] = el;
              }}
            >
              <CartItem
                data={item}
                cartId={cartId}
                index={index}
                callback={handleCartItemCallback}
                assisted={assisted}
                removingIndex={removingIndex}
                type={type}
                quickCheckout={quickCheckout}
              />
            </div>
          ))}
        </div>
      </AppScrollArea>
      <div className="wa-sticky-foot tw:mt-auto tw:px-4 tw:py-4">
        <div className="tw:space-y-2.5 tw:mb-4">
          {type !== "b2b" && (
            <Rbac roles={["SALE-ORDER.CART-DISCOUNT"]}>
              <div className="tw:flex tw:justify-between tw:items-center tw:gap-4 tw:pb-2.5 tw:border-b tw:border-dashed tw:border-border">
                <span className="tw:text-xs tw:text-muted-foreground tw:font-medium">
                  {t("cart.summary.cartDiscount", "Cart Discount")}
                </span>
                <div className="tw:relative tw:flex tw:items-center">
                  <span className="tw:absolute tw:left-2.5 tw:text-muted-foreground tw:text-[10px] tw:font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    max={summary?.finalPrice || 0}
                    value={discountInput || ""}
                    onChange={(e) => handleDiscountChange(e.target.value)}
                    placeholder="0"
                    className="wa-mono tw:w-20 tw:pl-5 tw:pr-2 tw:py-1 tw:text-right tw:border tw:border-border tw:bg-white tw:rounded-lg tw:text-xs tw:font-bold tw:text-foreground focus:tw:outline-none focus:tw:border-primary focus:tw:ring-2 focus:tw:ring-primary/10 tw:transition-all no-spinner"
                  />
                </div>
              </div>
            </Rbac>
          )}

          <div className="tw:flex tw:justify-between tw:items-center tw:pt-1">
            <span className="tw:text-xs tw:font-bold tw:text-foreground">
              {t("cart.summary.total")}
            </span>
            <div className="tw:flex tw:items-center tw:gap-1.5">
              {discountInput > 0 && (
                <span className="tw:text-xs tw:text-muted-foreground tw:line-through tw:font-medium">
                  <Amount value={summary?.finalPrice} decimalPlaces={2} />
                </span>
              )}
              <Amount
                value={Math.max(0, (summary?.finalPrice || 0) - discountInput)}
                className="wa-amount tw:text-lg tw:font-bold tw:text-foreground"
                decimalPlaces={2}
              />
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleProceedCheckout}
          className="wa-cta tw:flex tw:gap-2 tw:items-center tw:justify-center tw:w-full tw:h-11 tw:text-sm tw:font-bold tw:rounded-xl tw:cursor-pointer tw:transition-all"
        >
          <ShoppingCart size={15} className="tw:stroke-[2.5]" />
          <span>{t("cart.actions.proceedToCheckout")}</span>
        </button>
      </div>
      <EditPriceModal
        show={editPriceModal.show}
        data={editPriceModal.data}
        callback={handleEditPriceCallback}
      />
    </AppCard>
  );
};

export default Cart;
