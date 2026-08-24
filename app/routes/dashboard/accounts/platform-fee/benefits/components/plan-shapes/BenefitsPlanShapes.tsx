import React, { useEffect, useState } from "react";
import { ArrowRight, Check, Layers, Store } from "lucide-react";
import useAppNav from "~/hooks/useAppNav";
import FranchiseService, {
  type PlanShapeSummaries,
} from "~/services/FranchiseService";

interface BenefitsPlanShapesProps {
  onExploreStock?: () => void;
  onExploreShop?: () => void;
}

export default function BenefitsPlanShapes({
  onExploreStock,
  onExploreShop,
}: BenefitsPlanShapesProps) {
  const appNav = useAppNav();
  const [planShapes, setPlanShapes] = useState<PlanShapeSummaries | null>(null);

  useEffect(() => {
    let active = true;

    FranchiseService.getPlanShapeSummaries().then((data) => {
      if (active) setPlanShapes(data);
    });

    return () => {
      active = false;
    };
  }, []);

  const handleStockClick = () => {
    if (onExploreStock) {
      onExploreStock();
    } else {
      appNav.to("/dashboard/accounts/platform-fee", {
        tab: "commission-invoices",
        subtab: "available-plans",
        category: "stock",
      });
    }
  };

  const handleShopClick = () => {
    if (onExploreShop) {
      onExploreShop();
    } else {
      appNav.to("/dashboard/accounts/platform-fee", {
        tab: "commission-invoices",
        subtab: "available-plans",
        category: "shop",
      });
    }
  };

  return (
    <div className="tw:space-y-4">
      {/* Header Row */}
      <div className="tw:flex tw:flex-col tw:sm:flex-row tw:sm:items-end tw:justify-between tw:gap-2">
        <h2 className="tw:text-2xl tw:sm:text-3xl tw:font-serif tw:font-medium tw:text-[#182638]">
          Pick the shape that fits{" "}
          <span className="tw:italic tw:font-normal">your</span> shop today
        </h2>
        <div className="tw:text-xs tw:font-semibold tw:tracking-widest tw:text-slate-400 tw:uppercase">
          START WITH ONE · ADD THE OTHER LATER
        </div>
      </div>

      {/* 2 Plan Cards */}
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-6">
        {/* Stock Card */}
        <div className="tw:bg-[#FFFBF0] tw:border tw:border-[#F4E2BD] tw:rounded-3xl tw:p-6 tw:sm:p-8 tw:flex tw:flex-col tw:justify-between tw:shadow-xs">
          <div className="tw:space-y-4">
            {/* Tag */}
            <div className="tw:inline-flex tw:items-center tw:gap-2 tw:text-xs tw:font-bold tw:tracking-widest tw:text-[#B45309] tw:uppercase">
              <Layers className="tw:w-4 tw:h-4 tw:text-[#B45309]" />
              STOCK · GO LIVE
              {planShapes?.stock.count
                ? ` · ${planShapes.stock.count} TIERS`
                : ""}
            </div>

            {/* Title */}
            <h3 className="tw:text-2xl tw:sm:text-3xl tw:font-serif tw:font-medium tw:text-[#182638] tw:leading-snug">
              Your{" "}
              <span className="tw:italic tw:font-normal tw:text-[#182638]">
                inventory
              </span>
              , online in 5 minutes.
            </h3>

            {/* Description */}
            <p className="tw:text-sm tw:text-slate-600 tw:leading-relaxed">
              Same stock on your shelf, now reachable beyond your street. AI
              takes the photos, writes the titles, syncs prices to WhatsApp.
            </p>

            {/* Feature List */}
            <div className="tw:space-y-2.5 tw:pt-2">
              <div className="tw:flex tw:items-start tw:gap-2.5 tw:text-sm tw:text-slate-700">
                <Check className="tw:w-4 tw:h-4 tw:text-[#B45309] tw:shrink-0 tw:mt-0.5" />
                <span>Inventory credit ₹1L → ₹25L / month</span>
              </div>
              <div className="tw:flex tw:items-start tw:gap-2.5 tw:text-sm tw:text-slate-700">
                <Check className="tw:w-4 tw:h-4 tw:text-[#B45309] tw:shrink-0 tw:mt-0.5" />
                <span>Storefront on WhatsApp + shareable link</span>
              </div>
              <div className="tw:flex tw:items-start tw:gap-2.5 tw:text-sm tw:text-slate-700">
                <Check className="tw:w-4 tw:h-4 tw:text-[#B45309] tw:shrink-0 tw:mt-0.5" />
                <span>2-hour priority delivery on SK stock</span>
              </div>
            </div>
          </div>

          {/* Bottom Price & CTA */}
          <div className="tw:pt-6 tw:mt-6 tw:border-t tw:border-dashed tw:border-[#F4E2BD] tw:flex tw:items-center tw:justify-between tw:gap-4">
            <div>
              <div className="tw:text-[10px] tw:font-bold tw:tracking-wider tw:text-[#B45309] tw:uppercase">
                STARTING
              </div>
              <div className="tw:flex tw:items-baseline tw:gap-1">
                <span className="tw:text-2xl tw:sm:text-3xl tw:font-serif tw:font-bold tw:text-[#182638]">
                  {planShapes?.stock.startingDisplay || "—"}
                </span>
                <span className="tw:text-xs tw:text-slate-500">/mo</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStockClick}
              className="tw:inline-flex tw:items-center tw:gap-2 tw:bg-[#C27803] tw:hover:bg-[#A86400] tw:text-white tw:px-5 tw:sm:px-6 tw:py-3 tw:rounded-xl tw:text-sm tw:font-semibold tw:shadow-sm tw:transition-all"
            >
              Explore Stock
              <ArrowRight className="tw:w-4 tw:h-4" />
            </button>
          </div>
        </div>

        {/* Shop Card */}
        <div className="tw:bg-[#EEF5FD] tw:border tw:border-[#C6DDFC] tw:rounded-3xl tw:p-6 tw:sm:p-8 tw:flex tw:flex-col tw:justify-between tw:shadow-xs">
          <div className="tw:space-y-4">
            {/* Tag */}
            <div className="tw:inline-flex tw:items-center tw:gap-2 tw:text-xs tw:font-bold tw:tracking-widest tw:text-[#1D4ED8] tw:uppercase">
              <Store className="tw:w-4 tw:h-4 tw:text-[#1D4ED8]" />
              SHOP · MANAGE COUNTER
              {planShapes?.shop.count
                ? ` · ${planShapes.shop.count} TIERS`
                : ""}
            </div>

            {/* Title */}
            <h3 className="tw:text-2xl tw:sm:text-3xl tw:font-serif tw:font-medium tw:text-[#182638] tw:leading-snug">
              Your{" "}
              <span className="tw:italic tw:font-normal tw:text-[#182638]">
                counter
              </span>
              , billing in 2 seconds.
            </h3>

            {/* Description */}
            <p className="tw:text-sm tw:text-slate-600 tw:leading-relaxed">
              Replace your billing machine with SK OS. AI billing, offline mode,
              khata, Paylater — the entire counter in your language.
            </p>

            {/* Feature List */}
            <div className="tw:space-y-2.5 tw:pt-2">
              <div className="tw:flex tw:items-start tw:gap-2.5 tw:text-sm tw:text-slate-700">
                <Check className="tw:w-4 tw:h-4 tw:text-[#1D4ED8] tw:shrink-0 tw:mt-0.5" />
                <span>Works offline · syncs when back online</span>
              </div>
              <div className="tw:flex tw:items-start tw:gap-2.5 tw:text-sm tw:text-slate-700">
                <Check className="tw:w-4 tw:h-4 tw:text-[#1D4ED8] tw:shrink-0 tw:mt-0.5" />
                <span>Kannada / Tamil / Hindi voice billing</span>
              </div>
              <div className="tw:flex tw:items-start tw:gap-2.5 tw:text-sm tw:text-slate-700">
                <Check className="tw:w-4 tw:h-4 tw:text-[#1D4ED8] tw:shrink-0 tw:mt-0.5" />
                <span>Digital khata + Paylater built-in</span>
              </div>
            </div>
          </div>

          {/* Bottom Price & CTA */}
          <div className="tw:pt-6 tw:mt-6 tw:border-t tw:border-dashed tw:border-[#C6DDFC] tw:flex tw:items-center tw:justify-between tw:gap-4">
            <div>
              <div className="tw:text-[10px] tw:font-bold tw:tracking-wider tw:text-[#1D4ED8] tw:uppercase">
                STARTING
              </div>
              <div className="tw:flex tw:items-baseline tw:gap-1">
                <span className="tw:text-2xl tw:sm:text-3xl tw:font-serif tw:font-bold tw:text-[#182638]">
                  {planShapes?.shop.startingDisplay || "—"}
                </span>
                <span className="tw:text-xs tw:text-slate-500">/mo</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleShopClick}
              className="tw:inline-flex tw:items-center tw:gap-2 tw:bg-[#1D4ED8] tw:hover:bg-[#1A42B8] tw:text-white tw:px-5 tw:sm:px-6 tw:py-3 tw:rounded-xl tw:text-sm tw:font-semibold tw:shadow-sm tw:transition-all"
            >
              Explore Shop
              <ArrowRight className="tw:w-4 tw:h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
