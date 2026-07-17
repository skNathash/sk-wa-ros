import React, { useMemo } from "react";
import { Tag } from "lucide-react";
import Amount from "~/components/core/amount/Amount";

type OperationalFee = {
  type: string;
  value: number;
  discountPercent: number;
  discountSubscriptionAmount: number;
  isActive: boolean;
  isFree: boolean;
  displayName: string;
  refId: string;
};

type HybridPlan = {
  subscriptionAmount: number;
  taxPercentage?: number;
  isInclusiveTax?: boolean;
  operationalFeesList?: OperationalFee[];
};

type Props = {
  plan: HybridPlan;
};

const HybridPlanFeeSwiper: React.FC<Props> = ({ plan }) => {
  const fees = useMemo(
    () => (plan.operationalFeesList || []).filter((f) => f.isActive),
    [plan.operationalFeesList],
  );

  const taxPct = plan.taxPercentage || 0;
  const isInclusive = !!plan.isInclusiveTax;

  if (!fees.length) return null;

  const bestDiscount = Math.max(...fees.map((f) => f.discountPercent || 0));

  return (
    <div className="tw:mb-3">
      <div className="tw:flex tw:items-center tw:gap-1 tw:mb-1.5">
        <Tag className="tw:w-2.5 tw:h-2.5 tw:text-indigo-500" />
        <span className="tw:text-[9px] tw:font-bold tw:uppercase tw:tracking-[0.14em] tw:text-indigo-600">
          Prepay & Save
        </span>
      </div>
      <div className="tw:rounded-md tw:ring-1 tw:ring-slate-200 tw:overflow-hidden tw:divide-y tw:divide-slate-100">
        {fees.map((fee) => {
          const total =
            fee.discountSubscriptionAmount +
            (isInclusive ? 0 : (fee.discountSubscriptionAmount * taxPct) / 100);
          const original =
            (plan.subscriptionAmount || 0) * fee.value +
            (isInclusive
              ? 0
              : ((plan.subscriptionAmount || 0) * fee.value * taxPct) / 100);
          const hasDiscount = fee.discountPercent > 0;
          const isBest = hasDiscount && fee.discountPercent === bestDiscount;

          return (
            <div
              key={fee.refId}
              className={`tw:px-2.5 tw:py-1.5 tw:flex tw:items-center tw:justify-between tw:gap-2 ${
                isBest ? "tw:bg-emerald-50/50" : "tw:bg-white"
              }`}
            >
              <div className="tw:flex tw:flex-col tw:min-w-0 tw:leading-tight">
                <div className="tw:flex tw:items-center tw:gap-1.5">
                  <span className="tw:text-[11px] tw:font-semibold tw:text-slate-800 tw:truncate">
                    {fee.displayName}
                  </span>
                  {isBest && (
                    <span className="tw:text-[8px] tw:font-bold tw:uppercase tw:tracking-wider tw:text-emerald-700">
                      Best
                    </span>
                  )}
                </div>
                <span className="tw:text-[9px] tw:text-slate-500 tw:tabular-nums">
                  {fee.value} {fee.value === 1 ? "month" : "months"}
                </span>
              </div>
              <div className="tw:flex tw:items-baseline tw:gap-1.5 tw:shrink-0">
                {hasDiscount && (
                  <span className="tw:text-[9px] tw:text-slate-400 tw:line-through tw:tabular-nums">
                    <Amount value={original} decimalPlaces={2} />
                  </span>
                )}
                <span className="tw:text-[12px] tw:font-bold tw:text-slate-900 tw:tabular-nums">
                  <Amount value={total} decimalPlaces={2} />
                </span>
                {hasDiscount && (
                  <span className="tw:px-1 tw:py-0.5 tw:rounded tw:bg-emerald-600 tw:text-white tw:text-[9px] tw:font-extrabold tw:tabular-nums tw:leading-none">
                    −{fee.discountPercent}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HybridPlanFeeSwiper;
