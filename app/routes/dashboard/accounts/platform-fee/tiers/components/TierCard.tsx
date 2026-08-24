import React from "react";
import clsx from "clsx";
import { ArrowRight } from "lucide-react";
import type { TierCardData, TierIcon } from "./helper";

interface TierCardProps {
  tier: TierCardData;
  onPickTier?: (tier: TierCardData) => void;
}

const MetallicTierIcon: React.FC<{ tier: TierIcon }> = ({ tier }) => {
  const getGradient = () => {
    switch (tier) {
      case "bronze":
        return "tw:from-[#C27838] tw:via-[#DE9C62] tw:to-[#96541D]";
      case "silver":
        return "tw:from-[#94A3B8] tw:via-[#CBD5E1] tw:to-[#64748B]";
      case "gold":
        return "tw:from-[#D97706] tw:via-[#FBBF24] tw:to-[#B45309]";
      case "platinum":
        return "tw:from-[#475569] tw:via-[#64748B] tw:to-[#1E293B]";
      default:
        return "tw:from-slate-400 tw:to-slate-600";
    }
  };

  return (
    <div
      className={clsx(
        "tw:w-11 tw:h-11 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:bg-gradient-to-br tw:shadow-sm tw:text-white",
        getGradient(),
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

const TierCard: React.FC<TierCardProps> = ({ tier, onPickTier }) => {
  return (
    <div
      id={tier.id}
      className={clsx(
        "tw:relative tw:rounded-3xl tw:p-5 tw:flex tw:flex-col tw:justify-between tw:transition-all",
        tier.isHighlighted
          ? "tw:bg-[#FCF8F0] tw:border-2 tw:border-[#E5A93C] tw:shadow-md"
          : "tw:bg-white tw:border tw:border-slate-200/90 tw:shadow-xs hover:tw:border-slate-300",
      )}
    >
      {/* Top Floating Badge */}
      {tier.badge && (
        <div
          className={clsx(
            "tw:absolute -tw:top-3 tw:left-1/2 -tw:translate-x-1/2 tw:px-3 tw:py-1 tw:rounded-md tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wider tw:shadow-xs tw:whitespace-nowrap tw:z-10",
            tier.badge.variant === "recommended"
              ? "tw:bg-[#C58319] tw:text-white"
              : "tw:bg-[#2A3B56] tw:text-white",
          )}
        >
          {tier.badge.label}
        </div>
      )}

      {/* Main Content */}
      <div>
        <MetallicTierIcon tier={tier.iconTier} />

        <h3 className="tw:font-serif tw:text-xl tw:font-bold tw:text-[#183B47] tw:mt-3">
          {tier.name}
        </h3>
        <p className="tw:text-xs tw:text-slate-500 tw:mt-1 tw:leading-normal tw:min-h-[32px]">
          {tier.subtitle}
        </p>

        {/* Highlight / Monthly Credit Box */}
        <div className="tw:bg-[#F8FAFC] tw:rounded-2xl tw:p-3.5 tw:my-4">
          <span className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wider tw:text-slate-500 tw:block">
            {tier.highlight.label}
          </span>
          <div className="tw:font-serif tw:text-2xl tw:font-bold tw:text-[#964213] tw:mt-0.5">
            {tier.highlight.value}
          </div>
          <span className="tw:text-xs tw:text-slate-500 tw:block tw:mt-0.5">
            {tier.highlight.sub}
          </span>
        </div>

        {/* Fee Breakdown */}
        <div className="tw:space-y-1.5 tw:text-xs tw:text-slate-600">
          {tier.feeRows.map((row) => (
            <div
              key={row.label}
              className="tw:flex tw:items-center tw:justify-between"
            >
              <span>{row.label}</span>
              <span className="tw:font-semibold tw:text-[#183B47]">
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Dashed Separator */}
        <div className="tw:border-t tw:border-dashed tw:border-slate-200 tw:my-3.5" />

        {/* Pay Today Row */}
        <div className="tw:flex tw:items-baseline tw:justify-between">
          <span className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wider tw:text-slate-700">
            {tier.payTodayLabel}
          </span>
          <span className="tw:font-serif tw:text-2xl tw:font-bold tw:text-[#964213]">
            {tier.payTodayValue}
          </span>
        </div>
      </div>

      {/* Bottom Section: Badges & CTA */}
      <div className="tw:space-y-3.5 tw:mt-4 tw:pt-1">
        {/* Peers & Perks tags */}
        <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
          {tier.tags.map((tag) => (
            <span
              key={tag}
              className="tw:bg-[#F1F5F9] tw:text-slate-700 tw:text-xs tw:font-medium tw:px-2.5 tw:py-1 tw:rounded-md"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Button */}
        {tier.isSwaPick ? (
          <button
            type="button"
            onClick={() => onPickTier?.(tier)}
            className="tw:w-full tw:flex tw:items-center tw:justify-center tw:gap-2 tw:bg-[#1E2D42] hover:tw:bg-[#152336] tw:text-white tw:font-semibold tw:text-xs sm:tw:text-sm tw:py-2.5 tw:px-3 tw:rounded-xl tw:shadow-xs tw:cursor-pointer tw:transition-all"
          >
            <span>{tier.buttonLabel}</span>
            <ArrowRight size={15} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onPickTier?.(tier)}
            className="tw:w-full tw:flex tw:items-center tw:justify-center tw:gap-2 tw:bg-white hover:tw:bg-slate-50 tw:border tw:border-slate-300 tw:text-[#183B47] tw:font-semibold tw:text-xs sm:tw:text-sm tw:py-2.5 tw:px-3 tw:rounded-xl tw:shadow-2xs tw:cursor-pointer tw:transition-all"
          >
            <span>{tier.buttonLabel}</span>
            <ArrowRight size={15} />
          </button>
        )}
      </div>
    </div>
  );
};

export default TierCard;
