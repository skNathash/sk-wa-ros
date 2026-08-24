import React from "react";
import type { BillingCycle } from "../helper";
import BillingCycleToggle from "./BillingCycleToggle";

interface MobileViewProps {
  billingCycle: BillingCycle;
  onBillingCycleChange: (cycle: BillingCycle) => void;
}

/** Narrow layout — the title becomes a cream masthead card and the two
    sentences run together as one paragraph, with the cycle toggle stretched
    below it instead of squeezed onto the title row. */
const MobileView: React.FC<MobileViewProps> = ({
  billingCycle,
  onBillingCycleChange,
}) => {
  return (
    <div className="tw:space-y-3 tw:pb-1">
      {/* Masthead card */}
      <div className="tw:rounded-2xl tw:border tw:border-[#E7E1D2] tw:bg-[#FBF9F2] tw:px-4 tw:py-3.5 tw:space-y-1.5">
        <div className="tw:text-[10px] tw:font-bold tw:tracking-widest tw:text-[#527987] tw:uppercase">
          COMPARE
        </div>
        <h1 className="tw:font-serif tw:text-xl tw:font-bold tw:text-[#183B47] tw:tracking-tight tw:leading-snug">
          The two shapes, side by side.{" "}
          <span className="tw:font-normal tw:italic">
            <span className="tw:font-bold">Not</span> a fight — a sequence.
          </span>
        </h1>
      </div>

      {/* 6 months / 1 year Toggle Pill */}
      <BillingCycleToggle
        billingCycle={billingCycle}
        onBillingCycleChange={onBillingCycleChange}
        fullWidth
      />
    </div>
  );
};

export default MobileView;
