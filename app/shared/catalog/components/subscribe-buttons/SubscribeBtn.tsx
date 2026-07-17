import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import type { ButtonColor } from "~/types/CommonTypes";

const MAX_SUBSCRIPTIONS = 50;

interface SubscribeBtnProps {
  dealId: string;
  dealName: string;
  mrp: number;
  price: number;
  images: string[];
  quantity?: number;
  className?: string;
  size?: "small" | "large" | "default" | "icon";
  color?: ButtonColor;
  fill?: "solid" | "outline" | "clear";
  isLocalDeal?: boolean;
  barcode?: string;
  callback?: (data: { action: string; data?: any }) => void;
  children?: React.ReactNode;
}

const SubscribeBtn: React.FC<SubscribeBtnProps> = ({
  dealId,
  dealName,
  mrp,
  price,
  images,
  quantity = 0,
  className = "",
  size = "default",
  color = "primary",
  fill = "solid",
  isLocalDeal = false,
  barcode,
  callback,
  children,
}) => {
  const { t } = useTranslation(["inventorySubscribe", "common"]);
  const appToast = useAppToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    // Verify current cart (server-first) and count unique dealIds to avoid duplicates causing false blocks
    let uniqueCount = 0;
    let hasDealInCart = false;
    try {
      const cartResp = await InventorySubscribeService.getCart();
      if (cartResp?.statusCode === 200) {
        const serverProducts = cartResp.data?.data?.products || [];
        const dealIds = serverProducts
          .map((p: any) => p.dealId || p._id)
          .filter(Boolean);
        hasDealInCart = dealIds.includes(dealId);
        uniqueCount = new Set(dealIds).size;
      }
    } catch (err) {
      // fallback to local
      const local = InventorySubscribeService.getLocalCart() || [];
      const dealIds = local.map((p: any) => p.dealId).filter(Boolean);
      hasDealInCart = dealIds.includes(dealId);
      uniqueCount = new Set(dealIds).size;
    }

    // If this deal is not already in cart and adding it would exceed the limit, block
    if (!hasDealInCart && uniqueCount >= MAX_SUBSCRIPTIONS) {
      appToast.show({
        msg: "You can only subscribe up to 50 products at a time. Please review your cart to subscribe",
        color: "warning",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await InventorySubscribeService.createRequest({
        dealId,
        quantity,
        price: AuthService.isMasterLogin() ? mrp : price,
        ...(isLocalDeal ? { isLocalDeal: true } : {}),
        ...(barcode ? { barcode } : {}),
      });

      if (response.statusCode === 200) {
        const product = response.data?.data || {};

        InventorySubscribeService.saveInLocalCart({
          dealId,
          dealName,
          quantity,
          price: AuthService.isMasterLogin() ? mrp : price,
          images,
          itemId: product.itemId,
        });

        InventorySubscribeService.triggerItemAddedEvent({
          dealId,
          dealName,
        });

        appToast.show({
          msg: t("search.toast.productSubscribed"),
          color: "success",
        });

        callback?.({
          action: "subscribed",
          data: {
            dealId,
            dealName,
            itemId: product.itemId,
            isInCart: true,
          },
        });
      } else {
        appToast.show({
          msg: response?.data?.message || t("search.toast.failedToSubscribe"),
          color: "danger",
        });
        callback?.({
          action: "error",
          data: response,
        });
      }
    } catch (error: any) {
      appToast.show({
        msg: t("search.toast.failedToSubscribe"),
        color: "danger",
      });
      callback?.({
        action: "error",
        data: error,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppButton
      onClick={handleSubscribe}
      isLoading={isLoading}
      size={size}
      color={color}
      fill={fill}
      className={className}
    >
      {children || t("search.subscribe", { defaultValue: "Subscribe" })}
    </AppButton>
  );
};

export default SubscribeBtn;
