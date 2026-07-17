import { ChevronDown, ChevronUp, Package, Plus, Trash } from "lucide-react";
import { useState } from "react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppButton from "~/components/core/button/AppButton";
import useAppToast from "~/hooks/useAppToast";
import SellerService from "~/services/SellerService";
import { createBox } from "../box/helper";
import BoxItem from "./BoxItem";

type Props = {
  boxes?: any[];
  orderId?: string;
  callback?: (a: { action: string; data?: any }) => void;
  totalPicked?: number;
  totalScanned?: number;
};

const Boxes = ({
  boxes = [],
  callback,
  orderId,
  totalPicked = 0,
  totalScanned = 0,
}: Props) => {
  const appToast = useAppToast();
  const [creating, setCreating] = useState(false);

  const [removing, setRemoving] = useState<boolean>(false);
  const [completing, setCompleting] = useState<boolean>(false);
  const [appAlertDialog, setAppAlertDialog] = useState({
    show: false,
    title: "",
    description: "",
    onConfirm: () => {},
    onCancel: () => {},
  });

  const handleCreate = async () => {
    if (!orderId) {
      appToast.show({
        msg: "Missing order id for creating box.",
        color: "error",
      });
      return;
    }

    // Check if there are any existing boxes with no products
    const hasEmptyBox = (boxes || []).some(
      (box) => !(box.items && box.items.length > 0)
    );

    if (hasEmptyBox) {
      appToast.show({
        msg: "At least one product must be moved to the box before creating new box.",
        color: "error",
      });
      return;
    }

    try {
      setCreating(true);
      const box = await createBox(orderId);
      if (box.errMsg) {
        appToast.show({
          msg: box.errMsg || "Failed to open box.",
          color: "error",
        });
        setCreating(false);
        return;
      }

      const newBoxIndex = (boxes || []).length + 1;
      appToast.show({
        msg: `BOX #${newBoxIndex} - ${box.refId} created.`,
        color: "success",
      });

      // Notify parent about new box so it can update global boxes list
      callback?.({
        action: "boxCreated",
        data: { id: box.id, name: box.refId, items: 0, status: "Open" },
      });
      setCreating(false);
    } catch (e: any) {
      console.error("Error creating box:", e);
      appToast.show({
        msg: e?.message || "Error creating box.",
        color: "error",
      });
      setCreating(false);
    }
  };

  const handleCompletePackingAndDebit = async () => {
    if (!orderId) {
      appToast.show({ msg: "Missing order id.", color: "error" });
      return;
    }

    // Only consider boxes that are saved/closed for completing packing
    const closedBoxes = (boxes || []).filter((box) => box.status === "Saved");

    if (!closedBoxes || closedBoxes.length === 0) {
      appToast.show({
        msg: "No closed boxes found. Please save/close at least one box before completing packing.",
        color: "error",
      });
      return;
    }

    // Validate that each closed box has at least one item
    const hasEmptyBox = closedBoxes.some(
      (box) => !(box.items && box.items.length > 0)
    );
    if (hasEmptyBox) {
      appToast.show({
        msg: "Some boxes are empty. Add products to all boxes before completing.",
        color: "error",
      });
      return;
    }

    try {
      setCompleting(true);
      const payload = {
        orderId,
        packageIds: closedBoxes.map((b) => b._id),
      };

      const response = await SellerService.closeBox(payload);

      if (response?.statusCode === 200) {
        appToast.show({
          msg: "Packing completed successfully and stock deducted from batches.",
          color: "success",
        });
        callback?.({
          action: "packingCompleted",
          data: { boxIds: closedBoxes.map((b) => b._id), response },
        });
      } else {
        appToast.show({
          msg: response?.data?.message || "Failed to complete packing",
          color: "error",
        });
      }
    } catch (e: any) {
      console.error("Error completing packing:", e);
      appToast.show({
        msg: e?.message || "An error occurred while completing packing.",
        color: "error",
      });
    } finally {
      setCompleting(false);
    }
  };

  const handleRemoveBoxItem = async (boxId: string, itemId: string) => {
    const response = await SellerService.removeBoxItem(boxId, itemId);
    if (response.statusCode === 200) {
      appToast.show({ msg: "Item removed successfully", color: "success" });
      // Notify parent so it can refresh the boxes list
      callback?.({ action: "boxItemRemoved", data: { boxId, itemId } });
    } else {
      appToast.show({
        msg: response.data?.message || "Failed to remove item",
        color: "error",
      });
    }
  };

  const handleRemoveBox = async (boxId: string) => {
    setRemoving(true);
    const response = await SellerService.cancelPackage(boxId);
    setRemoving(false);
    if (response.statusCode === 200) {
      appToast.show({ msg: "Box removed successfully", color: "success" });
      callback?.({ action: "boxRemoved", data: { id: boxId } });
    } else {
      appToast.show({
        msg: response.data?.message || "Failed to remove box",
        color: "error",
      });
    }
  };

  const handleConfirmPacking = async () => {
    // If there's any created box with no items, block confirm and show toast
    const hasEmptyCreatedBox = (boxes || []).some(
      (box) => !(box.items && box.items.length > 0)
    );
    if (hasEmptyCreatedBox) {
      appToast.show({
        msg: "Some boxes are empty. Add products to all boxes before completing.",
        color: "error",
      });
      return;
    }

    let title = "";
    let description = "";

    if (totalScanned < totalPicked) {
      title = "Some picked items are not packed";
      description = `Once you confirm, packing for this order will be finalized and stock will be deducted. You will not be able to pack this order again. Do you want to proceed?`;
    } else {
      title = "Confirm finalize packing";
      description = `Confirming will finalize packing for this order and deduct stock. You will not be able to pack this order again. Proceed?`;
    }

    setAppAlertDialog({
      show: true,
      title,
      description,
      onConfirm: async () => {
        setAppAlertDialog((prev) => ({ ...prev, show: false }));
        await handleCompletePackingAndDebit();
      },
      onCancel: () => {
        setAppAlertDialog((prev) => ({ ...prev, show: false }));
      },
    });
  };

  const toggleBox = (boxId: string, index: number) => {
    callback?.({ action: "toggleBox", data: { boxId, index } });
  };

  return (
    <>
      {/* Header */}

      <div className="tw:grid tw:grid-cols-1 tw:gap-3">
        {boxes.length === 0 ? (
          <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:p-6 tw:text-center tw:bg-gray-50 tw:rounded">
            <div className="tw:mb-3 tw:text-sm tw:text-gray-500">
              No boxes created
            </div>
            <AppButton
              color="primary"
              onClick={handleCreate}
              isLoading={creating}
            >
              Create Box
            </AppButton>
          </div>
        ) : (
          boxes.map((b, index) => {
            return (
              <div
                key={b._id}
                className="tw:border tw:border-gray-200 tw:rounded-lg tw:overflow-hidden"
              >
                <div className="tw:bg-slate-50 tw:flex tw:justify-between tw:items-center tw:border-b tw:border-gray-200 tw:pb-2 tw:px-4 tw:py-2">
                  <div className="tw:flex tw:items-center tw:justify-between tw:w-full tw:gap-2">
                    <div className="tw:flex tw:items-center tw:gap-3">
                      <Package size={18} className="tw:text-gray-600" />
                      <div>
                        <div className="tw:font-medium tw:text-gray-800 tw:flex tw:md:items-center tw:gap-1 tw:flex-col tw:md:flex-row">
                          {b.displayBoxName}
                          <span className="tw:text-xs tw:text-gray-500">
                            ({(b.items || []).length} items)
                          </span>
                        </div>
                      </div>
                    </div>
                    {b.items?.length > 0 && (
                      <div>
                        <button
                          className="tw:text-gray-500 tw:mt-1 tw:transition-transform tw:duration-300"
                          onClick={() => toggleBox(b._id, index)}
                        >
                          {b.isOpen ? <ChevronUp /> : <ChevronDown />}
                        </button>
                      </div>
                    )}
                  </div>

                  {!b.items?.length && (
                    <button
                      aria-label={`Remove box ${b.name}`}
                      onClick={() => handleRemoveBox(b._id)}
                      className="tw:text-sm tw:text-red-500 tw:cursor-pointer hover:tw:text-red-600 tw:flex tw:items-center"
                      title={`Remove box ${b.name}`}
                    >
                      {removing ? <AppSpinner /> : <Trash size={16} />}
                    </button>
                  )}
                </div>

                <div
                  className={`tw:bg-slate-100/50 tw:p-2 ${
                    b.isOpen ? "" : "tw:hidden"
                  }`}
                >
                  {b.items && b.items.length > 0 ? (
                    b.items.map((i: any, idx: number) => (
                      <BoxItem
                        key={i.id || idx}
                        boxId={b._id}
                        item={i}
                        onRemove={(itemId: string) =>
                          handleRemoveBoxItem(b._id, itemId)
                        }
                      />
                    ))
                  ) : (
                    <div className="tw:text-sm tw:text-gray-500 tw:py-4 tw:px-2">
                      Click items from unpacked list to add them here.
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer area: when there are boxes, show Add another box (left) and confirm (right) */}
      {boxes.length > 0 && (
        <div className="tw:mt-3 tw:flex tw:md:justify-between tw:md:items-center tw:pt-3 tw:gap-2 tw:flex-col tw:md:flex-row">
          <div>
            {totalScanned < totalPicked && (
              <AppButton
                color="light"
                onClick={handleCreate}
                isLoading={creating}
                size="small"
                fill="outline"
              >
                <Plus />
                Add another box
              </AppButton>
            )}
          </div>

          <div>
            <AppButton
              color="success"
              onClick={handleConfirmPacking}
              isLoading={completing}
              size="small"
            >
              <Package size={14} />
              Confirm Packing
            </AppButton>
          </div>
        </div>
      )}

      <AppAlertDialog
        show={appAlertDialog.show}
        title={appAlertDialog.title}
        description={appAlertDialog.description}
        onConfirm={appAlertDialog.onConfirm}
        onCancel={appAlertDialog.onCancel}
        type="confirm"
        okText="Confirm"
        cancelText="Cancel"
      />
    </>
  );
};

export default Boxes;
