import { Pencil, ScanBarcode, Trash2 } from "lucide-react";
import React from "react";

type ScannedItem = { barcode: string; qty: number };

interface MobileViewProps {
  items: ScannedItem[];
  onEdit: (code: string, qty: number) => void;
  onRemove: (code: string) => void;
}

const MobileView: React.FC<MobileViewProps> = ({ items, onEdit, onRemove }) => {
  return (
    <ul className="tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white tw:divide-y tw:divide-gray-100 tw:overflow-hidden">
      {items.map((item, idx) => (
        <li
          key={item.barcode}
          className="tw:flex tw:items-center tw:gap-2.5 tw:px-2.5 tw:py-2"
        >
          <span className="tw:text-[11px] tw:text-gray-400 tw:tabular-nums tw:shrink-0 tw:min-w-4 tw:text-right">
            {idx + 1}
          </span>
          <div className="tw:flex-1 tw:min-w-0">
            <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-[13px] tw:text-gray-900 tw:leading-snug">
              <ScanBarcode className="tw:w-3 tw:h-3 tw:text-gray-400 tw:shrink-0" />
              <span className="tw:font-mono tw:font-semibold tw:tracking-tight tw:truncate">
                {item.barcode}
              </span>
              <span className="tw:text-gray-300">·</span>
              <span className="tw:font-semibold tw:text-gray-700 tw:tabular-nums tw:shrink-0">
                ×{item.qty}
              </span>
            </div>
          </div>
          <div className="tw:flex tw:items-center tw:gap-1 tw:shrink-0">
            <button
              type="button"
              aria-label="Edit"
              onClick={() => onEdit(item.barcode, item.qty)}
              className="tw:inline-flex tw:items-center tw:justify-center tw:w-8 tw:h-8 tw:rounded-full tw:bg-gray-50 tw:border tw:border-gray-200 tw:text-gray-600 tw:transition-colors active:tw:bg-gray-100 hover:tw:bg-gray-100 focus-visible:tw:outline-none focus-visible:tw:ring-2 focus-visible:tw:ring-gray-300"
            >
              <Pencil className="tw:w-3.5 tw:h-3.5" />
            </button>
            <button
              type="button"
              aria-label="Remove"
              onClick={() => onRemove(item.barcode)}
              className="tw:inline-flex tw:items-center tw:justify-center tw:w-8 tw:h-8 tw:rounded-full tw:bg-red-50 tw:border tw:border-red-100 tw:text-red-600 tw:transition-colors active:tw:bg-red-100 hover:tw:bg-red-100 focus-visible:tw:outline-none focus-visible:tw:ring-2 focus-visible:tw:ring-red-300"
            >
              <Trash2 className="tw:w-3.5 tw:h-3.5" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default MobileView;
