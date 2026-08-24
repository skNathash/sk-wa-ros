import { Plus } from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import useAppToast from "~/hooks/useAppToast";
import PurchaseCartService from "~/services/PurchaseCartService";
import {
  fetchDealDetails,
  toCartItem,
  type PoAddToCartType,
} from "./helper";

type PoAddToCartProps = {
  vendorId: string;
  dealId: string;
  type: PoAddToCartType;
  initialQty?: number;
  children?: React.ReactNode;
  className?: string;
  buttonClassName?: string;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
};

/**
 * Shared add-to-cart control for purchase-order flows. Adds (or merges into)
 * the active draft cart for the vendor via PurchaseCartService.
 */
const PoAddToCart: React.FC<PoAddToCartProps> = ({
  vendorId,
  dealId,
  type,
  initialQty = 1,
  children,
  className,
  buttonClassName,
  onSuccess,
  onError,
}) => {
  const { t } = useTranslation(["common"]);
  const toast = useAppToast();
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!vendorId || !dealId) return;

    setLoading(true);
    try {
      const deal = await fetchDealDetails(vendorId, dealId, type);

      if (!deal?.dealId) {
        throw new Error("Failed to fetch deal details");
      }

      const response = await PurchaseCartService.addItemOrCreate({
        vendorId,
        ...toCartItem(deal, initialQty),
      });

      if (response?.statusCode === 200 || response?.statusCode === 201) {
        toast.show({
          msg: t("addedToCart", "Added to cart"),
          color: "success",
        });
        onSuccess?.();
        return;
      }

      throw new Error(
        (typeof response?.data?.message === "string" &&
          response.data.message) ||
          "Failed to add to cart",
      );
    } catch (error: any) {
      toast.show({
        msg:
          error?.message ||
          t("somethingWentWrong", "Something went wrong"),
        color: "danger",
      });
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <AppButton
        size="small"
        color="primary"
        fill="outline"
        className={buttonClassName}
        isLoading={loading}
        disabled={!vendorId || !dealId}
        onClick={handleAdd}
      >
        <Plus size={14} />
        {t("add")}
      </AppButton>
      {children}
    </div>
  );
};

export default PoAddToCart;
