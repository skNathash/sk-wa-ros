import React from "react";
import { Check, Copy } from "lucide-react";
import CommonService from "app/services/CommonService";
import useAppToast from "~/hooks/useAppToast";

interface BarcodesListProps {
  barcodes?: Array<string>;
  selected?: string;
  onSelect?: (barcode: string) => void;
}

const BarcodesList: React.FC<BarcodesListProps> = ({
  barcodes = [],
  selected,
  onSelect,
}) => {
  const appToast = useAppToast();

  if (!barcodes || barcodes.length === 0) return null;

  const handleCopy = (value: string) => {
    try {
      CommonService.copyToClipboard(value);
      appToast.show({
        msg: "Barcode copied to clipboard",
        color: "success",
      });
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="tw:space-y-2">
      <div className="tw:text-xs tw:font-medium tw:text-gray-700">
        {onSelect ? "Choose a barcode" : "List of Barcodes"}
      </div>
      {onSelect && (
        <div className="tw:text-xs tw:text-gray-500">
          Tap a barcode to use it. Tap again to clear.
        </div>
      )}
      <div className="tw:flex tw:flex-wrap tw:gap-2">
        {barcodes.map((b, idx) => {
          const isSelected = !!selected && selected === b;
          return (
            <div
              key={idx}
              role={onSelect ? "button" : undefined}
              tabIndex={onSelect ? 0 : undefined}
              aria-pressed={onSelect ? isSelected : undefined}
              onClick={() => onSelect?.(b)}
              onKeyDown={(e) => {
                if (!onSelect) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(b);
                }
              }}
              className={`tw:flex tw:justify-between tw:items-center tw:gap-2 tw:border tw:rounded tw:px-3 tw:py-2 tw:min-w-[160px] ${
                onSelect ? "tw:cursor-pointer hover:tw:border-primary" : ""
              } ${
                isSelected
                  ? "tw:border-primary tw:bg-primary/5"
                  : "tw:border-gray-200 tw:bg-white"
              }`}
            >
              <div className="tw:flex tw:items-center tw:gap-2 tw:min-w-0">
                {onSelect && (
                  <span
                    className={`tw:flex tw:items-center tw:justify-center tw:w-4 tw:h-4 tw:shrink-0 tw:rounded-full tw:border ${
                      isSelected
                        ? "tw:border-primary tw:bg-primary tw:text-white"
                        : "tw:border-gray-300"
                    }`}
                  >
                    {isSelected && <Check size={11} strokeWidth={3} />}
                  </span>
                )}
                <div className="tw:text-sm tw:text-gray-800 tw:truncate">
                  {b}
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy(b);
                }}
                className="tw:flex tw:items-center tw:gap-1 tw:text-gray-500 hover:tw:text-gray-700 tw:cursor-pointer"
                aria-label={`Copy barcode ${b}`}
              >
                <Copy size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BarcodesList;
