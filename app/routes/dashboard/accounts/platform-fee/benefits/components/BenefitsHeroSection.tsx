import React, { useEffect, useState } from "react";
import { MessageSquare, Sparkles, Star } from "lucide-react";
import useAppNav from "~/hooks/useAppNav";
import FranchiseService, {
  type PlanShapeSummaries,
} from "~/services/FranchiseService";
import { getShopShape, type ShopShapeSummary } from "../helper";

interface BenefitsHeroSectionProps {
  onShowMatch?: () => void;
  onCompareTiers?: () => void;
  onAskSwa?: () => void;
}

export default function BenefitsHeroSection({
  onShowMatch,
  onCompareTiers,
  onAskSwa,
}: BenefitsHeroSectionProps) {
  const appNav = useAppNav();
  const [shopShape, setShopShape] = useState<ShopShapeSummary | null>(null);
  const [shapeSummaries, setShapeSummaries] =
    useState<PlanShapeSummaries | null>(null);

  useEffect(() => {
    let active = true;

    getShopShape().then((data) => {
      if (active) setShopShape(data);
    });

    FranchiseService.getPlanShapeSummaries().then((data) => {
      if (active) setShapeSummaries(data);
    });

    return () => {
      active = false;
    };
  }, []);

  const handleCompareTiers = () => {
    if (onCompareTiers) {
      onCompareTiers();
    } else {
      appNav.to("/dashboard/accounts/platform-fee", {
        tab: "commission-invoices",
        subtab: "available-plans",
        skipBenefits: "true",
      });
    }
  };

  return (
    <div
      className="tw:relative tw:overflow-hidden tw:rounded-2xl tw:sm:rounded-3xl tw:border tw:border-[#DCE2EB]/80 tw:p-4 tw:sm:p-8 tw:lg:p-10 tw:shadow-sm"
      style={{
        background:
          "linear-gradient(135deg, #FBF6EC 0%, #F6F2E9 40%, #E8F0FB 100%)",
      }}
    >
      <div className="tw:grid tw:grid-cols-1 tw:lg:grid-cols-12 tw:gap-6 tw:lg:gap-8 tw:items-center">
        {/* Left Headline & Actions */}
        <div className="tw:lg:col-span-6 tw:flex tw:flex-col tw:gap-4 tw:lg:gap-6">
          {/* Badge + headline + mobile mascot */}
          <div className="tw:order-1 tw:flex tw:items-start tw:gap-3">
            <div className="tw:flex-1 tw:min-w-0 tw:space-y-2 tw:lg:space-y-6">
              <div className="tw:text-[10px] tw:sm:text-xs tw:font-semibold tw:tracking-widest tw:text-slate-500 tw:uppercase">
                — STOREKING PLANS
              </div>

              <h1 className="tw:text-[22px] tw:sm:text-4xl tw:lg:text-5xl tw:font-serif tw:font-medium tw:text-[#182638] tw:leading-snug tw:lg:leading-tight">
                Your{" "}
                <span className="tw:italic tw:font-normal tw:text-[#B5741E]">
                  stock
                </span>
                , your{" "}
                <span className="tw:italic tw:font-normal tw:text-[#1D4ED8]">
                  counter
                </span>
                . One plan, both alive.
              </h1>
            </div>

            {/* Mobile-only mascot beside the headline */}
            <img
              src="/assets/images/ai/swa-buddy.png"
              alt="Swa - StoreKing AI Mascot"
              className="tw:lg:hidden tw:w-20 tw:h-20 tw:sm:w-24 tw:sm:h-24 tw:shrink-0 tw:object-contain tw:rounded-2xl tw:bg-white/70 tw:border tw:border-white/80 tw:p-1.5 tw:shadow-sm"
            />
          </div>

          {/* Trust badges — stat tiles on mobile, pills on desktop */}
          <div className="tw:order-2 tw:lg:order-5 tw:grid tw:grid-cols-3 tw:gap-2 tw:lg:flex tw:lg:flex-wrap tw:lg:items-center tw:lg:gap-2.5 tw:lg:pt-2">
            <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-0.5 tw:bg-white/90 tw:backdrop-blur-sm tw:border tw:border-slate-200/70 tw:rounded-2xl tw:px-2 tw:py-2.5 tw:text-center tw:shadow-2xs tw:lg:inline-flex tw:lg:flex-row tw:lg:items-center tw:lg:gap-1.5 tw:lg:rounded-full tw:lg:px-3.5 tw:lg:py-1.5 tw:lg:text-left">
              <span className="tw:hidden tw:lg:block tw:w-1.5 tw:h-1.5 tw:rounded-full tw:bg-slate-600"></span>
              <span className="tw:text-lg tw:font-serif tw:font-bold tw:text-[#182638] tw:lg:text-xs tw:lg:font-medium tw:lg:text-slate-700">
                42
              </span>
              <span className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-slate-500 tw:lg:text-xs tw:lg:font-medium tw:lg:normal-case tw:lg:tracking-normal">
                HSR shops
              </span>
            </div>

            <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-0.5 tw:bg-white/90 tw:backdrop-blur-sm tw:border tw:border-slate-200/70 tw:rounded-2xl tw:px-2 tw:py-2.5 tw:text-center tw:shadow-2xs tw:lg:inline-flex tw:lg:flex-row tw:lg:items-center tw:lg:gap-1.5 tw:lg:rounded-full tw:lg:px-3.5 tw:lg:py-1.5 tw:lg:text-left">
              <span className="tw:hidden tw:lg:block tw:w-1.5 tw:h-1.5 tw:rounded-full tw:bg-slate-600"></span>
              <span className="tw:text-lg tw:font-serif tw:font-bold tw:text-[#182638] tw:lg:text-xs tw:lg:font-medium tw:lg:text-slate-700">
                17m
              </span>
              <span className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-slate-500 tw:lg:text-xs tw:lg:font-medium tw:lg:normal-case tw:lg:tracking-normal">
                avg go-live
              </span>
            </div>

            <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-0.5 tw:bg-white/90 tw:backdrop-blur-sm tw:border tw:border-slate-200/70 tw:rounded-2xl tw:px-2 tw:py-2.5 tw:text-center tw:shadow-2xs tw:lg:inline-flex tw:lg:flex-row tw:lg:items-center tw:lg:gap-1.5 tw:lg:rounded-full tw:lg:px-3.5 tw:lg:py-1.5 tw:lg:text-left">
              <span className="tw:hidden tw:lg:block tw:w-1.5 tw:h-1.5 tw:rounded-full tw:bg-slate-600"></span>
              <span className="tw:flex tw:items-center tw:gap-0.5 tw:text-lg tw:font-serif tw:font-bold tw:text-[#182638] tw:lg:text-xs tw:lg:font-medium tw:lg:text-slate-700">
                4.7
                <Star className="tw:w-3.5 tw:h-3.5 tw:fill-amber-400 tw:text-amber-400" />
              </span>
              <span className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-slate-500 tw:lg:text-xs tw:lg:font-medium tw:lg:normal-case tw:lg:tracking-normal">
                retailer rating
              </span>
            </div>
          </div>

          <p className="tw:order-3 tw:lg:order-2 tw:text-[13px] tw:sm:text-base tw:text-slate-600 tw:leading-relaxed tw:max-w-xl">
            Point at what your shop already has today — walk-ins at the counter
            and stock on the shelf — and Swa will show you the two tiers that
            fit your shape this year.
          </p>

          {/* Action buttons — hidden on mobile */}
          <div className="tw:order-4 tw:lg:order-3 tw:hidden tw:lg:flex tw:flex-col tw:sm:flex-row tw:sm:flex-wrap tw:sm:items-center tw:gap-2.5 tw:sm:gap-3 tw:lg:pt-1">
            <button
              type="button"
              onClick={onShowMatch}
              className="tw:inline-flex tw:w-full tw:sm:w-auto tw:items-center tw:justify-center tw:gap-2 tw:bg-[#1E2B3E] tw:hover:bg-[#152030] tw:text-white tw:px-6 tw:py-3 tw:sm:py-3.5 tw:rounded-2xl tw:text-sm tw:font-semibold tw:shadow-md tw:transition-all"
            >
              <Sparkles className="tw:w-4 tw:h-4 tw:text-amber-300" />
              Show me my match
            </button>

            <button
              type="button"
              onClick={handleCompareTiers}
              className="tw:inline-flex tw:w-full tw:sm:w-auto tw:items-center tw:justify-center tw:bg-white tw:hover:bg-slate-50 tw:border tw:border-slate-300/80 tw:text-[#182638] tw:px-6 tw:py-3 tw:sm:py-3.5 tw:rounded-2xl tw:text-sm tw:font-semibold tw:shadow-sm tw:transition-all"
            >
              Compare all{" "}
              {shapeSummaries?.totalCount
                ? `${shapeSummaries.totalCount} `
                : ""}
              tiers
            </button>
          </div>

          {/* Ask Swa — hidden on mobile */}
          <div className="tw:order-5 tw:lg:order-4 tw:hidden tw:lg:block">
            <button
              type="button"
              onClick={onAskSwa}
              className="tw:inline-flex tw:w-full tw:sm:w-auto tw:items-center tw:justify-center tw:gap-2 tw:bg-white/90 tw:hover:bg-white tw:border tw:border-slate-200/90 tw:text-[#182638] tw:px-5 tw:py-2.5 tw:rounded-2xl tw:text-sm tw:font-medium tw:shadow-sm tw:transition-all"
            >
              <MessageSquare className="tw:w-4 tw:h-4 tw:text-slate-700" />
              Ask Swa
            </button>
          </div>
        </div>

        {/* Center Mascot & Right Side Metric Cards */}
        <div className="tw:lg:col-span-6 tw:grid tw:grid-cols-2 tw:sm:grid-cols-12 tw:gap-3 tw:sm:gap-4 tw:items-center">
          {/* Mascot card — on mobile the mascot already sits beside the headline */}
          <div className="tw:hidden tw:sm:col-span-5 tw:sm:flex tw:justify-center">
            <div className="tw:relative tw:bg-white tw:rounded-2xl tw:p-4 tw:pt-6 tw:pb-8 tw:shadow-lg tw:border tw:border-slate-100 tw:w-full tw:max-w-[210px] tw:flex tw:flex-col tw:items-center">
              <img
                src="/assets/images/ai/swa-hero.png"
                alt="Swa - StoreKing AI Mascot"
                className="tw:w-36 tw:h-44 tw:object-contain"
              />
              <div className="tw:absolute tw:-bottom-3 tw:bg-[#1E2B3E] tw:text-white tw:text-[11px] tw:font-medium tw:px-4 tw:py-1.5 tw:rounded-xl tw:shadow-md tw:whitespace-nowrap">
                Swa · guiding you today
              </div>
            </div>
          </div>

          {/* Metric cards */}
          <div className="tw:col-span-2 tw:sm:col-span-7 tw:grid tw:grid-cols-2 tw:sm:grid-cols-1 tw:gap-3">
            {/* Card 1 */}
            <div className="tw:bg-white/95 tw:backdrop-blur-sm tw:rounded-2xl tw:p-3.5 tw:sm:p-5 tw:border tw:border-slate-100 tw:shadow-sm">
              <div className="tw:text-[10px] tw:sm:text-[11px] tw:font-semibold tw:tracking-widest tw:text-[#3B669E] tw:uppercase">
                YOUR MONTHLY BUY
              </div>
              <div className="tw:text-xl tw:sm:text-3xl tw:font-serif tw:font-bold tw:text-[#182638] tw:mt-0.5">
                {shopShape?.monthlyBuy.display ?? "—"}
              </div>
              <div className="tw:text-[11px] tw:sm:text-xs tw:text-slate-500 tw:mt-0.5">
                {shopShape?.monthlyBuy.caption ??
                  "from vendors last month · adjust below to re-match"}
              </div>
            </div>

            {/* Card 2 */}
            <div className="tw:bg-white/95 tw:backdrop-blur-sm tw:rounded-2xl tw:p-3.5 tw:sm:p-5 tw:border tw:border-slate-100 tw:shadow-sm">
              <div className="tw:text-[10px] tw:sm:text-[11px] tw:font-semibold tw:tracking-widest tw:text-[#3B669E] tw:uppercase">
                BILLS PER DAY · COUNTER
              </div>
              <div className="tw:text-xl tw:sm:text-3xl tw:font-serif tw:font-bold tw:text-[#182638] tw:mt-0.5">
                {shopShape?.counterBills.display ?? "—"}
              </div>
              <div className="tw:text-[11px] tw:sm:text-xs tw:text-slate-500 tw:mt-0.5">
                {shopShape?.counterBills.caption ??
                  "bills at your counter · at your pace"}
              </div>
            </div>

            {/* Card 3 - Dark Navy */}
            <div className="tw:col-span-2 tw:sm:col-span-1 tw:bg-[#1E2B3E] tw:rounded-2xl tw:p-3.5 tw:sm:p-5 tw:text-white tw:shadow-md">
              <div className="tw:text-[10px] tw:sm:text-[11px] tw:font-semibold tw:tracking-widest tw:text-slate-300 tw:uppercase">
                SWA&apos;S READ ON YOU
              </div>
              <div className="tw:text-xl tw:sm:text-3xl tw:font-serif tw:font-bold tw:text-white tw:mt-0.5">
                10L + Unlim
              </div>
              <div className="tw:text-[11px] tw:sm:text-xs tw:text-slate-300 tw:mt-0.5">
                100% confidence · matched to your street&apos;s shape
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
