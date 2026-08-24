import React, { useMemo, useState } from "react";
import { Barcode, Check, Package } from "lucide-react";
import { buildTile } from "./item-pick/helper";
import AppModal from "~/components/core/modal/AppModal";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import Amount from "~/components/core/amount/Amount";
import ImgRender from "~/components/core/img/ImgRender";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";
import useAppToast from "~/hooks/useAppToast";
import SellerService from "~/services/SellerService";

interface CompletedBoxesProps {
  show: boolean;
  onClose: () => void;
  boxes: any[];
  // When set, the modal shows just this box's details
  boxId?: string | null;
  deals?: any[];
  orderRefNo?: string;
  customerName?: string;
  callback: (params: { action: string; data?: any }) => void;
}

const CompletedBoxes: React.FC<CompletedBoxesProps> = ({
  show,
  onClose,
  boxes,
  boxId,
  deals,
  orderRefNo,
  customerName,
  callback,
}) => {
  // dealId → order-line details (image, unit price, uom) for the rows
  const dealMap = useMemo(() => {
    const map: Record<
      string,
      { image?: string; price: number; uom: string }
    > = {};
    (deals || []).forEach((d: any) => {
      if (!d?.dealId) return;
      map[d.dealId] = {
        image: d.dealDetails?.images?.[0],
        price: Number(d.price) || 0,
        uom: d.selectedStockUom || "unit",
      };
    });
    return map;
  }, [deals]);
  const appToast = useAppToast();
  const [alertState, setAlertState] = useState<{
    show: boolean;
    boxId?: string;
  }>({ show: false });
  const [loading, setLoading] = useState(false);

  const handleRemoveBox = (boxId: string) => {
    setAlertState({ show: true, boxId });
  };

  const handleConfirmCancel = async () => {
    if (!alertState.boxId) return;
    setLoading(true);
    try {
      // Call the cancelBoxAfterPack API as requested
      const resp = await SellerService.cancelBoxAfterPack(alertState.boxId);
      if (resp.statusCode === 200) {
        appToast.show({
          msg: "Box cancelled successfully!",
          color: "success",
        });
        callback({ action: "removeBox", data: { boxId: alertState.boxId } });
        setAlertState({ show: false });
        onClose();
      } else {
        appToast.show({
          msg: resp.data?.message || "Failed to cancel package",
          color: "error",
        });
      }
    } catch (err: any) {
      appToast.show({
        msg: err?.message || "An error occurred while cancelling the package",
        color: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDialog = () => {
    setAlertState({ show: false });
  };

  // Filter only completed boxes (boxes with "Closed" status)
  const allCompletedBoxes = boxes.filter((box) => box.status !== "Open");
  const completedBoxes = boxId
    ? allCompletedBoxes.filter((box) => box._id === boxId)
    : allCompletedBoxes;

  if (!completedBoxes || completedBoxes.length === 0) {
    return null;
  }

  // A line's amount comes from its MRP snapshots when present, else the
  // order line's unit price × boxed qty.
  const getLineParts = (item: any) => {
    const deal = dealMap[item.dealId];
    const snapshots = (item.mrpSnapshots || []).filter(
      (s: any) => Number(s.quantity ?? s.qty ?? s.usedQty ?? 0) > 0,
    );
    if (snapshots.length > 0) {
      const parts = snapshots.map((s: any) => ({
        qty: Number(s.quantity ?? s.qty ?? s.usedQty ?? 0),
        rate: Number(s.mrp) || 0,
      }));
      return { parts, uom: deal?.uom || "unit" };
    }
    return {
      parts: [{ qty: Number(item.qty) || 0, rate: deal?.price || 0 }],
      uom: deal?.uom || "unit",
    };
  };

  const selectedBox = boxId ? completedBoxes[0] : null;
  const subtitle = [orderRefNo ? `Order ${orderRefNo}` : "", customerName]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <AppModal
        show={show}
        callback={({ action }) => {
          if (action === "close") onClose();
        }}
      >
        <AppModal.Title onClose={onClose}>
          <div className="tw:flex tw:items-center tw:gap-3 tw:min-w-0">
            <div className="tw:w-10 tw:h-10 tw:rounded-xl tw:bg-orange-100 tw:text-orange-600 tw:flex tw:items-center tw:justify-center tw:shrink-0">
              <Package className="tw:w-5 tw:h-5" />
            </div>
            <div className="tw:min-w-0">
              <div className="tw:text-sm tw:text-gray-900 tw:truncate">
                {selectedBox ? (
                  <>
                    Contents of{" "}
                    <span className="tw:font-bold">
                      {selectedBox.packageRefNo}
                    </span>
                  </>
                ) : (
                  <span className="tw:font-bold">
                    Packed Boxes ({completedBoxes.length})
                  </span>
                )}
              </div>
              {subtitle ? (
                <div className="tw:text-xs tw:text-gray-500 tw:font-normal tw:truncate">
                  {subtitle}
                </div>
              ) : null}
            </div>
          </div>
        </AppModal.Title>
        <AppModal.Content>
          <div className="tw:space-y-5">
            {completedBoxes.map((box) => {
              const boxSubtotal = (box.items || []).reduce(
                (sum: number, item: any) =>
                  sum +
                  getLineParts(item).parts.reduce(
                    (s: number, p: any) => s + p.qty * p.rate,
                    0,
                  ),
                0,
              );
              return (
                <div key={box._id}>
                  {/* Shipping-label plate: barcode glyph + box code on a dark
                      ground, box status as the badge. */}
                  <div className="tw:bg-gray-900 tw:rounded-xl tw:px-4 tw:py-3 tw:flex tw:items-center tw:justify-between tw:gap-3 tw:mb-3">
                    <div className="tw:flex tw:items-center tw:gap-3 tw:min-w-0">
                      <Barcode
                        size={24}
                        className="tw:text-emerald-400 tw:shrink-0"
                      />
                      <div className="tw:min-w-0">
                        <div className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-[0.14em] tw:text-emerald-500/80">
                          Box
                        </div>
                        <div className="tw:font-mono tw:text-sm tw:font-bold tw:tracking-wider tw:text-emerald-300 tw:truncate">
                          {box.packageRefNo}
                        </div>
                      </div>
                    </div>
                    <span className="tw:inline-flex tw:items-center tw:gap-1 tw:bg-emerald-500 tw:text-emerald-950 tw:rounded-full tw:px-2.5 tw:py-1 tw:text-[10px] tw:font-extrabold tw:uppercase tw:tracking-wide tw:shrink-0">
                      {box.status}
                      <Check size={12} strokeWidth={3} />
                    </span>
                  </div>

                  <div className="tw:rounded-2xl tw:border tw:border-gray-200 tw:bg-white tw:overflow-hidden">
                    {(box.items || []).map((item: any) => {
                      const deal = dealMap[item.dealId];
                      const tile = buildTile(item.dealName || "");
                      const { parts, uom } = getLineParts(item);
                      const lineTotal = parts.reduce(
                        (s: number, p: any) => s + p.qty * p.rate,
                        0,
                      );
                      return (
                        <div
                          key={item.dealId}
                          className="tw:flex tw:items-center tw:gap-3 tw:px-3 tw:py-2.5 tw:border-b tw:border-gray-100 tw:last:border-b-0"
                        >
                          {deal?.image ? (
                            <ImgRender
                              assetId={deal.image}
                              alt={item.dealName}
                              className="tw:w-9 tw:h-9 tw:rounded-lg tw:object-cover tw:shrink-0"
                            />
                          ) : (
                            <div
                              className="op-tile"
                              style={{ backgroundColor: tile.color }}
                            >
                              {tile.code}
                            </div>
                          )}

                          <div className="tw:flex-1 tw:min-w-0">
                            <div className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:truncate">
                              {item.dealName}
                            </div>
                            <div className="tw:text-xs tw:text-gray-500">
                              {parts.map((p: any, idx: number) => (
                                <span key={idx}>
                                  {idx > 0 ? ", " : ""}
                                  Qty{" "}
                                  <span className="tw:font-semibold tw:text-gray-700">
                                    <DisplayQty
                                      qty={p.qty}
                                      isLooseQty={false}
                                      uom={uom}
                                      hideDefaultUom
                                    />
                                  </span>{" "}
                                  × <Amount value={p.rate} />
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="tw:text-sm tw:font-bold tw:text-emerald-700 tw:shrink-0">
                            <Amount value={lineTotal} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="tw:flex tw:items-center tw:justify-between tw:bg-gray-100 tw:rounded-xl tw:px-4 tw:py-3 tw:mt-3">
                    <span className="tw:text-sm tw:text-gray-500">
                      Box subtotal
                    </span>
                    <span className="tw:text-lg tw:font-extrabold tw:text-emerald-800">
                      <Amount value={boxSubtotal} />
                    </span>
                  </div>

                  {box.status === "Packed" && (
                    <div className="tw:flex tw:justify-end tw:mt-2">
                      <button
                        onClick={() => handleRemoveBox(box._id)}
                        className="tw:text-xs tw:font-medium tw:text-red-500 hover:tw:text-red-600 tw:transition-colors"
                        disabled={loading}
                      >
                        Cancel this box
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </AppModal.Content>
      </AppModal>
      <AppAlertDialog
        show={alertState.show}
        title="Cancel Box?"
        description="Are you sure you want to cancel this box?"
        onConfirm={handleConfirmCancel}
        onCancel={handleCancelDialog}
        okText={loading ? "Cancelling..." : "Yes, Cancel"}
        cancelText="No"
        type="confirm"
      />
    </>
  );
};

export default CompletedBoxes;
