import { AlertTriangle, ArrowRight, X } from "lucide-react";
// Replaced AppCard with plain divs per design requirement
import { useState } from "react";
import MoveToBoxModal from "./modals/MoveToBoxModal";
import AppBadge from "~/components/core/badge/AppBadge";
import RaisePackingIssueModal from "~/modals/feature/inventory/raise-packing-issue/RaisePackingIssueModal";
import { cloneDeep } from "lodash";
import { reducePickDetailsByBoxes } from "./helper";
import AppButton from "~/components/core/button/AppButton";
import CancelAllPickedModal from "./modals/CancelAllPickedModal";
import useAppToast from "~/hooks/useAppToast";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppLink from "~/components/core/link/AppLink";
import MoveAllToBox from "./MoveAllToBox";

type Props = {
  products: any[];
  callback?: (params: { action: string; data?: any }) => void;
  orderId?: string;
  activePickingId?: string;
};

const Products = ({ products, callback, orderId, activePickingId }: Props) => {
  const [busyLoader, setBusyLoader] = useState<boolean>(false);

  const [moveModal, setMoveModal] = useState<{
    show: boolean;
    product?: any;
    box?: any;
    qty?: number;
  }>({ show: false });

  const { show: showToast } = useAppToast();

  const [showCancelModal, setShowCancelModal] = useState(false);

  const [raiseModal, setRaiseModal] = useState<{
    show: boolean;
    product?: any;
  }>({ show: false });

  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  // compute unpacked products and count
  const unpackedProducts = (products || []).filter(
    (p) => (p?.scannedQty ?? 0) < (p?.pickedQty ?? 0)
  );
  const unpackedCount = unpackedProducts.length;

  const totalScannedQty = (products || []).reduce(
    (sum, p) => sum + (Number(p.scannedQty) || 0),
    0
  );

  const openMoveModal = async (product: any, box: any) => {
    const productData = cloneDeep(product);

    // Reduce pickDetails by the snapshots already present in boxes for this order
    productData.pickDetails = await reducePickDetailsByBoxes(
      orderId || "",
      productData.pickDetails || []
    );

    setMoveModal({
      show: true,
      product: productData,
      box,
      qty: productData.pickedQty - productData.scannedQty,
    });
  };

  const handleRaiseIssue = (product: any) => {
    // Prepare product data: filter/reduce pickedDetails snapshots by this product's boxes
    const productData = cloneDeep(product || {});

    try {
      const boxes = Array.isArray(productData.boxes) ? productData.boxes : [];

      // Aggregate snapshot quantities from boxes (local to this product)
      const boxSnapshotQty: Record<string, number> = {};

      boxes.forEach((b: any) => {
        const items = Array.isArray(b.items) ? b.items : [];
        items.forEach((it: any) => {
          const snaps = Array.isArray(it.snapshots) ? it.snapshots : [];
          snaps.forEach((s: any) => {
            // tolerate id/_id/snapshotId as identifier
            const id = s.id;
            const qty = Number(s.quantity ?? 0) || 0;
            if (!id || qty <= 0) return;
            boxSnapshotQty[String(id)] =
              (boxSnapshotQty[String(id)] || 0) + qty;
          });
        });
      });

      // Only operate on pickDetails for this deal
      const pickDetails = Array.isArray(productData.pickDetails)
        ? productData.pickDetails
        : [];

      const targetDealId = productData.dealId;

      // find the pickDetail for this deal
      const pickForDeal = pickDetails.find(
        (pd: any) => String(pd.dealId) === String(targetDealId)
      );

      let finalSnapshots: any[] = [];

      if (pickForDeal) {
        const snaps = Array.isArray(pickForDeal.snapshots)
          ? pickForDeal.snapshots
          : [];

        snaps.forEach((s: any) => {
          const sid = s.snapshotId;
          let qty = Number(s.quantity ?? 0) || 0;
          if (!sid || qty <= 0) return; // nothing to keep

          const avail = boxSnapshotQty[String(sid)] || 0;
          if (avail > 0) {
            const take = Math.min(avail, qty);
            qty = qty - take;
            boxSnapshotQty[String(sid)] = avail - take;
          }

          if (qty > 0) {
            const out: any = { ...(s || {}) };
            out.quantity = qty;
            if (out._id === undefined && out.id !== undefined) out._id = out.id;
            finalSnapshots.push(out);
          }
        });
      }

      // Keep remaining snapshots separately and also set pickDetails for the selected deal
      productData.remainingSnapshots = finalSnapshots;

      if (finalSnapshots.length > 0) {
        productData.pickDetails = [
          { dealId: targetDealId, snapshots: finalSnapshots },
        ];
        // attach a chosen snapshot id for the modal (first with qty)
        productData.snapshotId =
          finalSnapshots[0]._id ||
          finalSnapshots[0].id ||
          finalSnapshots[0].snapshotId;
      } else {
        productData.pickDetails = [];
        productData.snapshotId = undefined;
      }
    } catch (err) {
      console.error("Error reducing pickDetails by boxes:", err);
    }

    // show local modal to collect reason/units then forward to parent
    setRaiseModal({ show: true, product: productData });
  };

  const handleMoveModalCallback = (a: { action: string; data?: any }) => {
    setMoveModal({ show: false });

    if (a.action === "move") {
      callback?.({
        action: "moveToBox",
        data: {
          product: moveModal.product,
          box: moveModal.box,
          qty: a.data?.qty,
        },
      });
    }
  };

  const handleCancelPicking = () => {
    // Open cancel modal to collect cancellation reason
    setShowCancelModal(true);
  };

  const handleCancelModalCallback = (a: { action: string; data?: any }) => {
    setShowCancelModal(false);

    if (a.action === "submit") {
      setShowCancelModal(false);
      callback?.({ action: "cancelPicking", data: a.data });
    }
  };

  const handleRaisePackingIssueCallback = (a: {
    action: string;
    data?: any;
  }) => {
    if (a.action === "close") {
      setRaiseModal({ show: false });
      return;
    }

    if (a.action === "raise") {
      // Show success alert dialog
      setShowSuccessAlert(true);
    }

    setRaiseModal({ show: false });
  };

  const handleSuccessAlertConfirm = () => {
    setShowSuccessAlert(false);
    // Immediately notify parent to refresh due to issue raised
    callback?.({ action: "raiseIssue" });
  };

  const handleSuccessAlertCancel = () => {
    setShowSuccessAlert(false);
    // Immediately notify parent to refresh due to issue raised
    callback?.({ action: "raiseIssue" });
  };

  const handleMoveAllCallback = ({
    action,
    data,
  }: {
    action: string;
    data?: any;
  }) => {
    if (action === "moveAll") {
      // If the move was successful, refresh the data
      if (data?.success) {
        callback?.({
          action: "moveToBox",
          data: data,
        });
      } else {
        // For other cases, still pass the data
        callback?.({
          action: "moveAllToBox",
          data: data,
        });
      }
    }
  };

  return (
    <>
      <div className="tw:border tw:rounded tw:overflow-hidden">
        {/* Title row with bottom border */}
        <div className="tw:border-b tw:px-3 tw:py-2 tw:font-medium tw:text-sm tw:bg-white">
          <div className="tw:flex tw:justify-between tw:items-center">
            <div>UnPacked Items ({unpackedCount})</div>
            {!totalScannedQty && (
              <div>
                <AppButton
                  color="danger"
                  size="small"
                  onClick={handleCancelPicking}
                  fill="clear"
                  className="tw:text-red-600"
                >
                  Cancel All Picked
                  <X size={10} />
                </AppButton>
              </div>
            )}
          </div>
        </div>

        {/* Content area with light background */}
        <div className="tw:bg-gray-50 tw:p-3">
          {/* Move All To Box Component */}
          {unpackedProducts.length > 0 && (
            <div className="tw:mb-4">
              <MoveAllToBox
                products={unpackedProducts}
                callback={handleMoveAllCallback}
              />
            </div>
          )}

          {unpackedProducts.length === 0 ? (
            <div className="tw:text-center tw:text-sm tw:font-medium tw:text-green-700 tw:py-4">
              All items packed!
            </div>
          ) : (
            unpackedProducts.map((product) => (
              <div
                className="tw:p-2 tw:border tw:rounded tw:mb-4 tw:last:mb-0 tw:bg-white"
                key={product.id}
              >
                <div className="tw:flex tw:justify-between  tw:mb-1 tw:gap-2">
                  <div>
                    <div className="tw:font-medium tw:text-sm tw:flex-1">
                      <AppLink
                        href={`/dashboard/inventory/products/view/${product.dealId}`}
                        asLink
                      >
                        {product.dealName}
                      </AppLink>
                    </div>
                    <div className="tw:text-slate-600 tw:text-xs">
                      ID: {product.dealRefId}
                    </div>
                  </div>
                  <div className="tw:flex tw:flex-col tw:items-center tw:flex-1">
                    <div className="tw:text-sm tw:min-w-8">
                      {product.scannedQty} / {product.pickedQty}
                    </div>
                    <div>
                      <AppButton
                        type="button"
                        size="small"
                        onClick={() => handleRaiseIssue(product)}
                        aria-label={`Raise issue for ${product.dealName}`}
                        fill="outline"
                        noPadding
                        className="tw:mt-1 tw:h-6 tw:hidden"
                        color="danger"
                      >
                        Raise issue
                        <AlertTriangle size={10} />
                      </AppButton>
                    </div>
                  </div>
                </div>
                {product.scannedQty === product.pickedQty && (
                  <AppBadge variant="success">Packed</AppBadge>
                )}
                {Array.isArray(product.boxes) &&
                  product.boxes.length > 0 &&
                  product.scannedQty < product.pickedQty && (
                    <div className="tw:mt-2 tw:flex tw:gap-2 tw:flex-wrap">
                      {product.boxes.map((b: any) => {
                        // choose a color class based on box metadata if available
                        const boxColorClass =
                          b.colorClass ??
                          (b.status === "sealed"
                            ? "tw:bg-green-50 tw:text-green-700 tw:border-green-100 hover:tw:bg-green-100"
                            : "tw:bg-blue-50 tw:text-blue-700 tw:border-blue-100 hover:tw:bg-blue-100");

                        const chipClass = `tw:text-xs tw:px-2 tw:py-1 tw:rounded-lg tw:inline-flex tw:items-center tw:gap-2 tw:cursor-pointer tw:border ${boxColorClass}`;

                        return (
                          <button
                            key={b.id}
                            type="button"
                            className={chipClass}
                            onClick={() => openMoveModal(product, b)}
                            aria-label={`Move to box ${b.packageRefNo}`}
                          >
                            <ArrowRight size={14} />
                            <span className="tw:font-medium">Move</span>
                            <span className="tw:ml-1">{b.displayBoxName}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
              </div>
            ))
          )}
        </div>
      </div>

      {moveModal.show && (
        <MoveToBoxModal
          show={moveModal.show}
          dealName={moveModal.product?.dealName}
          dealId={moveModal.product?.dealId}
          toBox={moveModal.box}
          pendingQty={moveModal.qty}
          pickedDetails={moveModal.product?.pickDetails}
          callback={handleMoveModalCallback}
        />
      )}

      {/* Cancel all picked modal */}
      <CancelAllPickedModal
        show={showCancelModal}
        products={products}
        activePickingId={activePickingId}
        callback={handleCancelModalCallback}
      />

      {raiseModal.show && (
        <RaisePackingIssueModal
          show={raiseModal.show}
          pickingId={activePickingId || ""}
          dealId={raiseModal.product?.dealId || raiseModal.product?.id}
          dealRefId={raiseModal.product?.dealRefId}
          dealName={raiseModal.product?.dealName}
          pickedQty={raiseModal.product?.pickedQty}
          scannedQty={raiseModal.product?.scannedQty}
          snapshots={raiseModal.product?.remainingSnapshots}
          callback={handleRaisePackingIssueCallback}
        />
      )}

      <AppAlertDialog
        show={showSuccessAlert}
        type="alert"
        title="Issue Raised Successfully"
        description="Issue raised successfully! Order will be refreshed"
        okText="OK"
        onConfirm={handleSuccessAlertConfirm}
        onCancel={handleSuccessAlertCancel}
      />
    </>
  );
};

export default Products;
