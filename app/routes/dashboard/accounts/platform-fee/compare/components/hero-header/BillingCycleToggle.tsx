import React from "react";
import clsx from "clsx";
import type { BillingCycle } from "../helper";

interface BillingCycleToggleProps {
  billingCycle: BillingCycle;
  onBillingCycleChange: (cycle: BillingCycle) => void;
  /** Mobile stretches the pill edge to edge so both options stay thumb-sized. */
  fullWidth?: boolean;
}

const options: { value: BillingCycle; label: string }[] = [
  { value: "6months", label: "6 months" },
  { value: "1year", label: "1 year" },
];

const BillingCycleToggle: React.FC<BillingCycleToggleProps> = ({
  billingCycle,
  onBillingCycleChange,
  fullWidth,
}) => {
  return (
    <div
      className={clsx(
        "tw:bg-white tw:border tw:border-slate-200/90 tw:p-1 tw:rounded-2xl tw:items-center tw:gap-1 tw:shadow-xs",
        fullWidth ? "tw:flex tw:w-full" : "tw:inline-flex",
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onBillingCycleChange(option.value)}
          className={clsx(
            "tw:px-4 tw:py-2 tw:text-xs tw:font-semibold tw:rounded-xl tw:cursor-pointer tw:transition-all",
            fullWidth && "tw:flex-1",
            billingCycle === option.value
              ? "tw:bg-[#2A3B56] tw:text-white tw:shadow-2xs"
              : "tw:text-[#527987] hover:tw:text-[#183B47] tw:bg-transparent",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default BillingCycleToggle;
