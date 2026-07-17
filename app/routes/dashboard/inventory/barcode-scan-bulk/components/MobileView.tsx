import { Pencil, ScanBarcode, Trash2 } from "lucide-react";
import React from "react";

type ScannedItem = { barcode: string; qty: number };

interface MobileViewProps {
  items: ScannedItem[];
  onEdit: (item: ScannedItem) => void;
  onRemove: (item: ScannedItem) => void;
}

const MobileView: React.FC<MobileViewProps> = ({ items, onEdit, onRemove }) => {
  return (
    <ul className="tw:flex tw:flex-col tw:gap-2">
      {items.map((item, idx) => {
        return (
          <li
            key={item.barcode}
            className="tw:relative tw:flex tw:items-center tw:gap-2.5 tw:overflow-hidden tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white tw:pl-3 tw:pr-2 tw:py-2.5"
          >
            {/* Scan-line accent down the captured row. */}
            <span className="tw:absolute tw:left-0 tw:top-0 tw:bottom-0 tw:w-1 tw:bg-blue-500" />

            <span className="tw:shrink-0 tw:text-[11px] tw:font-semibold tw:tabular-nums tw:text-gray-400">
              {idx + 1}
            </span>

            <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-1">
              <div className="tw:flex tw:items-center tw:gap-1.5 tw:min-w-0">
                <ScanBarcode className="tw:w-3.5 tw:h-3.5 tw:shrink-0 tw:text-gray-400" />
                <span className="tw:truncate tw:font-mono tw:text-[13px] tw:font-semibold tw:tracking-tight tw:text-gray-900">
                  {item.barcode}
                </span>
              </div>
              <span className="tw:inline-flex tw:items-baseline tw:gap-1 tw:text-[11px] tw:text-gray-500">
                <span className="tw:font-bold tw:tabular-nums tw:text-blue-700">
                  {item.qty}
                </span>
                <span className="tw:font-medium tw:uppercase tw:tracking-wide tw:text-gray-400">
                  units
                </span>
              </span>
            </div>

            <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-1">
              <button
                type="button"
                aria-label="Edit"
                onClick={() => onEdit(item)}
                className="tw:inline-flex tw:items-center tw:justify-center tw:w-8 tw:h-8 tw:rounded-full tw:bg-gray-50 tw:border tw:border-gray-200 tw:text-gray-600 tw:transition-colors active:tw:bg-gray-100 hover:tw:bg-gray-100 focus-visible:tw:outline-none focus-visible:tw:ring-2 focus-visible:tw:ring-gray-300 tw:cursor-pointer"
              >
                <Pencil className="tw:w-3.5 tw:h-3.5" />
              </button>
              <button
                type="button"
                aria-label="Remove"
                onClick={() => onRemove(item)}
                className="tw:inline-flex tw:items-center tw:justify-center tw:w-8 tw:h-8 tw:rounded-full tw:bg-red-50 tw:border tw:border-red-100 tw:text-red-600 tw:transition-colors active:tw:bg-red-100 hover:tw:bg-red-100 focus-visible:tw:outline-none focus-visible:tw:ring-2 focus-visible:tw:ring-red-300 tw:cursor-pointer"
              >
                <Trash2 className="tw:w-3.5 tw:h-3.5" />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default MobileView;
