import React from "react";
import clsx from "clsx";
import { getShapeLabel, type BillingCycle, type TierType } from "./helper";

interface TiersHeroHeaderProps {
  billingCycle: BillingCycle;
  onBillingCycleChange: (cycle: BillingCycle) => void;
  type: TierType;
  /** Tiers the selected shape actually has, as sent by the API. */
  tierCount: number;
}

const TiersHeroHeader: React.FC<TiersHeroHeaderProps> = ({
  billingCycle,
  onBillingCycleChange,
  type,
  tierCount,
}) => {
  const isStock = type === "stock";
  const eyebrow = getShapeLabel(type, tierCount);

  return (
    <div className="tw:bg-[#FCF8F2] tw:border tw:border-[#F2E5D3] tw:rounded-3xl tw:p-5 sm:tw:p-6 tw:shadow-xs">
      <div className="tw:flex tw:flex-col lg:tw:flex-row lg:tw:items-center lg:tw:justify-between tw:gap-4">
        {/* Left Side Info */}
        <div className="tw:space-y-1.5">
          <span className="tw:text-xs tw:font-bold tw:uppercase tw:tracking-widest tw:text-[#964213]">
            {eyebrow}
          </span>
          <h1 className="tw:font-serif tw:text-2xl sm:tw:text-3xl tw:font-bold tw:text-[#183B47] tw:tracking-tight tw:leading-tight">
            {isStock ? (
              <>
                Pick the <span className="tw:italic">size</span> of credit that
                fits your monthly buy.
              </>
            ) : (
              <>
                Pick the <span className="tw:italic">counter scale</span> that
                fits your daily billing.
              </>
            )}
          </h1>
        </div>

        {/* Right Side Billing Cycle Toggle */}
        <div className="tw:shrink-0">
          <div className="tw:inline-flex tw:items-center tw:bg-white tw:border tw:border-slate-200/90 tw:rounded-2xl tw:p-1 tw:shadow-2xs">
            <button
              type="button"
              onClick={() => onBillingCycleChange("6months")}
              className={clsx(
                "tw:px-4 tw:py-2 tw:rounded-xl tw:text-xs tw:font-semibold tw:transition-all tw:cursor-pointer",
                billingCycle === "6months"
                  ? "tw:bg-[#1E2D42] tw:text-white tw:shadow-xs"
                  : "tw:text-slate-600 hover:tw:text-slate-900",
              )}
            >
              6 mo
            </button>
            <button
              type="button"
              onClick={() => onBillingCycleChange("1year")}
              className={clsx(
                "tw:px-4 tw:py-2 tw:rounded-xl tw:text-xs tw:font-semibold tw:transition-all tw:cursor-pointer",
                billingCycle === "1year"
                  ? "tw:bg-[#1E2D42] tw:text-white tw:shadow-xs"
                  : "tw:text-slate-600 hover:tw:text-slate-900",
              )}
            >
              1 year
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TiersHeroHeader;
