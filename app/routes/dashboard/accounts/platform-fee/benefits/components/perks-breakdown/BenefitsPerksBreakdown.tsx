import React, { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { getPerksBreakdown, type PerkGroup, type PerksBreakdown } from "./helper";

interface BenefitsPerksBreakdownProps {
  onAskSwa?: () => void;
}

interface PerksCardProps {
  group: PerkGroup;
  /** Card accent — the two shapes keep their amber / blue identity. */
  variant: "stock" | "shop";
}

const CARD_STYLES = {
  stock: {
    card: "tw:border-[#F4E2BD]",
    header: "tw:bg-[#FFFBF0] tw:border-[#F4E2BD]",
    title: "tw:text-[#B45309]",
    icon: "tw:bg-[#FFF4DC] tw:text-[#B45309]",
  },
  shop: {
    card: "tw:border-[#C6DDFC]",
    header: "tw:bg-[#EEF5FD] tw:border-[#C6DDFC]",
    title: "tw:text-[#1D4ED8]",
    icon: "tw:bg-[#E0EDFD] tw:text-[#1D4ED8]",
  },
} as const;

function PerksCard({ group, variant }: PerksCardProps) {
  const styles = CARD_STYLES[variant];

  return (
    <div
      className={`tw:bg-white tw:border ${styles.card} tw:rounded-3xl tw:overflow-hidden tw:shadow-xs`}
    >
      {/* Card Header */}
      <div className={`tw:px-3 tw:py-2.5 tw:md:px-4 tw:md:py-3 tw:border-b ${styles.header}`}>
        <h3
          className={`tw:text-base tw:md:text-2xl tw:font-serif tw:font-bold ${styles.title}`}
        >
          {group.title}
        </h3>
        <p className="tw:text-[11px] tw:md:text-sm tw:text-slate-600 tw:mt-0.5">
          {group.caption}
        </p>
      </div>

      {/* Perks List */}
      <div className="tw:divide-y tw:divide-slate-100 tw:p-1.5 tw:md:p-2">
        {group.perks.map((item) => (
          <div
            key={item.id}
            className="tw:px-2 tw:py-2 tw:md:px-2.5 tw:md:py-2.5 tw:flex tw:items-center tw:gap-2.5 tw:md:gap-3.5 tw:hover:bg-slate-50/70 tw:rounded-xl tw:transition-colors"
          >
            <div
              className={`tw:w-8 tw:h-8 tw:md:w-9 tw:md:h-9 ${styles.icon} tw:rounded-xl tw:flex tw:items-center tw:justify-center tw:shrink-0`}
            >
              <Sparkles className="tw:w-4 tw:h-4 tw:md:w-5 tw:md:h-5" />
            </div>
            <div className="tw:min-w-0 tw:flex-1">
              <div className="tw:font-semibold tw:text-[#182638] tw:text-[13px] tw:md:text-base">
                {item.title}
              </div>
              <div className="tw:text-[11px] tw:md:text-xs tw:text-slate-500 tw:mt-0.5">
                {item.desc}
              </div>
            </div>
            <div className="tw:text-[11px] tw:md:text-xs tw:font-semibold tw:text-slate-600 tw:shrink-0 tw:text-right">
              {item.valueLabel}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BenefitsPerksBreakdown({
  onAskSwa,
}: BenefitsPerksBreakdownProps) {
  const [breakdown, setBreakdown] = useState<PerksBreakdown | null>(null);

  useEffect(() => {
    let active = true;

    getPerksBreakdown().then((data) => {
      if (active) setBreakdown(data);
    });

    return () => {
      active = false;
    };
  }, []);

  if (!breakdown) return null;

  return (
    <div className="tw:space-y-4 tw:md:space-y-6">
      {/* Header */}
      <div>
        <h2 className="tw:text-xl tw:sm:text-3xl tw:lg:text-4xl tw:font-serif tw:font-medium tw:text-[#182638]">
          What actually comes in the box.
        </h2>
        <p className="tw:text-xs tw:sm:text-base tw:text-slate-500 tw:mt-1">
          Every perk is a real SK OS module you can look up. No marketing
          filler.
        </p>
      </div>

      {/* Two Breakdown Columns */}
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4 tw:md:gap-6">
        <PerksCard group={breakdown.stock} variant="stock" />
        <PerksCard group={breakdown.shop} variant="shop" />
      </div>

      {/* Floating Ask Swa Widget (Bottom Right) */}
      <div
        role="button"
        tabIndex={0}
        onClick={onAskSwa}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onAskSwa?.();
        }}
        className="tw:fixed tw:bottom-6 tw:right-6 tw:z-30 tw:bg-white tw:rounded-2xl tw:shadow-xl tw:border tw:border-slate-200/90 tw:py-2.5 tw:px-4 tw:flex tw:items-center tw:gap-3 tw:cursor-pointer tw:hover:shadow-2xl tw:hover:scale-[1.02] tw:transition-all"
      >
        <img
          src="/assets/images/ai/swa-buddy.png"
          alt="Ask Swa"
          className="tw:w-8 tw:h-8 tw:rounded-full tw:object-cover"
        />
        <div className="tw:text-left">
          <div className="tw:text-[9px] tw:font-bold tw:tracking-wider tw:text-slate-400 tw:uppercase">
            ASK SWA
          </div>
          <div className="tw:text-xs tw:font-semibold tw:text-[#182638]">
            Which plan fits my shop?
          </div>
        </div>
        <span className="tw:w-2 tw:h-2 tw:bg-emerald-500 tw:rounded-full tw:animate-pulse"></span>
      </div>
    </div>
  );
}
