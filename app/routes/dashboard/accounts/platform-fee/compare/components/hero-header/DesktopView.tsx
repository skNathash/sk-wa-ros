import React from "react";
import type { BillingCycle } from "../helper";
import BillingCycleToggle from "./BillingCycleToggle";

interface DesktopViewProps {
  billingCycle: BillingCycle;
  onBillingCycleChange: (cycle: BillingCycle) => void;
}

/** Wide layout — title on the left, cycle toggle parked on the right baseline. */
const DesktopView: React.FC<DesktopViewProps> = ({
  billingCycle,
  onBillingCycleChange,
}) => {
  return (
    <div className="tw:flex tw:items-end tw:justify-between tw:gap-4 tw:pt-1 tw:pb-2">
      {/* Title & Subtitle */}
      <div className="tw:space-y-1">
        <div className="tw:text-xs tw:font-bold tw:tracking-widest tw:text-[#527987] tw:uppercase">
          COMPARE
        </div>
        <h1 className="tw:font-serif tw:text-3xl tw:font-bold tw:text-[#183B47] tw:tracking-tight tw:leading-tight">
          The two shapes, side by side.
        </h1>
        <p className="tw:font-serif tw:italic tw:text-lg tw:text-[#183B47] tw:font-normal">
          <span className="tw:italic">Not</span> a fight — a sequence.
        </p>
      </div>

      {/* 6 months / 1 year Toggle Pill */}
      <div className="tw:self-end">
        <BillingCycleToggle
          billingCycle={billingCycle}
          onBillingCycleChange={onBillingCycleChange}
        />
      </div>
    </div>
  );
};

export default DesktopView;
