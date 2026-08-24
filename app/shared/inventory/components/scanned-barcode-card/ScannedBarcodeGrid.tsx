import React from "react";
import ScannedBarcodeCard from "./ScannedBarcodeCard";

type ScannedItem = { barcode: string; qty: number };

interface ScannedBarcodeGridProps {
  items: ScannedItem[];
  onEdit?: (item: ScannedItem) => void;
  onRemove?: (item: ScannedItem) => void;
  className?: string;
}

// 2 across on phones, widening to 5 on desktop.
const ScannedBarcodeGrid: React.FC<ScannedBarcodeGridProps> = ({
  items,
  onEdit,
  onRemove,
  className = "",
}) => {
  return (
    <div
      className={`tw:grid tw:grid-cols-2 tw:gap-3 tw:sm:grid-cols-3 tw:lg:grid-cols-5 tw:pt-2 ${className}`}
    >
      {items.map((item, idx) => (
        <ScannedBarcodeCard
          key={item.barcode}
          code={item.barcode}
          qty={item.qty}
          index={idx}
          onEdit={onEdit ? () => onEdit(item) : undefined}
          onRemove={onRemove ? () => onRemove(item) : undefined}
        />
      ))}
    </div>
  );
};

export default ScannedBarcodeGrid;
