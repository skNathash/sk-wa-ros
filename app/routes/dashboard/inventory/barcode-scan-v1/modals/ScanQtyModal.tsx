import React, { useEffect, useState } from "react";
import { Barcode, Minus, Plus } from "lucide-react";

import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import MiscService from "~/services/MiscService";

const QTY_CHIPS = [1, 5, 10, 25, 50, 100];

type Action = "save" | "save-scan" | "close";

interface ScanQtyModalProps {
  show: boolean;
  barcode: string;
  initialQty?: number;
  callback: (r: { action: Action; data?: { barcode: string; qty: number } }) => void;
}

const ScanQtyModal: React.FC<ScanQtyModalProps> = ({ show, barcode, initialQty, callback }) => {
  const [qty, setQty] = useState<number>(initialQty ?? 0);
  const isEdit = typeof initialQty === "number";
  const hasCordova = MiscService.hasCordova();

  useEffect(() => {
    if (show) setQty(initialQty ?? 0);
  }, [show, barcode, initialQty]);

  const bump = (delta: number) => setQty((q) => Math.max(0, q + delta));
  const pick = (n: number) => setQty(n);

  const handleClose = () => callback({ action: "close" });

  const emit = (action: Exclude<Action, "close"> = "save") => {
    if (!barcode || qty < 0) return;
    callback({ action, data: { barcode, qty } });
  };

  return (
    <AppModal show={show} callback={handleClose}>
      <AppModal.Title onClose={handleClose}>
        <div className="tw:flex tw:items-center tw:gap-2">
          <div className="tw:w-8 tw:h-8 tw:rounded-lg tw:bg-blue-50 tw:flex tw:items-center tw:justify-center">
            <Barcode className="tw:w-4 tw:h-4 tw:text-blue-600" />
          </div>
          <div className="tw:flex tw:flex-col">
            <span className="tw:font-semibold">
              {isEdit ? "Edit quantity" : "How many of this item?"}
            </span>
            <span className="tw:text-[11px] tw:text-gray-500 tw:font-normal">
              {isEdit
                ? "Update the count for this barcode."
                : "Enter the quantity, then save to add to your list."}
            </span>
          </div>
        </div>
      </AppModal.Title>

      <AppModal.Content>
        <div className="tw:space-y-5">
          <div className="tw:bg-linear-to-br tw:from-gray-50 tw:to-gray-100 tw:border tw:border-gray-200 tw:rounded-lg tw:px-3 tw:py-2.5">
            <div className="tw:text-[11px] tw:uppercase tw:tracking-wider tw:text-gray-500 tw:font-medium tw:mb-0.5">
              Barcode
            </div>
            <div className="tw:font-mono tw:text-sm tw:text-gray-900 tw:break-all">{barcode}</div>
          </div>

          <div className="tw:flex tw:flex-col tw:gap-2">
            <label className="tw:text-sm tw:font-medium tw:text-gray-700">Quantity</label>

            <div className="tw:flex tw:items-stretch tw:gap-2">
              <button
                type="button"
                onClick={() => bump(-1)}
                disabled={qty <= 0}
                className="tw:w-10 tw:rounded-lg tw:border tw:border-gray-300 tw:bg-white tw:text-gray-700 tw:flex tw:items-center tw:justify-center tw:transition hover:tw:bg-gray-50 hover:tw:border-gray-400 disabled:tw:opacity-40 disabled:tw:cursor-not-allowed"
                aria-label="decrement"
              >
                <Minus className="tw:w-4 tw:h-4" />
              </button>
              <input
                autoFocus
                type="number"
                min={0}
                value={qty}
                onChange={(e) => setQty(Math.max(0, Number(e.target.value) || 0))}
                onKeyDown={(e) => e.key === "Enter" && emit("save")}
                className="tw:flex-1 tw:border tw:border-gray-300 tw:rounded-lg tw:px-3 tw:py-2 tw:text-center tw:text-lg tw:font-semibold tw:text-gray-900 tw:tabular-nums focus:tw:outline-none focus:tw:border-blue-500 focus:tw:ring-2 focus:tw:ring-blue-100"
              />
              <button
                type="button"
                onClick={() => bump(1)}
                className="tw:w-10 tw:rounded-lg tw:border tw:border-gray-300 tw:bg-white tw:text-gray-700 tw:flex tw:items-center tw:justify-center tw:transition hover:tw:bg-gray-50 hover:tw:border-gray-400"
                aria-label="increment"
              >
                <Plus className="tw:w-4 tw:h-4" />
              </button>
            </div>

            <div className="tw:flex tw:flex-col tw:gap-1.5 tw:mt-1">
              <div className="tw:text-[11px] tw:uppercase tw:tracking-wider tw:text-gray-500 tw:font-medium">
                Quick pick
              </div>
              <div className="tw:flex tw:flex-wrap tw:gap-1.5">
                {QTY_CHIPS.map((n) => {
                  const active = qty === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => pick(n)}
                      className={
                        "tw:px-3 tw:py-1.5 tw:rounded-full tw:text-sm tw:font-medium tw:border tw:transition tw:tabular-nums " +
                        (active
                          ? "tw:bg-blue-600 tw:text-white tw:border-blue-600 tw:shadow-sm"
                          : "tw:bg-white tw:text-gray-700 tw:border-gray-300 hover:tw:border-blue-400 hover:tw:text-blue-600")
                      }
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:flex-col tw:gap-1.5 tw:w-full">
          <div className="tw:flex tw:justify-end tw:gap-2 tw:flex-wrap">
            <AppButton onClick={handleClose} color="light" fill="outline">
              Cancel
            </AppButton>
            <AppButton
              onClick={() => emit("save")}
              color={hasCordova && !isEdit ? "light" : "primary"}
              fill={hasCordova && !isEdit ? "outline" : "solid"}
            >
              {isEdit ? "Update" : "Save & close"}
            </AppButton>
            {hasCordova && !isEdit && (
              <AppButton onClick={() => emit("save-scan")}>
                Save & scan next
              </AppButton>
            )}
          </div>
          {hasCordova && !isEdit && (
            <div className="tw:text-[11px] tw:text-gray-500 tw:text-right">
              "Save &amp; scan next" opens the scanner again for the next item.
            </div>
          )}
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default ScanQtyModal;
