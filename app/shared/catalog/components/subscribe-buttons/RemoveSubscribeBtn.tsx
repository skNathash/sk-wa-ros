import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import useAppToast from "~/hooks/useAppToast";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import type { VariantColor } from "~/types/CommonTypes";

interface RemoveSubscribeBtnProps {
  itemId: string;
  className?: string;
  size?: "small" | "large" | "default" | "icon";
  color?: VariantColor;
  fill?: "solid" | "outline" | "clear";
  callback?: (data: { action: string; data?: any }) => void;
  children?: React.ReactNode;
}

const RemoveSubscribeBtn: React.FC<RemoveSubscribeBtnProps> = ({
  itemId,
  className = "",
  size = "default",
  color = "danger",
  fill = "outline",
  callback,
  children,
}) => {
  const { t } = useTranslation(["inventorySubscribe", "common"]);
  const appToast = useAppToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleRemove = async () => {
    setIsLoading(true);

    try {
      const response = await InventorySubscribeService.removeRequestItem(
        itemId
      );

      if (response.statusCode === 200) {
        InventorySubscribeService.removeLocalCartItem(itemId);

        InventorySubscribeService.triggerItemRemovedEvent({
          itemId,
        });

        appToast.show({
          msg: t("search.toast.productRemoved"),
          color: "success",
        });

        callback?.({
          action: "removed",
          data: {
            itemId,
            isInCart: false,
          },
        });
      } else {
        appToast.show({
          msg: t("search.toast.failedToRemove"),
          color: "danger",
        });
        callback?.({
          action: "error",
          data: response,
        });
      }
    } catch (error: any) {
      appToast.show({
        msg: t("search.toast.failedToRemove"),
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
      onClick={handleRemove}
      isLoading={isLoading}
      size={size}
      color={color}
      fill={fill}
      className={className}
    >
      {children || t("search.remove", { defaultValue: "Remove" })}
    </AppButton>
  );
};

export default RemoveSubscribeBtn;
