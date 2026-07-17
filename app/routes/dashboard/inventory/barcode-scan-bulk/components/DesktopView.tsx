import React from "react";
import { ScanBarcode } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";

type ScannedItem = { barcode: string; qty: number };

interface DesktopViewProps {
  items: ScannedItem[];
  onEdit: (item: ScannedItem) => void;
  onRemove: (item: ScannedItem) => void;
}

const ROW_GRID =
  "tw:grid tw:grid-cols-[2.5rem_1fr_7rem_9.5rem] tw:items-center tw:gap-3";

const DesktopView: React.FC<DesktopViewProps> = ({ items, onEdit, onRemove }) => {
  return (
    <div className="tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white tw:overflow-hidden">
      {/* Column labels — kept quiet so the scanned rows carry the page. */}
      <div
        className={`${ROW_GRID} tw:px-4 tw:py-2 tw:bg-slate-50 tw:border-b tw:border-gray-200`}
      >
        <span className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-gray-400">
          #
        </span>
        <span className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-gray-400">
          Barcode / Name
        </span>
        <span className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-gray-400 tw:text-center">
          Quantity
        </span>
        <span aria-hidden />
      </div>

      {items.map((item, idx) => {
        return (
          <div
            key={item.barcode}
            className={`${ROW_GRID} tw:group tw:relative tw:px-4 tw:py-2.5 tw:border-b tw:border-gray-100 last:tw:border-b-0 tw:transition-colors hover:tw:bg-blue-50/40`}
          >
            {/* Scan-line accent — the row reads as a captured scan on hover. */}
            <span className="tw:absolute tw:left-0 tw:top-0 tw:bottom-0 tw:w-0.5 tw:bg-blue-500 tw:opacity-0 tw:transition-opacity group-hover:tw:opacity-100" />

            <span className="tw:text-xs tw:font-semibold tw:text-gray-400 tw:tabular-nums">
              {idx + 1}
            </span>

            <span className="tw:inline-flex tw:items-center tw:gap-1.5 tw:min-w-0 tw:w-fit tw:max-w-full tw:text-sm tw:font-mono tw:font-medium tw:tracking-wide tw:text-gray-800 tw:bg-gray-50 tw:border tw:border-gray-200 tw:rounded-md tw:px-2 tw:py-1">
              <ScanBarcode className="tw:w-3.5 tw:h-3.5 tw:text-gray-400 tw:shrink-0" />
              <span className="tw:truncate">{item.barcode}</span>
            </span>

            <div className="tw:flex tw:justify-center">
              <span className="tw:inline-flex tw:items-baseline tw:gap-1 tw:rounded-lg tw:border tw:border-blue-100 tw:bg-blue-50 tw:px-2.5 tw:py-1 tw:text-blue-700">
                <span className="tw:text-sm tw:font-bold tw:tabular-nums tw:leading-none">
                  {item.qty}
                </span>
                <span className="tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-wide tw:text-blue-400">
                  units
                </span>
              </span>
            </div>

            <div className="tw:flex tw:gap-2 tw:justify-end">
              <AppButton fill="outline" size="small" onClick={() => onEdit(item)}>
                Edit
              </AppButton>
              <AppButton
                fill="outline"
                color="danger"
                size="small"
                onClick={() => onRemove(item)}
              >
                Remove
              </AppButton>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DesktopView;
