import React from "react";
import { Info, Package } from "lucide-react";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";

type SummaryProps = {
  summary: {
    totalPickedUnits: number;
    totalPickingSessions: number;
  };
  binId?: string;
  selectedStockUom?: string;
};

const PickingSummary: React.FC<SummaryProps> = ({
  summary,
  binId,
  selectedStockUom,
}) => {
  const cells = [
    { value: summary.totalPickingSessions, label: "Total Sessions" },
    {
      value: summary.totalPickedUnits,
      label: "Picked Units",
      withUom: true,
    },
  ];

  return (
    <div className="tw:w-full tw:mb-4">
      {/* Description */}
      <div className="tw:mb-3 tw:p-2 tw:bg-blue-50 tw:border tw:border-blue-200 tw:rounded">
        <div className="tw:flex tw:items-center tw:gap-2">
          <Info className="tw:w-3 tw:h-3 tw:text-blue-700" />
          <p className="tw:text-xs tw:text-blue-800">
            Tracks quantities picked during order processing.
          </p>
        </div>
      </div>

      <div className="tw:grid tw:grid-cols-2 tw:gap-3">
        {cells.map((c, index) => {
          const isPickedUnits = c.label === "Picked Units";

          return (
            <div
              key={c.label}
              className={`tw:flex tw:items-center tw:justify-center tw:p-3 tw:border tw:rounded ${
                isPickedUnits
                  ? "tw:border-green-300 tw:bg-green-50"
                  : "tw:border-gray-300 tw:bg-gray-50"
              }`}
            >
              <div className="tw:grid tw:grid-rows-2 tw:items-center tw:text-center">
                <div
                  className={
                    isPickedUnits
                      ? "tw:text-lg tw:font-semibold tw:text-green-600"
                      : "tw:text-lg tw:font-semibold tw:text-gray-600"
                  }
                >
                  {c.withUom ? (
                    <DisplayQty
                      qty={c.value}
                      isLooseQty={false}
                      uom={selectedStockUom}
                      hideDefaultUom
                    />
                  ) : (
                    c.value
                  )}
                </div>
                <div
                  className={
                    isPickedUnits
                      ? "tw:text-xs tw:text-green-700 tw:opacity-90"
                      : "tw:text-xs tw:text-gray-700 tw:opacity-90"
                  }
                >
                  {c.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PickingSummary;
