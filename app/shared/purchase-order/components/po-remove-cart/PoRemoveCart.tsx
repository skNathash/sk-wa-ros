import { Trash2 } from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import useAppToast from "~/hooks/useAppToast";
import PurchaseCartService from "~/services/PurchaseCartService";

type PoRemoveCartProps = {
  vendorId: string;
  dealId: string;
  children?: React.ReactNode;
  className?: string;
  buttonClassName?: string;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
};

/**
 * Shared remove-from-cart control for purchase-order flows.
 * Removes a deal from the active draft cart via PurchaseCartService.
 */
const PoRemoveCart: React.FC<PoRemoveCartProps> = ({
  vendorId,
  dealId,
  children,
  className,
  buttonClassName,
  onSuccess,
  onError,
}) => {
  const { t } = useTranslation(["common"]);
  const toast = useAppToast();
  const [loading, setLoading] = useState(false);

  const handleRemove = async () => {
    if (!vendorId || !dealId) return;

    setLoading(true);
    try {
      const response = await PurchaseCartService.removeItemFromActive(
        vendorId,
        dealId,
      );

      if (response?.statusCode === 200 || response?.statusCode === 201) {
        toast.show({
          msg: t("removedFromCart"),
          color: "success",
        });
        onSuccess?.();
        return;
      }

      throw new Error(response?.data?.message || "Failed to remove from cart");
    } catch (error) {
      toast.show({
        msg: t("somethingWentWrong"),
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
        color="danger"
        fill="outline"
        className={buttonClassName}
        isLoading={loading}
        disabled={!vendorId || !dealId}
        onClick={handleRemove}
      >
        <Trash2 size={14} />
        {t("remove")}
      </AppButton>
      {children}
    </div>
  );
};

export default PoRemoveCart;
