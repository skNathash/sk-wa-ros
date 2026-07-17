import React from "react";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";

type SummaryProps = {
  summary: {
    totalUnits: number;
    totalOrders: number;
    currentStock: number;
  };
  selectedStockUom?: string;
};

const BlockedSummary: React.FC<SummaryProps> = ({
  summary,
  selectedStockUom,
}) => {
  const cells = [
    { value: summary.totalOrders, label: "Total Orders", isQty: false },
    { value: summary.totalUnits, label: "Blocked Units", isQty: true },
    { value: summary.currentStock, label: "Current Stock", isQty: true },
  ];

  return (
    <div className="tw:w-tw: tw:mb-4">
      <div className="tw:grid tw:grid-cols-3 tw:gap-3">
        {cells.map((c) => {
          const isCurrent = c.label === "Current Stock";
          return (
            <div
              key={c.label}
              className={`tw:flex tw:items-center tw:justify-center tw:p-3 tw:border tw:rounded ${
                isCurrent
                  ? "tw:border-green-200 tw:bg-green-50"
                  : "tw:border-red-300 tw:bg-red-50"
              }`}
            >
              <div className="tw:grid tw:grid-rows-2 tw:items-center tw:text-center">
                <div
                  className={
                    isCurrent
                      ? "tw:text-lg tw:font-semibold tw:text-green-600"
                      : "tw:text-lg tw:font-semibold tw:text-red-600"
                  }
                >
                  {c.isQty ? (
                    <DisplayQty
                      qty={c.value}
                      isLooseQty={false}
                      uom={selectedStockUom}
                    />
                  ) : (
                    c.value
                  )}
                </div>
                <div
                  className={
                    isCurrent
                      ? "tw:text-xs tw:text-green-700 tw:opacity-90"
                      : "tw:text-xs tw:text-red-700 tw:opacity-90"
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

export default BlockedSummary;
