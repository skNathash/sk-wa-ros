import {
  CheckCircle,
  Pencil,
  Printer,
  Receipt,
  RefreshCcw,
} from "lucide-react";
import { useCallback, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import AuthService from "~/services/AuthService";
import RemarksModal from "~/modals/feature/remarks/RemarksModal";

interface ActionButtonsProps {
  purchaseOrder: any;
  onRefresh: () => void;
  refreshing?: boolean;
}

const ActionButtons = ({
  purchaseOrder,
  onRefresh,
  refreshing = false,
}: ActionButtonsProps) => {
  const appNav = useAppNav();
  const { isMobile } = useScreenView();
  const appToast = useAppToast();
  const [showRemarksModal, setShowRemarksModal] = useState<boolean>(false);
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  // Handle edit purchase order
  const handleEdit = useCallback(() => {
    if (!purchaseOrder._canEdit) {
      appToast.show({
        msg: "This purchase order cannot be edited",
        color: "danger",
      });
      return;
    }

    // Navigate to manage page with id and vid query params
    const vendorId =
      purchaseOrder.vendorDetails?.id || purchaseOrder.vendor?.id;
    const queryParams = new URLSearchParams({ id: purchaseOrder._id });
    if (vendorId) {
      queryParams.append("vid", vendorId);
    }
    appNav.to(`/dashboard/purchase-order/manage?${queryParams.toString()}`);
  }, [purchaseOrder, appNav]);

  // Handle receive stock
  const handleReceive = useCallback(() => {
    if (purchaseOrder._isFromSk) {
      // For SK orders, redirect to SK receive page with PO ID
      appNav.to(
        `/dashboard/orders/primary/receive/sk/process/${purchaseOrder._id}`,
      );
      return;
    }

    if (!purchaseOrder._canReceive) {
      appToast.show({
        msg: "This purchase order cannot receive stock",
        color: "danger",
      });
      return;
    }

    // Navigate to receive page or open modal
    appNav.to(`/dashboard/purchase-order/process/${purchaseOrder._id}`);
  }, [purchaseOrder, appNav, appToast]);

  // Handle print purchase order
  const handlePrint = useCallback(() => {
    try {
      // Open the server-generated print page for this purchase order
      PurchaseOrderService.printOrder(purchaseOrder._id);
      appToast.show({
        msg: "Print window opened",
        color: "success",
      });
    } catch (error) {
      console.error("Error printing purchase order:", error);
      appToast.show({
        msg: "Failed to print purchase order",
        color: "danger",
      });
    }
  }, [purchaseOrder]);

  // Handle cancel purchase order
  const handleCancel = useCallback(() => {
    if (!purchaseOrder._canCancel) {
      appToast.show({
        msg: "This purchase order cannot be cancelled",
        color: "danger",
      });
      return;
    }
    // Show remarks modal before cancelling
    setShowRemarksModal(true);
  }, [purchaseOrder]);

  const handleSync = useCallback(async () => {
    try {
      setSyncing(true);
      const resp = await PurchaseOrderService.syncShipmentPackageSummary(
        purchaseOrder.skOrderId,
      );

      if (resp?.statusCode === 200) {
        appToast.show({ msg: "Sync successful", color: "success" });
        try {
          onRefresh && onRefresh();
        } catch (e) {
          // ignore
        }
      } else {
        appToast.show({
          msg: resp?.data?.message || "Failed to sync",
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Error syncing shipment package summary:", error);
      appToast.show({ msg: "Failed to sync", color: "danger" });
    } finally {
      setSyncing(false);
    }
  }, [purchaseOrder, onRefresh]);

  const handleRemarksCallback = useCallback(
    async (data: { action: string; remarks?: string }) => {
      setShowRemarksModal(false);
      if (data.action !== "submit") return;

      const remarks = data.remarks || "";
      try {
        setCancelling(true);
        const resp = await PurchaseOrderService.cancelPo(purchaseOrder._id, {
          remarks,
        });

        if (resp?.statusCode === 200) {
          appToast.show({ msg: "Purchase order cancelled", color: "success" });
          // Inform parent to re-fetch
          try {
            onRefresh && onRefresh();
          } catch (e) {
            // ignore
          }
        } else {
          appToast.show({
            msg: resp?.data?.message || "Failed to cancel purchase order",
            color: "danger",
          });
        }
      } catch (error) {
        console.error("Error cancelling PO:", error);
        appToast.show({
          msg: "Failed to cancel purchase order",
          color: "danger",
        });
      } finally {
        setCancelling(false);
      }
    },
    [purchaseOrder, onRefresh],
  );

  return (
    <>
      {/* `app-detail-actions` lets theme-2 mobile lay these out as one
          full-width strip under the order id instead of letting them wrap
          into a ragged block beside it. No-op elsewhere. */}
      <div
        className={`app-detail-actions tw:flex tw:gap-2 tw:flex-wrap tw:justify-end`}
      >
        {/* Edit Button - Only for Draft and Approval Pending */}
        {purchaseOrder._canEdit && (
          <AppButton
            size="small"
            color="warning"
            fill="outline"
            onClick={handleEdit}
          >
            <Pencil />
            Edit PO
          </AppButton>
        )}

        {/* Receive Stock Button - Only for Approved and Partially Received */}
        {purchaseOrder._canReceive && !purchaseOrder._isFromSk && (
          <AppButton
            size="small"
            color="success"
            onClick={handleReceive}
            noShadow={true}
          >
            <CheckCircle />
            Receive Stock
          </AppButton>
        )}

        {/* Print Button - Available for most statuses */}
        {purchaseOrder.status !== "Draft" && (
          <AppButton
            size="small"
            color="primary"
            fill="outline"
            onClick={handlePrint}
          >
            <Printer />
            Print
          </AppButton>
        )}

        {/* Sync Button - Only for SK orders and specific fid */}
        {purchaseOrder._isFromSk &&
          AuthService.getLoggedInUserId(true) === "F323114" && (
            <AppButton
              size="small"
              fill="outline"
              onClick={handleSync}
              noShadow={true}
              disabled={syncing}
            >
              <RefreshCcw />
              Sync
            </AppButton>
          )}

        {/* Cancel Button - Only for certain statuses */}
        {purchaseOrder._canCancel && (
          <AppButton
            size="small"
            color="danger"
            fill="outline"
            onClick={handleCancel}
          >
            Cancel PO
          </AppButton>
        )}
      </div>
      <RemarksModal
        show={showRemarksModal}
        title={`Cancel Purchase Order ${purchaseOrder.orderId}`}
        callback={handleRemarksCallback}
      />
    </>
  );
};

export default ActionButtons;
