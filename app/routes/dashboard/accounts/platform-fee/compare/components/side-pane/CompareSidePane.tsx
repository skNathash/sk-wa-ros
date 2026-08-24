import React from "react";
import clsx from "clsx";
import { Bot } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import ImgRender from "~/components/core/img/ImgRender";
import useAppNav from "~/hooks/useAppNav";
import type { BillingCycle } from "../helper";
import ComparePlanList from "./ComparePlanList";

interface CompareSidePaneProps {
  className?: string;
  /** Billing duration the JUMP TO plan lists are filtered by. */
  billingCycle: BillingCycle;
  onAskSwa?: () => void;
}

const CompareSidePane: React.FC<CompareSidePaneProps> = ({
  className,
  billingCycle,
  onAskSwa,
}) => {
  const appNav = useAppNav();

  const handleAskSwa = () => {
    if (onAskSwa) {
      onAskSwa();
    } else {
      appNav.to("/dashboard");
    }
  };

  return (
    <div className={clsx("tw:flex tw:flex-col tw:gap-4.5 tw:p-0.5", className)}>
      {/* Top Header */}
      <div className="tw:flex tw:items-baseline tw:justify-between tw:px-0.5">
        <h2 className="tw:font-serif tw:text-2xl tw:font-bold tw:tracking-tight tw:text-[#183B47]">
          Compare
        </h2>
        <span className="tw:text-xs tw:font-normal tw:text-[#527987]">
          Row-by-row
        </span>
      </div>

      {/* Mascot / Quote Card */}
      <div className="tw:rounded-2xl tw:border tw:border-slate-200/90 tw:bg-[#F8FAFC]/60 tw:p-3.5 tw:shadow-xs">
        <div className="tw:flex tw:items-center tw:gap-3">
          <div className="tw:flex tw:h-12 tw:w-12 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-white tw:shadow-2xs tw:overflow-hidden">
            <ImgRender
              src="ai/swa-buddy.png"
              alt="Swa"
              className="tw:h-11 tw:w-11 tw:object-contain"
              fallback={
                <div className="tw:flex tw:h-full tw:w-full tw:items-center tw:justify-center tw:bg-sky-100 tw:text-[#2A3B56]">
                  <Bot size={22} />
                </div>
              }
            />
          </div>
          <div className="tw:min-w-0 tw:flex-1">
            <p className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-widest tw:text-[#506E86]">
              COMPARE LIKE A SHOPKEEPER
            </p>
            <p className="tw:font-serif tw:italic tw:text-xs sm:tw:text-sm tw:text-[#2D4756] tw:mt-0.5 tw:leading-snug">
              &ldquo;Both plans do <span className="tw:font-bold tw:underline tw:decoration-[#506E86]">different</span> jobs. Not either-or — you&apos;ll want both eventually.&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* Ask Swa Action Button */}
      <AppButton
        onClick={handleAskSwa}
        className="tw:w-full tw:bg-[#2A3B56] hover:tw:bg-[#1E2D42] tw:text-white tw:font-semibold tw:py-3 tw:rounded-xl tw:shadow-xs tw:transition-all"
      >
        Ask Swa which fits me
      </AppButton>

      {/* JUMP TO Section */}
      <div className="tw:space-y-3.5 tw:pt-1">
        <div className="tw:px-0.5">
          <span className="tw:text-xs tw:font-bold tw:uppercase tw:tracking-wider tw:text-[#527987]">
            JUMP TO
          </span>
        </div>

        {/* Stock Tiers */}
        <ComparePlanList type="stock" billingCycle={billingCycle} />

        {/* Shop Tiers */}
        <ComparePlanList
          type="shop"
          billingCycle={billingCycle}
          className="tw:pt-1"
        />
      </div>
    </div>
  );
};

export default CompareSidePane;
