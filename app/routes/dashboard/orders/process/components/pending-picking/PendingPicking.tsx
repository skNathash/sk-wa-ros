import { TriangleAlert } from "lucide-react";
import { useState } from "react";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppLink from "~/components/core/link/AppLink";
import useAppToast from "~/hooks/useAppToast";
import RackBinService from "~/services/RackBinService";

const PendingPicking = ({
  products,
  activePickingId,
  callback,
}: {
  products: any[];
  orderId?: string | null;
  activePickingId?: string | null;
  callback: () => void;
}) => {
  const toast = useAppToast();
  const [busyloading, setBusyloading] = useState({ show: false, message: "" });
  const [appAlertDialog, setAppAlertDialog] = useState({
    show: false,
    title: "",
    description: "",
    onConfirm: () => {},
    onCancel: () => {},
  });
  const totalPending = products.reduce((acc, product) => {
    const pending =
      product.pickDetails?.reduce((acc2: number, detail: any) => {
        return acc2 + (detail.orderedQty - detail.pickedQty || 0);
      }, 0) || 0;
    return acc + pending;
  }, 0);

  const pendingProducts = products.filter((product) => {
    return (
      product.pickDetails?.reduce((acc2: number, detail: any) => {
        return acc2 + (detail.orderedQty - detail.pickedQty || 0);
      }, 0) || 0
    );
  });

  if (pendingProducts.length === 0) {
    return null;
  }

  // Handlers moved out of JSX to avoid inline functions
  const handleCancelDialog = () => {
    setAppAlertDialog({
      show: false,
      title: "",
      description: "",
      onConfirm: () => {},
      onCancel: () => {},
    });
  };

  const handleConfirmContinue = async () => {
    // close dialog first
    handleCancelDialog();

    await new Promise((resolve) => setTimeout(resolve, 300));

    setBusyloading({
      show: true,
      message: "Continuing picking...",
    });

    try {
      if (!activePickingId) {
        setBusyloading({ show: false, message: "" });
        toast.show({ msg: "Active picking id missing", color: "danger" });
        return;
      }

      // Fetch active picking for this order
      const pickingResp = await RackBinService.getPickingDetail(
        activePickingId || ""
      );

      if (pickingResp?.statusCode !== 200 || !pickingResp?.data?.data) {
        setBusyloading({ show: false, message: "" });
        toast.show({ msg: "Failed to fetch active picking", color: "danger" });
        return;
      }

      const pickings = pickingResp.data.data || {};
      if (!pickings?._id) {
        setBusyloading({ show: false, message: "" });
        toast.show({
          msg: "No active picking found for this order",
          color: "danger",
        });
        return;
      }

      const pickingId = pickings._id;

      // Call continue API with the active picking id
      const resp = await RackBinService.continuePicking(pickingId || "");

      setBusyloading({ show: false, message: "" });

      if (resp?.statusCode === 200) {
        const msg = resp?.data?.message || "Continued picking";
        toast.show({ msg, color: "success" });
        callback();
      } else {
        toast.show({
          msg: resp?.data?.message || "Failed to continue picking",
          color: "danger",
        });
      }
    } catch (err) {
      setBusyloading({ show: false, message: "" });
      toast.show({ msg: "Error while continuing picking", color: "danger" });
    }
  };

  const handleOpenContinueDialog = () => {
    setAppAlertDialog({
      show: true,
      title: "Continue Picking",
      description: "Do you want to continue picking for this order?",
      onConfirm: handleConfirmContinue,
      onCancel: handleCancelDialog,
    });
  };

  return (
    <>
      <div className="tw:bg-orange-50 tw:rounded-lg tw:p-4 tw:border tw:border-orange-200 tw:mb-4">
        <div className="tw:flex tw:justify-between tw:items-center tw:mb-4">
          <div className="tw:flex tw:items-center tw:gap-2 tw:text-yellow-800 tw:font-semibold">
            <TriangleAlert size={20} />
            Remaining to pick{" "}
            <span className="tw:font-semibold">{totalPending}</span>
          </div>
          <div>
            <button
              className="tw:bg-white tw:text-gray-900 tw:border tw:border-gray-300 tw:rounded-md tw:px-3 tw:py-1 tw:text-xs tw:cursor-pointer"
              onClick={handleOpenContinueDialog}
            >
              Continue to pick
            </button>
          </div>
        </div>
        <div className="tw:text-sm tw:text-slate-800">
          {pendingProducts.map((product) => (
            <div
              key={product.dealId}
              className="tw:bg-white tw:flex tw:items-center tw:justify-between tw:p-2 tw:rounded-md tw:mt-2"
            >
              <div>
                <AppLink
                  href={`/dashboard/inventory/products/view/${product.dealId}`}
                  asLink
                >
                  {product.dealName}
                </AppLink>
              </div>
              <div>
                <span className="tw:bg-white tw:rounded-md tw:px-2 tw:py-1 tw:text-xs tw:border tw:border-gray-300 tw:font-medium">
                  {product.quantity - product.pickedQty} to pick
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BusyLoader show={busyloading.show} message={busyloading.message} />

      <AppAlertDialog
        show={appAlertDialog.show}
        title={appAlertDialog.title}
        description={appAlertDialog.description}
        onConfirm={appAlertDialog.onConfirm}
        onCancel={appAlertDialog.onCancel}
      />
    </>
  );
};

export default PendingPicking;
