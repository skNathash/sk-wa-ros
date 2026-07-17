import React from "react";
import { Copy } from "lucide-react";
import CommonService from "app/services/CommonService";
import useAppToast from "~/hooks/useAppToast";

interface BarcodesListProps {
  barcodes?: Array<string>;
}

const BarcodesList: React.FC<BarcodesListProps> = ({ barcodes = [] }) => {
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
        List of Barcodes
      </div>
      <div className="tw:flex tw:flex-wrap tw:gap-2">
        {barcodes.map((b, idx) => {
          return (
            <div
              key={idx}
              className="tw:flex tw:justify-between tw:items-center tw:gap-2 tw:border tw:border-gray-100 tw:rounded tw:px-3 tw:py-2 tw:bg-white tw:min-w-[160px]"
            >
              <div className="tw:text-sm tw:text-gray-800 tw:truncate">{b}</div>
              <button
                type="button"
                onClick={() => handleCopy(b)}
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
