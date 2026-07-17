import React from "react";
import AppPopover from "~/components/core/popover/AppPopover";

type SlabDetailsProps = {
  slab: any[];
  triggerLabel?: string;
};

const SlabDetails: React.FC<SlabDetailsProps> = ({
  slab = [],
  triggerLabel,
}) => {
  const hasData = slab && slab.length > 0;

  const content = (
    <div className="tw:text-xs">
      {!hasData ? (
        <div className="tw:text-slate-500 tw:text-center tw:py-2">No slabs</div>
      ) : (
        <div className="tw:border tw:border-slate-200 tw:rounded-md tw:overflow-hidden">
          <div className="tw:grid tw:grid-cols-3 tw:gap-0 tw:bg-gradient-to-r tw:from-slate-50 tw:to-slate-100 tw:text-[10px] tw:font-semibold tw:text-slate-700 tw:uppercase tw:tracking-wide">
            <div className="tw:px-2.5 tw:py-2 tw:border-r tw:border-slate-200">
              Min Qty
            </div>
            <div className="tw:px-2.5 tw:py-2 tw:border-r tw:border-slate-200">
              Max Qty
            </div>
            <div className="tw:px-2.5 tw:py-2 tw:text-right">Discount</div>
          </div>

          <div>
            {slab.map((s: any, i: number) => (
              <div
                key={i}
                className={`tw:grid tw:grid-cols-3 tw:gap-0 tw:text-xs tw:hover:bg-blue-50 tw:transition-colors ${
                  i < slab.length - 1 ? "tw:border-b tw:border-slate-100" : ""
                }`}
              >
                <div className="tw:px-2.5 tw:py-2 tw:border-r tw:border-slate-100 tw:text-slate-700">
                  {s.minQuantity}
                </div>
                <div className="tw:px-2.5 tw:py-2 tw:border-r tw:border-slate-100 tw:text-slate-700">
                  {s.maxQuantity}
                </div>
                <div className="tw:px-2.5 tw:py-2 tw:font-bold tw:text-primary tw:text-right">
                  {s.discountPercentage}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <AppPopover
      side="bottom"
      align="start"
      triggerContent={
        <button
          onClick={(e) => e.stopPropagation()}
          className="tw:text-xs tw:text-primary tw:font-semibold tw:cursor-pointer tw:hover:text-primary/80 tw:transition-colors"
        >
          {triggerLabel || "View details"}
        </button>
      }
    >
      <div className="tw:font-semibold tw:text-slate-900 tw:border-b tw:border-slate-200 tw:pb-1.5 tw:mb-2 tw:text-sm">
        Price Slabs
      </div>
      {content}
    </AppPopover>
  );
};

export default SlabDetails;
