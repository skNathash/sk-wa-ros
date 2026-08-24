import React, { useState } from "react";
import { Package } from "lucide-react";
import CompletedBoxes from "./CompletedBoxes";

interface PackedBoxesStripProps {
  boxes: any[];
  deals?: any[];
  // "Packed" while invoicing, "Shipped" once the order is on the road
  verb?: string;
  orderRefNo?: string;
  customerName?: string;
  callback: (params: { action: string; data?: any }) => void;
}

const PackedBoxesStrip: React.FC<PackedBoxesStripProps> = ({
  boxes,
  deals,
  verb = "Packed",
  orderRefNo,
  customerName,
  callback,
}) => {
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);

  const completedBoxes = boxes.filter((box) => box.status !== "Open");

  if (completedBoxes.length === 0) {
    return null;
  }

  return (
    <>
      <div className="op-boxes-strip op-stage-pack tw:mb-4">
        <div className="op-eyebrow tw:flex tw:items-center tw:gap-1.5 tw:mb-2">
          <Package size={14} />
          {verb} in {completedBoxes.length}{" "}
          {completedBoxes.length === 1 ? "box" : "boxes"}
        </div>
        <div className="tw:flex tw:flex-wrap tw:gap-2">
          {completedBoxes.map((box) => {
            const totalQty = (box.items || []).reduce(
              (sum: number, it: any) => sum + (Number(it.qty) || 0),
              0,
            );
            return (
              <button
                type="button"
                key={box._id}
                className="op-boxes-strip-chip"
                onClick={() => setSelectedBoxId(box._id)}
              >
                {box.packageRefNo}
                <span className="tw:opacity-50">·</span>
                {totalQty}
              </button>
            );
          })}
        </div>
      </div>

      <CompletedBoxes
        show={!!selectedBoxId}
        onClose={() => setSelectedBoxId(null)}
        boxes={boxes}
        boxId={selectedBoxId}
        deals={deals}
        orderRefNo={orderRefNo}
        customerName={customerName}
        callback={callback}
      />
    </>
  );
};

export default PackedBoxesStrip;
