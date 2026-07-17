import React, { useMemo, useState } from "react";
import { X, Package, ChevronDown, ChevronUp } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppLink from "~/components/core/link/AppLink";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import SellerService from "~/services/SellerService";
import CompletedBoxSummary from "./CompletedBoxSummary";
import MrpSnapshots from "../../components/MrpSnapshots";

interface CompletedBoxesProps {
  boxes: any[];
  deals?: any[];
  callback: (params: { action: string; data?: any }) => void;
}

// Array of 20 light background colors for box items
const boxColors = [
  "tw:bg-blue-50",
  "tw:bg-green-50",
  "tw:bg-yellow-50",
  "tw:bg-pink-50",
  "tw:bg-purple-50",
  "tw:bg-indigo-50",
  "tw:bg-red-50",
  "tw:bg-orange-50",
  "tw:bg-teal-50",
  "tw:bg-cyan-50",
  "tw:bg-lime-50",
  "tw:bg-amber-50",
  "tw:bg-emerald-50",
  "tw:bg-violet-50",
  "tw:bg-fuchsia-50",
  "tw:bg-rose-50",
  "tw:bg-sky-50",
  "tw:bg-slate-50",
  "tw:bg-stone-50",
  "tw:bg-neutral-50",
];

const CompletedBoxes: React.FC<CompletedBoxesProps> = ({
  boxes,
  deals,
  callback,
}) => {
  const dealUomMap = useMemo(() => {
    const map: Record<string, string> = {};
    (deals || []).forEach((d: any) => {
      if (d?.dealId) map[d.dealId] = d.selectedStockUom || "unit";
    });
    return map;
  }, [deals]);
  const appToast = useAppToast();
  const [alertState, setAlertState] = useState<{
    show: boolean;
    boxId?: string;
  }>({ show: false });
  const [loading, setLoading] = useState(false);
  const [collapsedBoxes, setCollapsedBoxes] = useState<{
    [key: string]: boolean;
  }>({});

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

  const toggleCollapse = (boxId: string) => {
    setCollapsedBoxes((prev) => ({
      ...prev,
      [boxId]: !prev[boxId],
    }));
  };

  // Filter only completed boxes (boxes with "Closed" status)
  const completedBoxes = boxes.filter((box) => box.status !== "Open");

  if (!completedBoxes || completedBoxes.length === 0) {
    return null;
  }

  return (
    <>
      <AppCard
        title={`Packed Boxes Information (${completedBoxes.length})`}
        className="tw:mt-4"
        icon={<Package />}
      >
        {completedBoxes?.[0]?.createdAt && (
          <CompletedBoxSummary
            completedBoxes={completedBoxes}
            dealUomMap={dealUomMap}
          />
        )}
        <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:md:grid-cols-2">
          {completedBoxes.map((box, index) => {
            const boxId = box._id;
            const boxRef = box.packageRefNo;
            const collapsed = collapsedBoxes[boxId] ?? true;
            const boxColor = boxColors[index % boxColors.length];
            const boxDisplaySummary =
              CommonService.groupQtyByUom(
                (box.items || []).map((it: any) => ({
                  uom: dealUomMap[it.dealId] || "unit",
                  qty: Number(it.qty ?? 0) || 0,
                })),
              ).label || "0 units";
            return (
              <div
                key={`${boxId}-${boxRef}`}
                className={`${boxColor} tw:rounded-lg tw:p-4 tw:border tw:border-gray-200`}
              >
                {/* Box Header */}
                <div className="tw:flex tw:items-start tw:justify-between tw:mb-3">
                  <div className="tw:flex tw:items-center tw:gap-3">
                    <div className="tw:w-8 tw:h-8 tw:border-2 tw:border-green-500 tw:rounded tw:flex tw:items-center tw:justify-center">
                      <Package className="tw:w-4 tw:h-4 tw:text-green-500" />
                    </div>
                    <div>
                      <div className="tw:font-semibold tw:text-gray-800">
                        Box #{index + 1} - {boxRef}
                      </div>
                    </div>
                  </div>
                  {box.status === "Packed" && (
                    <button
                      onClick={() => handleRemoveBox(boxId)}
                      className="tw:text-red-500 hover:tw:text-red-700 tw:transition-colors"
                      title="Cancel box"
                      aria-label={`Cancel box ${boxRef}`}
                      disabled={loading}
                    >
                      <X className="tw:w-5 tw:h-5" />
                    </button>
                  )}
                </div>

                {/* Box Details */}
                <div className="tw:border-t tw:border-gray-200 tw:pt-3 tw:mb-3">
                  <div className="tw:flex tw:justify-between tw:text-sm">
                    <span className="tw:text-gray-700">
                      Weight: {box.boxDetails?.weight || 0}{" "}
                      {box.boxDetails?.uom || "kg"}
                    </span>
                    <span className="tw:text-gray-700">
                      Total Items: {box.items.length} ({boxDisplaySummary})
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div className="tw:border-t tw:border-gray-200 tw:pt-3">
                  <div
                    className="tw:flex tw:items-center tw:justify-between tw:cursor-pointer"
                    onClick={() => toggleCollapse(boxId)}
                  >
                    <div className="tw:text-sm tw:text-gray-500 tw:mb-2">
                      Items ({box.items.length})
                    </div>
                    {collapsed ? (
                      <ChevronDown className="tw:w-4 tw:h-4" />
                    ) : (
                      <ChevronUp className="tw:w-4 tw:h-4" />
                    )}
                  </div>
                  {!collapsed && (
                    <div className="tw:space-y-2 tw:mt-2">
                      {box.items.map((item: any) => (
                        <div
                          key={item.dealId}
                          className="tw:bg-white tw:rounded tw:px-2 tw:py-1 tw:border tw:border-gray-100"
                        >
                          <div className="tw:flex tw:justify-between tw:items-start">
                            <AppLink
                              asLink={true}
                              href={`/dashboard/inventory/products/view/${item.dealId}`}
                              className="tw:text-gray-800 tw:text-sm tw:font-medium"
                            >
                              {item.dealName}
                            </AppLink>
                            <span className="tw:bg-gray-200 tw:text-gray-600 tw:px-2 tw:py-1 tw:rounded-full tw:text-xs tw:font-medium">
                              <DisplayQty
                                qty={Number(item.qty) || 0}
                                isLooseQty={false}
                                uom={dealUomMap[item.dealId] || "unit"}
                              />
                            </span>
                          </div>

                          <MrpSnapshots
                            mrpSnapshots={item.mrpSnapshots}
                            uom={dealUomMap[item.dealId] || "unit"}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </AppCard>
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
