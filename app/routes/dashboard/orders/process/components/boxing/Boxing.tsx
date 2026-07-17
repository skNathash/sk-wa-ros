import {
  Box,
  CheckCircle,
  CheckSquare,
  Eye,
  PackageCheck,
  PlusIcon,
  Trash,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import SellerService from "~/services/SellerService";
import { createBox } from "../box/helper";
import MoveProductsToBoxModal from "./modals/move-to-box/MoveProductsToBoxModal";
import ViewMovedProductsModal from "./modals/view-moved-products/ViewMovedProductsModal";

const Boxing = ({
  products,
  orderId,
  callback,
  activePickingId,
}: {
  products: any[];
  orderId?: string;
  callback?: (a: { action: string; data?: any }) => void;
  activePickingId?: string;
}) => {
  const [busyLoader, setBusyLoader] = useState<{ show: boolean; msg: string }>({
    show: false,
    msg: "",
  });

  const [boxes, setBoxes] = useState<any[]>([]);

  const [loading, setLoading] = useState<boolean>(false);

  const [viewModal, setViewModal] = useState<{ show: boolean; boxId?: string }>(
    { show: false }
  );

  const [boxesSummary, setBoxesSummary] = useState<{
    totalProducts: number;
    totalUnits: number;
    totalScannedProducts: number;
    totalScannedUnits: number;
    totalUnitsDisplay: string;
    totalScannedDisplay: string;
  }>({
    totalProducts: 0,
    totalUnits: 0,
    totalScannedProducts: 0,
    totalScannedUnits: 0,
    totalUnitsDisplay: "0 units",
    totalScannedDisplay: "0 units",
  });

  const productUomMap = useMemo(() => {
    const map: Record<string, string> = {};
    (products || []).forEach((p: any) => {
      if (p?.dealId) map[p.dealId] = p.selectedStockUom || "unit";
    });
    return map;
  }, [products]);

  const prepareSummary = useCallback(() => {
    const totalProducts = products.filter(
      (p) => Number(p.pickedQty) > 0
    ).length;

    const totalUnits = products.reduce(
      (acc, product) => acc + (Number(product.pickedQty ?? 0) || 0),
      0
    );

    const orderedEntries = (products || [])
      .filter((p: any) => Number(p.pickedQty) > 0)
      .map((p: any) => ({
        uom: productUomMap[p.dealId] || p.selectedStockUom || "unit",
        qty: Number(p.pickedQty ?? 0) || 0,
      }));

    let totalScannedProducts = 0;
    let totalScannedUnits = 0;
    const scannedEntries: Array<{ uom: string; qty: number }> = [];

    boxes.forEach((box) => {
      box.items.forEach((item: Record<string, any>) => {
        const uom = productUomMap[item.dealId] || "unit";
        item.snapshots.forEach((snap: Record<string, any>) => {
          const q = Number(snap.quantity) || 0;
          totalScannedProducts += q;
          totalScannedUnits += q;
          scannedEntries.push({ uom, qty: q });
        });
      });
    });

    return {
      totalProducts,
      totalUnits,
      totalScannedProducts,
      totalScannedUnits,
      totalUnitsDisplay:
        CommonService.groupQtyByUom(orderedEntries).label || "0 units",
      totalScannedDisplay:
        CommonService.groupQtyByUom(scannedEntries).label || "0 units",
    };
  }, [boxes, products, productUomMap]);

  const [moveModal, setMoveModal] = useState<{ show: boolean; box?: any }>({
    show: false,
  });

  const [completing, setCompleting] = useState<boolean>(false);

  const [appAlertDialog, setAppAlertDialog] = useState({
    show: false,
    title: "",
    description: "",
    onConfirm: () => {},
    onCancel: () => {},
  });
  const toast = useAppToast();

  // shared load function that uses helper
  const loadBoxes = async (createIfEmpty: boolean = false) => {
    if (!orderId) {
      setBoxes([]);
      return;
    }

    setLoading(true);

    try {
      const resp = await SellerService.getOrderBoxes(orderId, {
        filter: {
          status: {
            $nin: ["Closed", "Cancelled"],
          },
        },
      });
      let list = (resp && resp.data && resp.data.data) || [];

      // If requested, attempt to create a box when none exist, then re-fetch
      if (createIfEmpty && Array.isArray(list) && list.length === 0) {
        const created = await createBox(orderId);
        if (created && created.errMsg) {
          // show error to user but continue
          toast.show({ msg: created.errMsg, color: "error" });
        }
        const resp2 = await SellerService.getOrderBoxes(orderId, {
          filter: {
            status: {
              $nin: ["Closed", "Cancelled"],
            },
          },
        });
        list = (resp2 && resp2.data && resp2.data.data) || [];
      }

      // preserve any local `isOpen` state from previous boxes when reloading
      // If defaultOpenFirst is true, open the first box (and close others).
      setBoxes((prev) => {
        const prevMap: Record<string, any> = {};
        (prev || []).forEach((b: any) => {
          if (b && b._id) prevMap[b._id] = b;
        });

        const mapped = (list || []).map((item: any, index: number) => {
          // compute totals for each box here so UI doesn't have to recalculate
          const itemsWithSummary = (item.items || []).map((it: any) => {
            const uom = productUomMap[it.dealId] || "unit";
            const qty = Number(it.qty ?? it.scannedQty ?? 0) || 0;
            return {
              ...it,
              displaySummary:
                CommonService.groupQtyByUom([{ uom, qty }]).label ||
                "0 units",
            };
          });

          const totalProducts = itemsWithSummary.length || 0;
          const totalUnits = itemsWithSummary.reduce(
            (acc: number, it: any) =>
              acc + (Number(it.qty ?? it.scannedQty ?? 0) || 0),
            0
          );

          const boxEntries = itemsWithSummary.map((it: any) => ({
            uom: productUomMap[it.dealId] || "unit",
            qty: Number(it.qty ?? it.scannedQty ?? 0) || 0,
          }));
          const displaySummary =
            CommonService.groupQtyByUom(boxEntries).label || "0 units";

          return {
            ...item,
            items: itemsWithSummary,
            isOpen: prevMap[item._id]?.isOpen || false,
            displayBoxName: `BOX #${list.length - index} - ${item.packageRefNo}`,
            totalProducts,
            totalUnits,
            displaySummary,
          };
        });

        return mapped;
      });
    } catch (e: any) {
      setBoxes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setBoxesSummary(prepareSummary());
  }, [prepareSummary]);

  useEffect(() => {
    // when component mounts / orderId changes, ensure a box exists by default
    loadBoxes(true);
  }, [orderId]);

  const openMoveProductModal = (box: any) => {
    setMoveModal({ show: true, box });
  };

  const handleBoxAddItem = (boxId: string) => {
    if (!boxId) return;
    const box = (boxes || []).find((b) => b._id === boxId);
    if (!box) return;
    openMoveProductModal(box);
  };

  const handleBoxRemoe = (boxId: string) => {
    if (!boxId) return;
    handleRemoveBox(boxId);
  };

  const handleOpenView = (boxId: string) => {
    setViewModal({ show: true, boxId });
  };

  const handleCloseView = () => setViewModal({ show: false });

  const handleViewModalCallback = (arg: { action: string; data?: any }) => {
    setViewModal({ show: false });
    loadBoxes();
    setBoxesSummary(prepareSummary());
  };

  const handleBoxView = (boxId: string) => {
    if (!boxId) return;
    handleOpenView(boxId);
  };

  const handleRemoveBox = async (boxId: string) => {
    setBusyLoader({ show: true, msg: "Removing box..." });
    try {
      const response = await SellerService.cancelPackage(boxId);
      if (response.statusCode === 200) {
        toast.show({ msg: "Box removed successfully", color: "success" });
        await loadBoxes(false);
      } else {
        toast.show({
          msg: response.data?.message || "Failed to remove box",
          color: "error",
        });
      }
    } catch (e: any) {
      toast.show({ msg: e.message || "Error removing box", color: "error" });
    } finally {
      setBusyLoader({ show: false, msg: "" });
    }
  };

  const handleCreateNewBox = async () => {
    if (!orderId) return;
    setBusyLoader({ show: true, msg: "Creating new box..." });
    try {
      const created = await createBox(orderId);
      if (created && created.errMsg) {
        toast.show({ msg: created.errMsg, color: "error" });
      } else {
        toast.show({ msg: "Box created", color: "success" });
      }
      await loadBoxes(false);
    } catch (e: any) {
      toast.show({ msg: "Failed to create box", color: "error" });
    } finally {
      setBusyLoader({ show: false, msg: "" });
    }
  };

  const handleCompletePackingAndDebit = async () => {
    if (!orderId) {
      toast.show({ msg: "Missing order id.", color: "error" });
      return;
    }

    // Only consider boxes that are saved/closed for completing packing
    // In Boxing.tsx, boxes are fetched from API. We need to check their status or if they are created.
    // The Boxes.tsx logic checked for 'Saved' status. But here we might just check if they exist and valid.
    // Actually, SellerService.getOrderBoxes usually returns boxes.
    // We will assume all existing boxes in `boxes` are valid for closing unless we check status.
    // Let's use `boxes` state.

    // If API requires boxes to be in a certain state, we might need to check.
    // But SellerService.closeBox takes packageIds.

    const boxList = boxes || [];

    if (!boxList || boxList.length === 0) {
      toast.show({
        msg: "No boxes found. Please create at least one box before completing packing.",
        color: "error",
      });
      return;
    }

    // Validate that each box has at least one item
    const hasEmptyBox = boxList.some(
      (box) => !(box.items && box.items.length > 0)
    );
    if (hasEmptyBox) {
      toast.show({
        msg: "Some boxes are empty. Add products to all boxes before completing.",
        color: "error",
      });
      return;
    }

    try {
      setCompleting(true);
      const payload = {
        orderId,
        packageIds: boxList.map((b) => b._id),
      };

      const response = await SellerService.closeBox(payload);

      if (response?.statusCode === 200) {
        toast.show({
          msg: "Packing completed successfully and stock deducted from batches.",
          color: "success",
        });
        // Call the parent callback with 'packingCompleted'
        callback?.({
          action: "packingCompleted",
          data: { boxIds: boxList.map((b) => b._id), response },
        });
      } else {
        toast.show({
          msg: response?.data?.message || "Failed to complete packing",
          color: "error",
        });
      }
    } catch (e: any) {
      console.error("Error completing packing:", e);
      toast.show({
        msg: e?.message || "An error occurred while completing packing.",
        color: "error",
      });
    } finally {
      setCompleting(false);
    }
  };

  const handleConfirmPacking = async () => {
    // If there's any box with no items, block confirm and show toast
    const hasEmptyBox = (boxes || []).some(
      (box) => !(box.items && box.items.length > 0)
    );
    if (hasEmptyBox) {
      toast.show({
        msg: "Some boxes are empty. Add products to all boxes before completing.",
        color: "error",
      });
      return;
    }

    let title = "";
    let description = "";

    if (boxesSummary.totalScannedUnits < boxesSummary.totalUnits) {
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

  const handleMoveProductsToBoxCb = (args: { action: string; data?: any }) => {
    setMoveModal({ show: false });
    loadBoxes();
    setBoxesSummary(prepareSummary());
  };

  return (
    <>
      {loading ? (
        <div className="tw:flex tw:justify-center tw:items-center">
          <AppSpinner />
        </div>
      ) : null}

      {/* Instruction / Status Banner */}
      <div className="tw:mb-6">
        {boxesSummary.totalUnits > boxesSummary.totalScannedUnits ? (
          <div className="tw:bg-amber-50 tw:border tw:border-amber-200 tw:rounded-lg tw:p-4 tw:flex tw:items-start tw:gap-3">
            <div className="tw:bg-amber-100 tw:text-amber-600 tw:p-2 tw:rounded-full tw:shrink-0">
              <PackageCheck size={20} />
            </div>
            <div>
              <h4 className="tw:text-sm tw:font-bold tw:text-amber-800 tw:mb-1">
                {boxesSummary.totalUnits - boxesSummary.totalScannedUnits} items
                pending to pack
              </h4>
              <p className="tw:text-sm tw:text-amber-700 tw:leading-relaxed">
                Click <span className="tw:font-semibold">Add Items</span> on a
                box below to move products into it. You can also create more
                boxes if needed.
              </p>
            </div>
          </div>
        ) : (
          <div className="tw:bg-green-50 tw:border tw:border-green-200 tw:rounded-lg tw:p-4 tw:flex tw:items-center tw:gap-3">
            <div className="tw:bg-green-100 tw:text-green-600 tw:p-2 tw:rounded-full tw:shrink-0">
              <CheckSquare size={20} />
            </div>
            <div>
              <h4 className="tw:text-sm tw:font-bold tw:text-green-800 tw:mb-1">
                All items packed!
              </h4>
              <p className="tw:text-sm tw:text-green-700">
                Great job! All products have been moved to boxes. You can now
                proceed to complete the order.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Summary card above main Boxing card */}
      <AppCard className="tw:mb-4 tw:bg-white">
        <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:items-center tw:justify-between tw:gap-4">
          <div className="tw:flex tw:items-center tw:gap-8">
            <div className="tw:flex tw:flex-col">
              <span className="tw:text-xs tw:text-gray-500 tw:font-medium tw:uppercase tw:tracking-wider">
                Total Products
              </span>
              <span className="tw:text-lg tw:font-bold tw:text-gray-900">
                {boxesSummary.totalProducts}
              </span>
            </div>

            <div className="tw:h-8 tw:w-px tw:bg-gray-200 tw:hidden tw:md:block"></div>

            <div className="tw:flex tw:flex-col">
              <span className="tw:text-xs tw:text-gray-500 tw:font-medium tw:uppercase tw:tracking-wider">
                Units Packed
              </span>
              <div className="tw:flex tw:items-baseline tw:gap-1">
                <span className="tw:text-lg tw:font-bold tw:text-gray-900">
                  {boxesSummary.totalScannedDisplay}
                </span>
                <span className="tw:text-sm tw:text-gray-500">
                  / {boxesSummary.totalUnitsDisplay}
                </span>
              </div>
            </div>
          </div>

          <div>
            <AppButton
              size="small"
              onClick={handleCreateNewBox}
              className="tw:w-full tw:md:w-auto"
            >
              <PlusIcon className="tw:w-4 tw:h-4 tw:mr-2" />
              Create New Box
            </AppButton>
          </div>
        </div>
      </AppCard>

      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:lg:grid-cols-3 tw:gap-4 tw:mb-6">
        {boxes.map((box) => {
          const totalItems = box.totalProducts || 0;
          const totalBoxUnits = box.totalUnits || 0;

          return (
            <div
              key={box._id}
              className="tw:bg-white tw:border tw:border-gray-200 tw:rounded-lg tw:p-3 tw:flex tw:flex-col tw:gap-3 tw:shadow-sm hover:tw:shadow-md tw:transition-shadow"
            >
              <div className="tw:flex tw:justify-between tw:items-start">
                <div className="tw:flex tw:items-center tw:gap-2">
                  <div className="tw:bg-primary/10 tw:p-1.5 tw:rounded-md tw:text-primary">
                    <Box size={18} />
                  </div>
                  <div>
                    <div className="tw:font-semibold tw:text-gray-800 tw:text-sm">
                      {box.displayBoxName}
                    </div>
                    <div className="tw:text-xs tw:text-gray-500">
                      {totalItems} Products | {box.displaySummary}
                    </div>
                  </div>
                </div>
              </div>

              <div className="tw:grid tw:grid-cols-3 tw:gap-2 tw:mt-auto">
                <AppButton
                  size="small"
                  data-boxid={box._id}
                  onClick={() => handleBoxAddItem(box._id)}
                  fill="outline"
                >
                  <PlusIcon size={14} />
                  Add Items
                </AppButton>

                {totalBoxUnits ? (
                  <AppButton
                    size="small"
                    color="light"
                    fill="outline"
                    data-boxid={box._id}
                    onClick={() => handleBoxView(box._id)}
                  >
                    <Eye size={14} />
                    View
                  </AppButton>
                ) : (
                  <AppButton
                    size="small"
                    data-boxid={box._id}
                    onClick={() => handleBoxRemoe(box._id)}
                    color="danger"
                    fill="outline"
                  >
                    <Trash size={14} />
                    Remove
                  </AppButton>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {boxes.length > 0 && (
        <div className="tw:flex tw:justify-end tw:mb-6">
          <AppButton
            color="success"
            onClick={handleConfirmPacking}
            isLoading={completing}
            fill="solid"
          >
            <CheckCircle size={18} className="tw:mr-2" />
            Complete & Submit
          </AppButton>
        </div>
      )}

      <MoveProductsToBoxModal
        show={moveModal.show}
        toBox={moveModal.box}
        callback={handleMoveProductsToBoxCb}
        orderId={orderId || ""}
      />

      <ViewMovedProductsModal
        show={viewModal.show}
        boxId={viewModal.boxId || ""}
        callback={handleViewModalCallback}
      />

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

      <BusyLoader show={busyLoader.show} message={busyLoader.msg} />
    </>
  );
};

export default Boxing;
