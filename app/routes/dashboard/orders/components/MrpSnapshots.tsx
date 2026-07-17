import React from "react";
import Amount from "~/components/core/amount/Amount";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";

interface MrpSnapshot {
  mrp: number | string;
  quantity?: number | string;
  qty?: number | string;
  usedQty?: number | string;
}

interface MrpSnapshotsProps {
  mrpSnapshots: MrpSnapshot[];
  className?: string;
  uom?: string;
}

const MrpSnapshots: React.FC<MrpSnapshotsProps> = ({
  mrpSnapshots,
  className = "",
  uom,
}) => {
  // Return null if no snapshots or empty array
  if (!Array.isArray(mrpSnapshots) || mrpSnapshots.length === 0) {
    return null;
  }

  return (
    <div className={`tw:flex tw:flex-wrap tw:gap-2 tw:mt-2 ${className}`}>
      {mrpSnapshots.map((snapshot, index) => {
        const quantity = Number(
          snapshot.quantity ?? snapshot.qty ?? snapshot.usedQty ?? 0
        );
        const mrp = Number(snapshot.mrp) || 0;

        return (
          <div
            key={index}
            className="tw:flex tw:items-center tw:gap-2 tw:text-xs tw:text-gray-500 tw:rounded tw:border tw:border-gray-200 tw:px-2 tw:py-1"
          >
            <span className="tw:text-gray-400">MRP:</span>
            <Amount value={mrp} decimalPlaces={2} />
            <span>
              ×{" "}
              <DisplayQty
                qty={quantity}
                isLooseQty={false}
                uom={uom || "unit"}
                hideDefaultUom={!uom}
              />
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default MrpSnapshots;
