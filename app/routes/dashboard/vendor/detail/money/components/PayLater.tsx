import { ArrowRight, Landmark } from "lucide-react";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import type { PayLaterInfo } from "../helper";

interface PayLaterProps {
  info: PayLaterInfo;
  onViewTerms?: () => void;
}

/**
 * Paylater credit the vendor extends back to the retailer (VENDOR → YOU).
 * Shows the credit limit with a used/available split and a link to the terms.
 */
const PayLater: React.FC<PayLaterProps> = ({ info, onViewTerms }) => {
  const usedPct = info.creditLimit
    ? Math.min(100, Math.round((info.used / info.creditLimit) * 100))
    : 0;

  return (
    <div>
      <div className="tw:mb-2 tw:flex tw:items-center tw:gap-1.5 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
        <Landmark className="tw:size-3.5" />
        <span>
          Paylater · Vendor <ArrowRight className="tw:inline tw:size-3" /> You
        </span>
      </div>

      <div className="tw:rounded-2xl tw:border-t-4 tw:border-emerald-400 tw:bg-white tw:p-4 tw:shadow-sm">
        <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
          <div className="tw:flex tw:flex-col">
            <span className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
              Credit limit
            </span>
            <span className="tw:text-lg tw:font-bold tw:text-slate-700">
              <Amount value={info.creditLimit} decimalPlaces={0} />
            </span>
          </div>
          <button
            type="button"
            onClick={onViewTerms}
            className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-primary tw:cursor-pointer"
          >
            Terms
          </button>
        </div>

        {/* Used / available bar */}
        <div className="tw:mt-3 tw:h-2 tw:overflow-hidden tw:rounded-full tw:bg-slate-100">
          <div
            className="tw:h-full tw:rounded-full tw:bg-emerald-500"
            style={{ width: `${usedPct}%` }}
          />
        </div>
        <div className="tw:mt-2 tw:flex tw:items-center tw:justify-between tw:text-xs">
          <span className="tw:text-slate-400">
            Used <Amount value={info.used} decimalPlaces={0} />
          </span>
          <span className="tw:font-medium tw:text-emerald-600">
            Available <Amount value={info.available} decimalPlaces={0} />
          </span>
        </div>

        <div className="tw:mt-3 tw:border-t tw:border-slate-100 tw:pt-2.5 tw:text-[11px] tw:text-slate-400">
          {info.terms}
        </div>
      </div>
    </div>
  );
};

export default PayLater;
