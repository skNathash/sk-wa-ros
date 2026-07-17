import { Info } from "lucide-react";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppPopover from "~/components/core/popover/AppPopover";

// Compact indicator for the same condition flagged per-variant in
// ChooseSanpshotModal: price was edited at billing, so picking a snapshot
// with a different MRP won't change the billed price. Details on tap.
const PriceLockedNote: React.FC<{ product: any }> = ({ product }) => {
  const show =
    product?.overridePrice != null &&
    (product?.snapshots || []).some(
      (snapshot: any) =>
        (snapshot.mrp || 0) > 0 && snapshot.mrp !== product.mrp
    );

  if (!show) return null;

  return (
    <AppPopover
      triggerContent={
        <button className="tw:cursor-pointer tw:inline-flex tw:items-center tw:gap-1 tw:text-[11px] tw:text-amber-700">
          <Info size={12} />
          MRP differs
        </button>
      }
      contentClassName="tw:w-60"
    >
      <div className="tw:text-xs tw:text-gray-700">
        Ordered MRP is different. Billing price will not change —{" "}
        <span className="tw:font-bold">
          <Amount value={product.overridePrice} decimalPlaces={2} />
        </span>
        .
      </div>
    </AppPopover>
  );
};

export default PriceLockedNote;
