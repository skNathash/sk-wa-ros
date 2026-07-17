import React from "react";
import { useTranslation } from "react-i18next";

interface ReceiveSummaryProps {
  mode: "box-level" | "item-level";
  selectedBoxes?: number;
  status?: string;
}

const ReceiveSummary: React.FC<ReceiveSummaryProps> = ({
  mode,
  selectedBoxes = 1,
  status = "Ready to Receive",
}) => {
  const { t } = useTranslation("common");

  const getModeDisplay = () => {
    if (mode === "box-level") {
      return (
        <div className="tw:flex tw:items-center tw:gap-2">
          <span className="tw:text-gray-900">{t("boxLevel")}</span>
        </div>
      );
    }
    return (
      <div className="tw:flex tw:items-center tw:gap-2">
        <span className="tw:text-gray-900">{t("itemLevel")}</span>
      </div>
    );
  };

  return (
    <div className="tw:bg-gray-50 tw:border tw:border-gray-200 tw:rounded-lg tw:p-4">
      <div className="tw:mb-4">
        <h3 className="tw:text-base tw:font-bold tw:text-gray-900">
          {t("receivingSummary")}
        </h3>
      </div>

      <div className="tw:grid tw:grid-cols-3 tw:gap-6">
        {/* Mode */}
        <div>
          <div className="tw:text-xs tw:font-medium tw:text-gray-600 tw:mb-1">
            {t("mode")}
          </div>
          <div className="tw:text-sm tw:font-semibold">{getModeDisplay()}</div>
        </div>

        {/* Selected Boxes */}
        <div>
          <div className="tw:text-xs tw:font-medium tw:text-gray-600 tw:mb-1">
            {t("selectedBoxes")}
          </div>
          <div className="tw:text-sm tw:font-bold tw:text-gray-900">
            {selectedBoxes}
          </div>
        </div>

        {/* Status */}
        <div>
          <div className="tw:text-xs tw:font-medium tw:text-gray-600 tw:mb-1">
            {t("status")}
          </div>
          <div className="tw:text-sm tw:font-bold tw:text-green-600">
            {status}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiveSummary;
