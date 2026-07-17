import React, { useEffect, useState } from "react";
import { Minus, Plus, Package, Check } from "lucide-react";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import { Input } from "~/components/ui/input";
import AppBadge from "~/components/core/badge/AppBadge";
import Divider from "~/components/core/divider/Divider";
import SellerService from "~/services/SellerService";
import Amount from "~/components/core/amount/Amount";

interface MoveToBoxModalProps {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  dealName?: string;
  dealId?: string;
  toBox: any;
  pendingQty?: number;
  pickedDetails?: any[];
}

const MoveToBoxModal: React.FC<MoveToBoxModalProps> = ({
  show,
  callback,
  dealName = "",
  dealId,
  toBox,
  pickedDetails,
  pendingQty,
}) => {
  const [qty, setQty] = useState<number | "">(0);
  const [error, setError] = useState<string>("");

  const [mrpTotals, setMrpTotals] = useState<any[]>([]);

  const [maxQty, setMaxQty] = useState<number>(0);
  const [selectedMrp, setSelectedMrp] = useState<string>("");

  // default select all MRPs when modal opens
  useEffect(() => {
    if (show) {
      let mrpData: Record<string, any> = {};

      pickedDetails?.forEach((p) => {
        p.snapshots.forEach((s: any) => {
          if (!mrpData[s.mrp]) {
            mrpData[s.mrp] = {
              mrp: s.mrp,
              data: [],
              totalQty: 0,
            };
          }
          mrpData[s.mrp].totalQty += s.quantity;
          mrpData[s.mrp].data.push(s);
        });
      });

      const mrpValues = Object.values(mrpData);
      setMrpTotals(mrpValues);

      // Reset error state
      setError("");

      // Auto-select the first available MRP (if any)
      if (mrpValues.length > 0) {
        const firstMrp = mrpValues[0] as any;
        setSelectedMrp(firstMrp.mrp);
        setMaxQty(firstMrp.totalQty);
        setQty(firstMrp.totalQty); // Auto-fill quantity
      } else {
        // Reset states when no MRPs
        setQty(0);
        setSelectedMrp("");
        setMaxQty(0);
      }
    }
  }, [show, pickedDetails]);

  const handleClose = () => {
    callback({ action: "close" });
    setQty(0);
    setError("");
  };

  const increase = () => {
    const cur = typeof qty === "number" ? qty : 0;
    const next = cur + 1;
    if (maxQty !== undefined && next > maxQty) return;
    setQty(next);
    setError("");
  };

  const decrease = () => {
    const cur = typeof qty === "number" ? qty : 0;
    const next = cur - 1;
    setQty(next < 0 ? 0 : next);
    setError("");
  };

  const handleQtyChange = (val: string) => {
    if (val === "") {
      setQty("");
      return;
    }
    const num = Number(val);
    if (Number.isNaN(num)) return;
    if (num < 0) {
      setQty(0);
      return;
    }
    if (maxQty !== undefined && num > maxQty) {
      setQty(maxQty);
      return;
    }
    setQty(num);
  };

  const handleMove = async () => {
    const moveQty = typeof qty === "number" ? qty : 0;
    if (moveQty <= 0) {
      setError("Please enter a quantity greater than zero");
      return;
    }

    let snapshots: any[] = [];
    let remainingQty = Number(qty);

    // If an MRP is selected, only consume snapshots from that MRP
    pickedDetails?.forEach((p) => {
      p.snapshots.forEach((s: any) => {
        if (selectedMrp && s.mrp !== selectedMrp) return; // skip non-selected MRPs

        if (remainingQty > 0) {
          const usedQty = Math.min(remainingQty, s.quantity);
          snapshots.push({ ...s, usedQty: usedQty });
          remainingQty -= usedQty;
        }
      });
    });

    // If user selected an MRP, ensure they are not trying to move more than available for that MRP
    if (selectedMrp && maxQty !== undefined && moveQty > maxQty) {
      setError(
        `Please enter a quantity less than or equal to ${maxQty} for the selected MRP`
      );
      return;
    }

    const payload = {
      pickingId: pickedDetails?.[0]?.pickingId,
      items: snapshots.map((s) => ({
        dealId: dealId,
        qty: s.usedQty,
        mrp: s.mrp,
        snapshotId: s.snapshotId,
      })),
    };

    const response = await SellerService.saveBox(toBox?._id || "", payload);

    if (response.statusCode === 200) {
      callback({ action: "move", data: { qty: moveQty } });
      setQty(0);
      setError("");
    } else {
      setError(response.data.message);
    }

    // callback({ action: "move", data: { qty: moveQty } });
    // setQty(0);
    // setError("");
  };

  const onMrpClick = (mrp: string) => {
    const mrpData = mrpTotals.find((m) => m.mrp === mrp);
    if (mrpData) {
      setMaxQty(mrpData.totalQty);
      setSelectedMrp(mrp);
      setQty(mrpData.totalQty); // Auto-fill quantity
    } else {
      setMaxQty(0);
      setSelectedMrp("");
      setQty(0);
    }
  };

  return (
    <AppModal show={show} callback={handleClose} className="tw:max-h-[90vh]">
      <AppModal.Title onClose={handleClose}>
        <div>Move To Box</div>
        {dealName && (
          <div className="tw:text-base tw:font-semibold tw:text-blue-700 tw:mt-1">
            {dealName}
          </div>
        )}
      </AppModal.Title>

      <AppModal.Content className="tw:bg-gray-100">
        <div className="tw:space-y-3 tw:p-0.5 tw:py-4">
          <AppCard>
            <div className="tw:space-y-2">
              <div className="tw:text-sm tw:text-gray-500">Moving To</div>
              <div className="tw:flex tw:items-center tw:gap-2">
                <Package className="tw:w-4 tw:h-4 tw:text-gray-600" />
                <div className="tw:text-base tw:font-semibold">
                  {toBox?.displayBoxName || `BOX #1 - ${toBox?.packageRefNo}`}
                </div>
              </div>
            </div>

            {mrpTotals.length > 0 && (
              <>
                <Divider className="tw:my-3" />
                <div className="tw:mt-3">
                  <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
                    <div className="tw:text-sm tw:font-semibold tw:text-gray-700">
                      Select MRP
                    </div>
                  </div>
                  <div className="tw:flex tw:gap-3 tw:flex-wrap">
                    {mrpTotals.map((m) => (
                      <div
                        key={String(m.mrp)}
                        onClick={() => onMrpClick(m.mrp)}
                        className={`tw:cursor-pointer tw:border-2 tw:rounded-lg tw:px-4 tw:py-3 tw:transition-all tw:duration-200 tw:min-w-[120px] tw:flex tw:flex-col tw:justify-center tw:items-center tw:text-center tw:relative ${
                          m.mrp === selectedMrp
                            ? "tw:border-blue-500 tw:bg-blue-50"
                            : "tw:border-gray-200 tw:bg-white hover:tw:border-gray-300 tw:shadow-sm"
                        }`}
                      >
                        {m.mrp === selectedMrp && (
                          <div className="tw:absolute tw:top-1 tw:right-1 tw:bg-blue-500 tw:text-white tw:rounded-full tw:p-0.5">
                            <Check className="tw:w-3 tw:h-3" />
                          </div>
                        )}
                        <div className="tw:flex tw:flex-col tw:items-center tw:gap-1">
                          <div className="tw:text-base tw:font-bold tw:text-gray-900">
                            <Amount value={m.mrp} decimalPlaces={2} />
                          </div>
                          <div className="tw:text-xs tw:text-gray-500">
                            Qty: {m.totalQty}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <Divider className="tw:my-3" />
              </>
            )}

            <div className="tw:mt-4 tw:rounded-lg">
              <div className="tw:flex tw:items-center tw:justify-between tw:gap-4">
                <div className="tw:space-y-1">
                  <div className="tw:text-xs tw:text-gray-500 tw:uppercase tw:tracking-wide tw:font-medium">
                    Quantity to move
                  </div>
                </div>
                <div className="tw:space-y-1 tw:text-center">
                  <div className="tw:flex tw:items-center tw:gap-2 tw:justify-end">
                    <button className="tw:cursor-pointer" onClick={decrease}>
                      <Minus size={16} />
                    </button>
                    <Input
                      type="number"
                      min="0"
                      value={qty === "" ? 0 : qty}
                      onChange={(e) => handleQtyChange(e.target.value)}
                      placeholder="0"
                      className="tw:text-sm tw:font-medium tw:border-gray-300 focus:tw:border-blue-500 focus:tw:ring-blue-500 tw:h-8 tw:w-20 tw:text-center"
                    />
                    <button className="tw:cursor-pointer" onClick={increase}>
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="tw:text-xs tw:text-blue-500 tw:mt-1">
                    Max qty: {maxQty}
                  </div>
                </div>
              </div>
            </div>
          </AppCard>
        </div>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:space-y-3 tw:flex-1">
          {error && (
            <div className="tw:bg-red-50 tw:border tw:border-red-200 tw:rounded-lg tw:p-3">
              <div className="tw:flex tw:items-center tw:gap-2">
                <div className="tw:text-red-500 tw:text-sm">⚠️</div>
                <div className="tw:text-red-700 tw:text-xs tw:font-medium">
                  {error}
                </div>
              </div>
            </div>
          )}

          <div className="tw:flex tw:items-center tw:justify-end tw:gap-3">
            <AppButton
              fill="outline"
              onClick={handleClose}
              className="tw:px-4 tw:py-1.5 tw:text-sm"
              color="dark"
            >
              Cancel
            </AppButton>
            <AppButton
              onClick={handleMove}
              color="dark"
              className="tw:px-4 tw:py-1.5 tw:text-sm"
            >
              Move
            </AppButton>
          </div>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default MoveToBoxModal;
