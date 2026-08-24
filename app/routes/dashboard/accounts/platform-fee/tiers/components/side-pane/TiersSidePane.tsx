import React from "react";
import clsx from "clsx";
import { Bot } from "lucide-react";
import ImgRender from "~/components/core/img/ImgRender";
import { Skeleton } from "~/components/ui/skeleton";
import type { TierType } from "../helper";
import {
  economicsPoints,
  type SidePaneTierCounts,
  type SidePaneTierItem,
} from "./helper";

interface TiersSidePaneProps {
  className?: string;
  /** ALL TIERS rows of the selected shape. */
  tiers: SidePaneTierItem[];
  /** Tier counts of both shapes, shown on the filter pills. */
  counts: SidePaneTierCounts;
  loading?: boolean;
  selectedType: TierType;
  onSelectType?: (type: TierType) => void;
  onSelectTier?: (tierId: string) => void;
}

const BadgeIcon: React.FC<{
  letter: string;
  tier: SidePaneTierItem["badgeTier"];
}> = ({ letter, tier }) => {
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
        "tw:w-9 tw:h-9 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:bg-gradient-to-br tw:text-white tw:font-semibold tw:text-xs tw:shadow-xs tw:shrink-0",
        getGradient(),
      )}
    >
      {letter}
    </div>
  );
};

const TiersSidePane: React.FC<TiersSidePaneProps> = ({
  className,
  tiers,
  counts,
  loading,
  selectedType,
  onSelectType,
  onSelectTier,
}) => {
  const handleTierClick = (tierId: string) => {
    if (onSelectTier) {
      onSelectTier(tierId);
    } else {
      const el = document.getElementById(tierId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  return (
    <div className={clsx("tw:flex tw:flex-col tw:gap-4.5 tw:p-0.5", className)}>
      {/* Header */}
      <div className="tw:flex tw:items-baseline tw:justify-between tw:px-0.5">
        <h2 className="tw:font-serif tw:text-2xl tw:font-bold tw:tracking-tight tw:text-[#183B47]">
          Tiers
        </h2>
        <span className="tw:text-xs tw:font-normal tw:text-[#527987]">
          {counts.stock} Stock · {counts.shop} Shop
        </span>
      </div>

      {/* Filter toggle pills */}
      <div className="tw:flex tw:items-center tw:gap-2">
        <button
          type="button"
          onClick={() => onSelectType?.("stock")}
          className={clsx(
            "tw:inline-flex tw:items-center tw:gap-2 tw:px-3.5 tw:py-1.5 tw:rounded-full tw:text-xs tw:font-semibold tw:transition-all tw:cursor-pointer",
            selectedType === "stock"
              ? "tw:bg-[#8D4A1B] tw:text-white tw:shadow-xs"
              : "tw:bg-[#F4F6F8] tw:text-slate-700 hover:tw:bg-slate-200",
          )}
        >
          <span>Stock</span>
          <span
            className={clsx(
              "tw:w-4.5 tw:h-4.5 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:text-[10px] tw:font-bold",
              selectedType === "stock"
                ? "tw:bg-[#6D340E] tw:text-white"
                : "tw:bg-slate-300 tw:text-slate-700",
            )}
          >
            {counts.stock}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectType?.("shop")}
          className={clsx(
            "tw:inline-flex tw:items-center tw:gap-2 tw:px-3.5 tw:py-1.5 tw:rounded-full tw:text-xs tw:font-semibold tw:transition-all tw:cursor-pointer",
            selectedType === "shop"
              ? "tw:bg-[#007367] tw:text-white tw:shadow-xs"
              : "tw:bg-[#F4F6F8] tw:text-slate-700 hover:tw:bg-slate-200",
          )}
        >
          <span>Shop</span>
          <span
            className={clsx(
              "tw:w-4.5 tw:h-4.5 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:text-[10px] tw:font-bold",
              selectedType === "shop"
                ? "tw:bg-[#005149] tw:text-white"
                : "tw:bg-[#007367] tw:text-white",
            )}
          >
            {counts.shop}
          </span>
        </button>
      </div>

      {/* Mascot Card: SWA'S PICK */}
      <div className="tw:rounded-2xl tw:border tw:border-sky-200/70 tw:bg-[#F4F9FD] tw:p-3.5 tw:shadow-xs">
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
            <p className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-widest tw:text-[#3B6A93]">
              SWA&apos;S PICK
            </p>
            <p className="tw:font-serif tw:italic tw:text-xs sm:tw:text-[13px] tw:text-[#233C4F] tw:mt-0.5 tw:leading-snug">
              &ldquo;Stock 10L fits your ₹8L monthly buy. 42 peers on HSR
              agree.&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* ALL TIERS Section */}
      <div className="tw:space-y-2">
        <div className="tw:px-0.5">
          <span className="tw:text-[11px] tw:font-bold tw:uppercase tw:tracking-wider tw:text-[#527987]">
            ALL TIERS
          </span>
        </div>

        <div className="tw:space-y-2">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="tw:h-14 tw:rounded-2xl" />
              ))
            : tiers.map((tier: SidePaneTierItem) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => handleTierClick(tier.id)}
                  className={clsx(
                    "tw:w-full tw:flex tw:items-center tw:justify-between tw:px-3 tw:py-2.5 tw:rounded-2xl tw:transition-all tw:cursor-pointer tw:text-left",
                    tier.isYours
                      ? "tw:bg-[#FCF7ED] tw:border-2 tw:border-[#E5A93C] tw:shadow-xs"
                      : "tw:bg-white tw:border tw:border-slate-200/80 tw:shadow-2xs hover:tw:border-slate-300",
                  )}
                >
                  <div className="tw:flex tw:items-center tw:gap-3 tw:min-w-0">
                    <BadgeIcon
                      letter={tier.badgeLetter}
                      tier={tier.badgeTier}
                    />
                    <div className="tw:min-w-0">
                      <h4 className="tw:font-serif tw:text-sm tw:font-bold tw:text-[#183B47] tw:leading-snug">
                        {tier.name}
                      </h4>
                      <p className="tw:text-xs tw:text-slate-500 tw:mt-0.5">
                        {tier.subtitle}
                      </p>
                    </div>
                  </div>

                  {tier.isYours && (
                    <span className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wider tw:text-[#9E5114] tw:px-1.5 tw:py-0.5">
                      YOURS
                    </span>
                  )}
                </button>
              ))}
        </div>
      </div>

      {/* THE ECONOMICS Section */}
      <div className="tw:space-y-2 tw:pt-1">
        <div className="tw:px-0.5">
          <span className="tw:text-[11px] tw:font-bold tw:uppercase tw:tracking-wider tw:text-[#527987]">
            THE ECONOMICS
          </span>
        </div>

        <div className="tw:space-y-2.5 tw:px-0.5 tw:text-xs tw:text-slate-600 tw:leading-relaxed">
          {economicsPoints.map((point) => (
            <p key={point.title}>
              <span className="tw:text-slate-400">· </span>
              <strong className="tw:font-semibold tw:text-slate-900">
                {point.title}
              </strong>{" "}
              — {point.description}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TiersSidePane;
