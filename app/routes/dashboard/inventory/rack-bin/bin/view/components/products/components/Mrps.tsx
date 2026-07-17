import { Barcode } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";

interface MrpsProps {
  mrps: Array<{ mrp: number }>;
}

const Mrps: React.FC<MrpsProps> = ({ mrps }) => {
  const { t } = useTranslation(["common"]);

  if (mrps.length === 0) {
    return null;
  }

  return (
    <div className="tw:my-3">
      {/* Header */}
      <div className="tw:flex tw:items-center tw:mb-3">
        <div className="tw:flex tw:items-center tw:mr-2">
          <Barcode className="tw:w-5 tw:h-5 tw:text-gray-600" />
        </div>
        <div className="tw:text-sm tw:font-medium tw:text-gray-800">
          {t("mrps")} ({mrps.length})
        </div>
      </div>
      {/* Barcodes List or Empty State */}
      {!mrps || mrps.length === 0 ? (
        <div className="tw:text-gray-400 tw:text-xs tw:py-2">
          {t("noBarcodesFound")}
        </div>
      ) : (
        <div className="tw:flex tw:flex-wrap tw:gap-2">
          {mrps.map((item) => (
            <div
              key={item.mrp}
              className="tw:bg-gray-100 tw:rounded tw:px-3 tw:py-1 tw:flex tw:items-center tw:gap-2 tw:text-xs tw:font-mono"
            >
              <span>
                <Amount value={item.mrp} />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Mrps;
