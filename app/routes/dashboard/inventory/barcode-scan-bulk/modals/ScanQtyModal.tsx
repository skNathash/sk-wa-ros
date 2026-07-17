import React, { useEffect, useState } from "react";
import { Barcode, Minus, Plus } from "lucide-react";

import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import MiscService from "~/services/MiscService";

const QTY_CHIPS = [1, 5, 10, 25, 50, 100];

type Action = "save" | "save-scan" | "close";

interface ScanQtyModalProps {
  show: boolean;
  /** The scanned barcode or typed product name. */
  barcode: string;
  initialQty?: number;
  callback: (r: {
    action: Action;
    data?: { barcode: string; qty: number };
  }) => void;
}

const ScanQtyModal: React.FC<ScanQtyModalProps> = ({
  show,
  barcode,
  initialQty,
  callback,
}) => {
  // Hold the field as a string so it can be emptied while typing. An empty
  // field resolves to 0 for all the numeric logic below, but we never force a
  // "0" back into the input — otherwise the user can't clear it to retype.
  const [qtyStr, setQtyStr] = useState<string>(
    initialQty != null ? String(initialQty) : "",
  );
  const qty = qtyStr === "" ? 0 : Math.max(0, parseInt(qtyStr, 10) || 0);
  const isEdit = typeof initialQty === "number";
  const hasCordova = MiscService.hasCordova();

  useEffect(() => {
    if (show) setQtyStr(initialQty != null ? String(initialQty) : "");
  }, [show, barcode, initialQty]);

  const bump = (delta: number) => setQtyStr(String(Math.max(0, qty + delta)));
  const pick = (n: number) => setQtyStr(String(n));

  const handleClose = () => callback({ action: "close" });

  const emit = (action: Exclude<Action, "close"> = "save") => {
    if (!barcode || qty < 0) return;
    callback({ action, data: { barcode, qty } });
  };

  return (
    <AppModal show={show} callback={handleClose}>
      <AppModal.Title onClose={handleClose}>
        <div className="tw:flex tw:items-center tw:gap-2.5">
          <div className="tw:w-8 tw:h-8 tw:rounded-lg tw:bg-primary/10 tw:flex tw:items-center tw:justify-center tw:shrink-0">
            <Barcode className="tw:w-4 tw:h-4 tw:text-primary" />
          </div>
          <span className="tw:font-semibold">
            {isEdit ? "Edit quantity" : "Add quantity"}
          </span>
        </div>
      </AppModal.Title>

      <AppModal.Content>
        <div className="tw:flex tw:flex-col tw:gap-3">
          {/* Quiet caption: the item this count belongs to. */}
          <div className="tw:flex tw:items-baseline tw:gap-2 tw:text-xs tw:min-w-0">
            <span className="tw:text-gray-400 tw:shrink-0">Item</span>
            <span className="tw:font-mono tw:text-gray-900 tw:break-all">
              {barcode}
            </span>
          </div>

          {/* Hero: the quantity. Centered, flanked by touch steppers. */}
          <div className="tw:flex tw:flex-col tw:gap-2.5">
            <div className="tw:flex tw:items-center tw:gap-2 tw:bg-gray-50 tw:border tw:border-gray-200 tw:rounded-xl tw:p-1.5 tw:transition tw:focus-within:border-primary tw:focus-within:ring-2 tw:focus-within:ring-primary/10">
              <button
                type="button"
                onClick={() => bump(-1)}
                disabled={qty <= 0}
                className="tw:w-9 tw:h-9 tw:shrink-0 tw:rounded-full tw:bg-white tw:border tw:border-gray-300 tw:shadow-sm tw:text-gray-700 tw:flex tw:items-center tw:justify-center tw:transition tw:cursor-pointer tw:hover:border-gray-400 tw:hover:text-gray-900 tw:active:scale-95 tw:disabled:opacity-40 tw:disabled:cursor-not-allowed tw:disabled:hover:border-gray-300 tw:disabled:hover:text-gray-700"
                aria-label="Decrease quantity"
              >
                <Minus className="tw:w-4 tw:h-4" />
              </button>

              <input
                autoFocus
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="0"
                value={qtyStr}
                onChange={(e) => {
                  // Keep digits only; allow empty so the field can be cleared.
                  const next = e.target.value.replace(/[^0-9]/g, "");
                  setQtyStr(next);
                }}
                onKeyDown={(e) => e.key === "Enter" && emit("save")}
                aria-label="Quantity"
                className="tw:flex-1 tw:w-full tw:min-w-0 tw:bg-transparent tw:text-center tw:text-3xl tw:font-bold tw:text-primary tw:tabular-nums tw:outline-none tw:appearance-none placeholder:tw:text-gray-300"
              />

              <button
                type="button"
                onClick={() => bump(1)}
                className="tw:w-9 tw:h-9 tw:shrink-0 tw:rounded-full tw:bg-primary tw:border tw:border-primary tw:shadow-sm tw:text-white tw:flex tw:items-center tw:justify-center tw:transition tw:cursor-pointer tw:hover:bg-primary-dark tw:hover:border-primary-dark tw:active:scale-95"
                aria-label="Increase quantity"
              >
                <Plus className="tw:w-4 tw:h-4" />
              </button>
            </div>

            {/* Quick pick: tapping is faster than typing common counts. */}
            <div className="tw:flex tw:flex-wrap tw:gap-1.5">
              {QTY_CHIPS.map((n) => {
                const active = qty === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => pick(n)}
                    className={
                      "tw:px-3 tw:py-1 tw:rounded-full tw:text-xs tw:font-medium tw:border tw:transition tw:tabular-nums tw:cursor-pointer " +
                      (active
                        ? "tw:bg-primary tw:text-white tw:border-primary tw:shadow-sm"
                        : "tw:bg-white tw:text-gray-600 tw:border-gray-200 tw:hover:border-primary tw:hover:text-primary")
                    }
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </AppModal.Content>

      <AppModal.Footer className="tw:border-t tw:border-gray-100">
        {hasCordova && !isEdit ? (
          // Fast-scan flow: "Save & scan next" is the dominant repeated action.
          <div className="tw:flex tw:flex-col tw:gap-2 tw:w-full">
            <AppButton onClick={() => emit("save-scan")} className="tw:w-full">
              Save &amp; scan next
            </AppButton>
            <div className="tw:flex tw:gap-2">
              <AppButton
                onClick={handleClose}
                color="light"
                fill="outline"
                className="tw:flex-1"
              >
                Cancel
              </AppButton>
              <AppButton
                onClick={() => emit("save")}
                color="light"
                fill="outline"
                className="tw:flex-1"
              >
                Save &amp; close
              </AppButton>
            </div>
          </div>
        ) : (
          <div className="tw:flex tw:justify-end tw:gap-2 tw:w-full">
            <AppButton onClick={handleClose} color="light" fill="outline">
              Cancel
            </AppButton>
            <AppButton onClick={() => emit("save")}>
              {isEdit ? "Update" : "Save & close"}
            </AppButton>
          </div>
        )}
      </AppModal.Footer>
    </AppModal>
  );
};

export default ScanQtyModal;
