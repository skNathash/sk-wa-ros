import React from "react";

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
  const getModeDisplay = () => {
    if (mode === "box-level") {
      return (
        <div className="tw:flex tw:items-center tw:gap-2">
          <span className="tw:text-gray-900">Box Level</span>
        </div>
      );
    }
    return (
      <div className="tw:flex tw:items-center tw:gap-2">
        <span className="tw:text-gray-900">Item Level</span>
      </div>
    );
  };

  return (
    <div className="tw:bg-gray-50 tw:border tw:border-gray-200 tw:rounded-lg tw:p-4">
      <div className="tw:mb-4">
        <h3 className="tw:text-base tw:font-bold tw:text-gray-900">
          Receiving Summary
        </h3>
      </div>

      <div className="tw:grid tw:grid-cols-3 tw:gap-6">
        {/* Mode */}
        <div>
          <div className="tw:text-xs tw:font-medium tw:text-gray-600 tw:mb-1">
            Mode
          </div>
          <div className="tw:text-sm tw:font-semibold">{getModeDisplay()}</div>
        </div>

        {/* Selected Boxes */}
        <div>
          <div className="tw:text-xs tw:font-medium tw:text-gray-600 tw:mb-1">
            Selected Boxes
          </div>
          <div className="tw:text-sm tw:font-bold tw:text-gray-900">
            {selectedBoxes}
          </div>
        </div>

        {/* Status */}
        <div>
          <div className="tw:text-xs tw:font-medium tw:text-gray-600 tw:mb-1">
            Status
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
