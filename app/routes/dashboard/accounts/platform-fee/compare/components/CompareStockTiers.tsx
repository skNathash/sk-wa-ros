import React from "react";
import clsx from "clsx";
import { stockTiersData, type BillingCycle, type StockTierCardData } from "./helper";

interface CompareStockTiersProps {
  billingCycle: BillingCycle;
}

const TierIcon: React.FC<{ tier: "bronze" | "silver" | "gold" | "platinum" }> = ({
  tier,
}) => {
  const getGradient = () => {
    switch (tier) {
      case "bronze":
        return "tw:from-[#C27838] tw:via-[#DE9C62] tw:to-[#96541D] tw:text-white";
      case "silver":
        return "tw:from-[#94A3B8] tw:via-[#CBD5E1] tw:to-[#64748B] tw:text-white";
      case "gold":
        return "tw:from-[#D97706] tw:via-[#FBBF24] tw:to-[#B45309] tw:text-white";
      case "platinum":
        return "tw:from-[#475569] tw:via-[#64748B] tw:to-[#1E293B] tw:text-white";
      default:
        return "tw:from-slate-400 tw:to-slate-600 tw:text-white";
    }
  };

  return (
    <div
      className={clsx(
        "tw:w-11 tw:h-11 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:bg-gradient-to-br tw:shadow-sm",
        getGradient()
      )}
    >
      <svg
        className="tw:w-5 tw:h-5 tw:text-white/90"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
      </svg>
    </div>
  );
};

const CompareStockTiers: React.FC<CompareStockTiersProps> = ({ billingCycle }) => {
  const isYearly = billingCycle === "1year";

  return (
    <div className="tw:space-y-4 tw:pt-2">
      {/* Section Header */}
      <div className="tw:flex tw:flex-col tw:sm:flex-row tw:sm:items-baseline tw:justify-between tw:gap-2">
        <h2 className="tw:font-serif tw:text-2xl tw:sm:text-3xl tw:font-bold tw:text-[#183B47]">
          Tier-by-tier · <span className="tw:font-normal tw:italic">every price on one page</span>
        </h2>
        <span className="tw:text-xs tw:font-semibold tw:tracking-wider tw:text-slate-500 tw:uppercase">
          GST 18% INCLUDED · SETUP ONE-TIME
        </span>
      </div>

      {/* Eyebrow */}
      <div>
        <span className="tw:text-xs tw:font-bold tw:uppercase tw:tracking-widest tw:text-[#A05A18]">
          STOCK · 5 TIERS
        </span>
      </div>

      {/* 5 Cards Grid */}
      <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:lg:grid-cols-5 tw:gap-4">
        {stockTiersData.map((tier: StockTierCardData) => {
          const durationFee = isYearly ? tier.oneYearFee : tier.sixMonthFee;
          const gstFee = isYearly ? tier.oneYearGst : tier.sixMonthGst;
          const payToday = isYearly ? tier.payToday1Yr : tier.payToday6Mo;
          const durationLabel = isYearly ? "1yr" : "6mo";

          return (
            <div
              key={tier.id}
              id={tier.id}
              className={clsx(
                "tw:relative tw:bg-white tw:rounded-3xl tw:p-5 tw:flex tw:flex-col tw:justify-between tw:transition-all",
                tier.isHighlighted
                  ? "tw:border-2 tw:border-[#E59E27] tw:shadow-md"
                  : "tw:border tw:border-slate-200/90 tw:shadow-xs hover:tw:border-slate-300"
              )}
            >
              {/* Top Pill / Badge */}
              {tier.badge && (
                <div
                  className={clsx(
                    "tw:absolute -tw:top-3.5 tw:left-1/2 -tw:translate-x-1/2 tw:px-3 tw:py-1 tw:rounded-md tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wider tw:shadow-xs tw:whitespace-nowrap tw:z-10",
                    tier.badge.variant === "recommended"
                      ? "tw:bg-[#C58319] tw:text-white"
                      : "tw:bg-[#2A3B56] tw:text-white"
                  )}
                >
                  {tier.badge.label}
                </div>
              )}

              {/* Card Body */}
              <div>
                <TierIcon tier={tier.iconTier} />

                <h3 className="tw:font-serif tw:text-xl tw:font-bold tw:text-[#183B47] tw:mt-3">
                  {tier.name}
                </h3>
                <p className="tw:text-xs tw:text-slate-500 tw:mt-1 tw:leading-normal tw:min-h-[32px]">
                  {tier.subtitle}
                </p>

                {/* Monthly Credit Box */}
                <div className="tw:bg-[#F8FAFC] tw:rounded-2xl tw:p-3.5 tw:my-4">
                  <span className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wider tw:text-slate-500 tw:block">
                    MONTHLY CREDIT
                  </span>
                  <div className="tw:font-serif tw:text-2xl tw:font-bold tw:text-[#A0520F] tw:mt-0.5">
                    {tier.credit}
                  </div>
                  <span className="tw:text-xs tw:text-slate-500 tw:block tw:mt-0.5">
                    {tier.creditSub}
                  </span>
                </div>

                {/* Fee Breakdown */}
                <div className="tw:space-y-1.5 tw:text-xs tw:text-slate-600">
                  <div className="tw:flex tw:items-center tw:justify-between">
                    <span>Setup</span>
                    <span className="tw:font-semibold tw:text-[#183B47]">
                      ₹{tier.setupFee.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="tw:flex tw:items-center tw:justify-between">
                    <span>{durationLabel}</span>
                    <span className="tw:font-semibold tw:text-[#183B47]">
                      ₹{durationFee.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="tw:flex tw:items-center tw:justify-between">
                    <span>GST 18%</span>
                    <span className="tw:font-semibold tw:text-[#183B47]">
                      ₹{gstFee.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Dashed Separator */}
                <div className="tw:border-t tw:border-dashed tw:border-slate-200 tw:my-3.5" />

                {/* Pay Today */}
                <div className="tw:flex tw:items-baseline tw:justify-between">
                  <span className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wider tw:text-slate-700">
                    PAY TODAY
                  </span>
                  <span className="tw:font-serif tw:text-2xl tw:font-bold tw:text-[#A0520F]">
                    ₹{payToday.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Bottom Badges */}
              <div className="tw:flex tw:items-center tw:gap-2 tw:mt-4 tw:pt-1">
                <span className="tw:bg-[#F1F5F9] tw:text-slate-700 tw:text-xs tw:font-medium tw:px-2.5 tw:py-1 tw:rounded-md">
                  {tier.peersCount} peers
                </span>
                <span className="tw:bg-[#F1F5F9] tw:text-slate-700 tw:text-xs tw:font-medium tw:px-2.5 tw:py-1 tw:rounded-md">
                  {tier.perksCount} perks
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CompareStockTiers;
