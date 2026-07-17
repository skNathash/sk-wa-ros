import { produce } from "immer";
import { Check, Trash2 } from "lucide-react";
import React, { useState } from "react";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppButton from "~/components/core/button/AppButton";
import useAppToast from "~/hooks/useAppToast";
import SellerService from "~/services/SellerService";
import ChooseSanpshotModal from "~/shared/catalog/modals/sanpshots/ChooseSanpshotModal";
import {
  createBox,
  getTotalScannedQty,
  handleScanInputAPI,
  prepareFinishBoxPayload,
} from "./helper";

interface BoxProps {
  currentBoxId?: string;
  boxes: any[];
  callback: (params: { action: string; data?: any }) => void;
  orderId: string;
  products: any[];
}

const Box: React.FC<BoxProps> = ({ boxes, callback, orderId, products }) => {
  const appToast = useAppToast();

  const [currentBox, setCurrentBox] = useState<{
    id: string;
    refId: string;
    products: any[];
  }>({
    id: "",
    refId: "",
    products: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Handle scan input logic using the helper function
  const handleScanInput = async (barcode: string) => {
    setScanLoading(true);
    try {
      // Use the helper function to handle the API calls
      const result = await handleScanInputAPI(barcode, orderId);

      if (result.status === "error") {
        appToast.show({
          msg: result.message || "Error scanning item.",
          color: "error",
        });
        return;
      }

      // Find the deal from products array using result.deal.id
      const foundDeal = (products || []).find(
        (p) => p.dealId === result.deal?.dealId
      );

      // Get total scanned quantity using the helper function
      const totalQty = getTotalScannedQty(
        result.deal?.dealId,
        boxes || [],
        currentBox
      );

      // The max quantity should be the pickedQty from the deal
      const newMaxQty = foundDeal.pickedQty - totalQty;

      if (newMaxQty <= 0) {
        appToast.show({
          msg: `Seems like all units of "${foundDeal.dealName}" are scanned`,
          color: "error",
        });
        return;
      }

      if (result.snapshots?.length === 1) {
        updateProductInBox(
          foundDeal,
          result.snapshots.map((s: any) => ({
            ...s,
            enteredStock: 1,
            masters: s.masters.map((m: any) => ({
              ...m,
              usedQty: 1,
            })),
          }))
        );
      }
    } catch (err) {
      appToast.show({ msg: "Error scanning item.", color: "error" });
    } finally {
      setScanLoading(false);
    }
  };

  const updateProductInBox = (product: any, snapshots: any) => {
    setCurrentBox(
      produce((draft) => {
        const productIndex = draft.products.findIndex(
          (p) => p.id === product.dealId
        );
        if (productIndex === -1) {
          draft.products.push({
            id: product.dealId,
            refId: product.dealRefId,
            name: product.dealName,
            snapshots: snapshots,
            scannedQty: snapshots.reduce(
              (acc: number, curr: any) => acc + curr.enteredStock,
              0
            ),
            requiredQty: product.pickedQty,
          });
        } else {
          const newSnapshots: any = {};
          snapshots.forEach((s: any) => {
            s.masters.forEach((m: any) => {
              if (!newSnapshots[m._id]) {
                newSnapshots[m._id] = {
                  qty: m.usedQty,
                };
              } else {
                newSnapshots[m._id].qty += m.usedQty;
              }
            });
          });

          draft.products[productIndex].snapshots.forEach((s: any) => {
            s.masters.forEach((m: any) => {
              if (newSnapshots[m._id].qty) {
                m.usedQty += newSnapshots[m._id].qty;
              }
            });
            s.enteredStock = s.masters.reduce(
              (acc: number, curr: any) => acc + curr.usedQty,
              0
            );
          });

          draft.products[productIndex].scannedQty = draft.products[
            productIndex
          ].snapshots.reduce(
            (acc: number, curr: any) => acc + curr.enteredStock,
            0
          );
        }
      })
    );
  };

  const handleStartBox = async () => {
    setIsLoading(true);

    const box = await createBox(orderId);

    if (box.errMsg) {
      appToast.show({
        msg: box.errMsg || "Failed to open box.",
        color: "danger",
      });
      setIsLoading(false);
      return;
    }

    setCurrentBox({
      id: box.id,
      refId: box.refId,
      products: [],
    });

    setIsLoading(false);
  };

  // Finish Box handler
  const handleFinishBox = async () => {
    if (!currentBox.products.length) {
      appToast.show({
        msg: "Please add products to the box before finishing.",
        color: "error",
      });
      return;
    }
    setIsLoading(true);
    try {
      // Prepare payload using static import
      const payload = prepareFinishBoxPayload(currentBox);
      // Call SellerService.closeBox
      const resp = await SellerService.saveBox(currentBox.id, payload);
      if (resp.statusCode === 200) {
        appToast.show({
          msg: "Box finished successfully!",
          color: "success",
        });
        setCurrentBox({
          id: "",
          refId: "",
          products: [],
        });
        callback({ action: "boxFinished", data: resp.data?.data });
      } else {
        appToast.show({
          msg: resp.data?.message || "Failed to finish box.",
          color: "error",
        });
      }
    } catch (e: any) {
      appToast.show({
        msg: e?.message || "An error occurred while finishing the box.",
        color: "error",
      });
    }
    setIsLoading(false);
  };

  // Handle cancel box confirmation
  const handleCancelBox = () => {
    setShowCancelConfirm(true);
  };

  const handleConfirmCancel = async () => {
    if (!currentBox.id) return;

    setCancelLoading(true);
    try {
      const resp = await SellerService.cancelPackage(currentBox.id);
      if (resp.statusCode === 200) {
        appToast.show({
          msg: "Box cancelled successfully!",
          color: "success",
        });
        setCurrentBox({
          id: "",
          refId: "",
          products: [],
        });
      } else {
        appToast.show({
          msg: resp.data?.message || "Failed to cancel box.",
          color: "error",
        });
      }
    } catch (err: any) {
      appToast.show({
        msg: err?.message || "An error occurred while cancelling the box.",
        color: "error",
      });
    } finally {
      setCancelLoading(false);
      setShowCancelConfirm(false);
    }
  };

  const removeProductFromBox = (productId: string) => {
    setCurrentBox(
      produce((draft) => {
        draft.products = draft.products.filter((p: any) => p.id !== productId);
      })
    );
    appToast.show({ msg: "Product removed from box.", color: "info" });
  };

  const handleCancelDialog = () => {
    setShowCancelConfirm(false);
  };

  if (!currentBox.id) {
    // Step 1 UI: Create a Box
    return (
      <div className="tw:bg-red-50 tw:rounded-lg tw:p-6 tw:mb-4 tw:border tw:border-gray-100">
        <div className="tw:text-2xl tw:font-bold tw:mb-2">
          Step 1: Create a Box
        </div>
        <div className="tw:text-gray-700 tw:mb-4">
          Select a box type to begin packing.
        </div>

        <div className="tw:flex tw:justify-center">
          <AppButton
            color="dark"
            isLoading={isLoading}
            onClick={handleStartBox}
          >
            <span>+</span> Start New Box
          </AppButton>
        </div>
      </div>
    );
  }

  // Step 2 UI: Scan Items
  return (
    <div className="tw:bg-red-50 tw:rounded-lg tw:shadow tw:p-6 tw:mb-4">
      <div className="tw:flex tw:items-center tw:justify-between tw:mb-2">
        <div className="tw:text-2xl tw:font-bold">Step 2: Scan Items</div>
        <div className="tw:flex tw:gap-2">
          <AppButton color="light" fill="outline" onClick={handleCancelBox}>
            Cancel Box
          </AppButton>
          <AppButton
            color="dark"
            isLoading={isLoading}
            onClick={handleFinishBox}
          >
            <Check />
            Finish Box
          </AppButton>
        </div>
      </div>
      <div className="tw:text-gray-700 tw:mb-2">
        Packing into:{" "}
        <span className="tw:font-semibold">{currentBox?.refId}</span>
      </div>
      <div className="tw:flex tw:items-center tw:mb-4 tw:gap-4">
        <input
          type="text"
          className="tw:border tw:rounded tw:px-4 tw:py-2 tw:flex-1 tw:bg-white"
          placeholder="Scan item barcode..."
          disabled={scanLoading}
          onKeyDown={async (e) => {
            if (e.key === "Enter") {
              const value = (e.target as HTMLInputElement).value;
              if (value) {
                await handleScanInput(value);
                (e.target as HTMLInputElement).value = "";
              }
            }
          }}
        />
        <AppButton
          color="dark"
          isLoading={scanLoading}
          onClick={async () => {
            const input = document.querySelector<HTMLInputElement>(
              "input[placeholder='Scan item barcode...']"
            );
            if (input && input.value) {
              await handleScanInput(input.value);
              input.value = "";
            }
          }}
        >
          Scan
        </AppButton>
      </div>
      <div>
        <div className="tw:font-semibold tw:mb-2">Items in Current Box</div>
        {currentBox.products.length ? (
          <div className="tw:bg-white tw:rounded tw:p-2 tw:space-y-2 tw:text-sm">
            {currentBox.products.map((p) => (
              <div
                key={p.id}
                className="tw:flex tw:items-center tw:justify-between tw:border-b tw:border-gray-100 tw:py-2 tw:last:border-b-0"
              >
                <div className="tw:flex-1 tw:text-gray-800">
                  <span className="tw:font-medium">{p.name}</span>
                  <span className="tw:text-xs tw:ml-2 tw:text-gray-500">
                    (ID: {p.refId})
                  </span>
                </div>
                <div className="tw:text-right tw:min-w-[80px] tw:flex tw:items-center tw:gap-2">
                  <div className="tw:text-right tw:min-w-[60px] tw:text-blue-700 tw:font-semibold">
                    Qty: {p.scannedQty ?? 0}
                  </div>
                  <button
                    type="button"
                    className="tw:text-red-600 hover:tw:text-red-800 tw:p-1 tw:rounded"
                    onClick={() => removeProductFromBox(p.id)}
                    title="Remove product from box"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="tw:text-gray-500 tw:text-center tw:py-2 tw:text-sm">
            Scan an item to add it here.
          </div>
        )}
      </div>

      <AppAlertDialog
        show={showCancelConfirm}
        title="Cancel Box?"
        description="Are you sure you want to cancel this box? This action cannot be undone."
        onConfirm={handleConfirmCancel}
        onCancel={handleCancelDialog}
        okText={cancelLoading ? "Cancelling..." : "Yes, Cancel"}
        cancelText="No"
        type="confirm"
      />
    </div>
  );
};

export default Box;
