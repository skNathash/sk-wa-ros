import React from "react";
import { Copy, Barcode } from "lucide-react";
import CommonService from "~/services/CommonService";
import useAppToast from "~/hooks/useAppToast";
import { useTranslation } from "react-i18next";

interface BarcodesProps {
  barcodes: Array<{ barcode: string }>;
}

const Barcodes: React.FC<BarcodesProps> = ({ barcodes }) => {
  const { t } = useTranslation(["common"]);
  const { show } = useAppToast();
  const handleCopy = (barcode: string) => {
    CommonService.copyToClipboard(barcode);
    show({ msg: "Copied to clipboard!", color: "success" });
  };

  return (
    <div>
      {/* Header */}
      <div className="tw:flex tw:items-center tw:mb-3">
        <div className="tw:flex tw:items-center tw:mr-2">
          <Barcode className="tw:w-5 tw:h-5 tw:text-gray-600" />
        </div>
        <div className="tw:text-sm tw:font-medium tw:text-gray-800">
          {t("barcodes")} ({barcodes.length})
        </div>
      </div>
      {/* Barcodes List or Empty State */}
      {!barcodes || barcodes.length === 0 ? (
        <div className="tw:text-gray-400 tw:text-xs tw:py-2">
          {t("noBarcodesFound")}
        </div>
      ) : (
        <div className="tw:flex tw:flex-wrap tw:gap-2">
          {barcodes.map((item) => (
            <div
              key={item.barcode}
              className="tw:bg-gray-100 tw:rounded tw:px-3 tw:py-1 tw:flex tw:items-center tw:gap-2 tw:text-xs tw:font-mono"
            >
              <span>{item.barcode}</span>
              <Copy
                className="tw:w-4 tw:h-4 tw:cursor-pointer hover:tw:text-blue-500"
                onClick={() => handleCopy(item.barcode)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Barcodes;
