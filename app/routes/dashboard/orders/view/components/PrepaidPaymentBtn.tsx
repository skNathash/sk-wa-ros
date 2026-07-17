import { useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import PrepaidInfoModal from "~/shared/configs/modals/PrepaidInfoModal";
import FranchiseService from "~/services/FranchiseService";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";

type Props = {
  order: any;
  onPaymentSuccess: () => void;
};

const PrepaidPaymentBtn = ({ order, onPaymentSuccess }: Props) => {
  const appToast = useAppToast();
  const [loading, setLoading] = useState(false);
  const [prepaidModal, setPrepaidModal] = useState<{
    show: boolean;
    paymentOptions: any[];
    orderAmount?: number | null;
    orderId?: string | number | null;
  }>({ show: false, paymentOptions: [], orderAmount: null, orderId: null });

  const showButton =
    order?.customerInfo?.customerId === AuthService.getLoggedInUserId() &&
    order?.paymentType?.toUpperCase() === "COD" &&
    (order?.status === "Pending" || order?.status === "Created");

  console.log(order.paymentType, order.status);

  if (!showButton) return null;

  const handleFetchAndShow = async () => {
    const franchiseId = order?.sellerInfo?.franchiseId;
    if (!franchiseId) {
      appToast.show({ msg: "Seller info not found", color: "error" });
      return;
    }

    setLoading(true);
    try {
      const cfgRes: any = await FranchiseService.getActiveOrderConfigs([
        franchiseId,
      ]);
      const cfgs = cfgRes?.data?.data || [];
      const cfg =
        cfgs.find((c: any) => c?.franchiseInfo?.id === franchiseId) || {};
      const paymentOptions = cfg?.paymentMethodConfig || [];

      if (paymentOptions.length === 0) {
        appToast.show({
          msg: "No prepaid payment options found",
          color: "error",
        });
        return;
      }

      setPrepaidModal({
        show: true,
        paymentOptions,
        orderAmount: order._payableAmt,
        orderId: order._id, // or order.orderId? Need to check buy-from-other-retailer index.tsx logic.
      });
    } catch (e: any) {
      appToast.show({
        msg: e?.message || "Failed to fetch payment configs",
        color: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="tw:mt-2">
        <AppButton
          color="primary"
          fill="solid"
          size="small"
          isLoading={loading}
          onClick={handleFetchAndShow}
          className="tw:w-full"
        >
          Complete Payment
        </AppButton>
      </div>

      <PrepaidInfoModal
        show={prepaidModal.show}
        callback={(a: { action: string; data: any }) => {
          if (a.action === "close") {
            setPrepaidModal((s) => ({ ...s, show: false }));
            return;
          }
          if (a.action === "success") {
            setPrepaidModal((s) => ({ ...s, show: false }));
            appToast.show({
              msg: "Payment details submitted",
              color: "success",
            });
            onPaymentSuccess();
          }
        }}
        paymentOptions={prepaidModal.paymentOptions}
        orderAmount={prepaidModal.orderAmount || undefined}
        orderId={prepaidModal.orderId}
      />
    </>
  );
};

export default PrepaidPaymentBtn;
