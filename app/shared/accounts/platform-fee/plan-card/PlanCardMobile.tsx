import React from "react";
import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import {
  planCardAccents,
  tierGradients,
  type PlanCardAccent,
  type PlanCardData,
  type PlanCardTier,
} from "./helper";

interface PlanCardMobileProps {
  data: PlanCardData;
  accent?: PlanCardAccent;
  /** CTA copy, e.g. "Pick Stock 1L". The card hides the button without it. */
  buttonLabel?: string;
  onPick?: (data: PlanCardData) => void;
}

/** Narrow cards lead with the tier initial instead of the desktop star. */
const PlanCardMobileIcon: React.FC<{ tier: PlanCardTier }> = ({ tier }) => (
  <div
    className={clsx(
      "tw:w-10 tw:h-10 tw:shrink-0 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:bg-gradient-to-br tw:shadow-sm tw:font-serif tw:text-base tw:font-bold tw:text-white",
      tierGradients[tier],
    )}
  >
    {tier.charAt(0).toUpperCase()}
  </div>
);

/** Splits "12 peers" so the count can carry the weight and the noun stays quiet. */
const splitTag = (tag: string) => {
  const match = tag.match(/^(\S+)\s+(.*)$/);
  return match ? { count: match[1], label: match[2] } : { count: tag, label: "" };
};

/**
 * Plan tier card for narrow screens — one column, so the highlight box carries
 * the peers/perks tags on its right and the pay-today total gets its own bar
 * above a full-width CTA.
 */
const PlanCardMobile: React.FC<PlanCardMobileProps> = ({
  data,
  accent = "amber",
  buttonLabel,
  onPick,
}) => {
  const tokens = planCardAccents[accent];

  return (
    <div
      id={data.id}
      className={clsx(
        "tw:relative tw:bg-white tw:rounded-2xl tw:p-4 tw:transition-all",
        data.isHighlighted
          ? tokens.activeBorder
          : "tw:border tw:border-slate-200/90 tw:shadow-xs",
      )}
    >
      {/* Top Badge */}
      {data.badge && (
        <div
          className={clsx(
            "tw:absolute -tw:top-2.5 tw:left-4 tw:px-2.5 tw:py-1 tw:rounded-md tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wider tw:shadow-xs tw:whitespace-nowrap tw:z-10",
            data.badge.variant === "recommended"
              ? tokens.recommendedBadge
              : tokens.popularBadge,
          )}
        >
          {data.badge.label}
        </div>
      )}

      {/* Identity — icon beside the name so the card opens on one line */}
      <div className="tw:flex tw:items-start tw:gap-3">
        <PlanCardMobileIcon tier={data.iconTier} />
        <div className="tw:min-w-0">
          <h3
            className={clsx(
              "tw:font-serif tw:text-lg tw:font-bold tw:leading-tight",
              tokens.value,
            )}
          >
            {data.name}
          </h3>
          <p className="tw:text-xs tw:text-slate-500 tw:mt-0.5 tw:leading-normal">
            {data.subtitle}
          </p>
        </div>
      </div>

      {/* Highlight Box — monthly credit / bills, with the tags on its right */}
      <div className="tw:mt-3.5 tw:rounded-xl tw:border tw:border-[#F0E0C0] tw:bg-[#FDF8EE] tw:p-3 tw:flex tw:items-start tw:justify-between tw:gap-3">
        <div className="tw:min-w-0">
          <span className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wider tw:text-[#A8814B] tw:block">
            {data.highlight.label}
          </span>
          <div
            className={clsx(
              "tw:font-serif tw:text-2xl tw:font-bold tw:mt-0.5",
              tokens.value,
            )}
          >
            {data.highlight.value}
          </div>
          {data.highlight.sub && (
            <span className="tw:text-[11px] tw:text-slate-500 tw:block tw:mt-0.5">
              {data.highlight.sub}
            </span>
          )}
        </div>

        {!!data.tags.length && (
          <div className="tw:shrink-0 tw:text-right tw:space-y-0.5">
            {data.tags.map((tag) => {
              const { count, label } = splitTag(tag);
              return (
                <div key={tag} className="tw:text-[11px] tw:text-slate-500">
                  <span className="tw:font-bold tw:text-[#183B47]">{count}</span>{" "}
                  {label}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fee Breakdown */}
      <div className="tw:mt-3 tw:space-y-1.5 tw:text-xs tw:text-slate-600">
        {data.feeRows.map((row) => (
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

      {/* Pay Today — its own bar so the total reads before the CTA */}
      <div className="tw:mt-3.5 tw:rounded-xl tw:bg-[#1E2D42] tw:px-4 tw:py-3 tw:flex tw:items-center tw:justify-between tw:gap-3">
        <span className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-widest tw:text-white/80">
          {data.payTodayLabel}
        </span>
        <span className="tw:font-serif tw:text-xl tw:font-bold tw:text-white">
          {data.payTodayValue}
        </span>
      </div>

      {/* CTA */}
      {!!buttonLabel && (
        <button
          type="button"
          onClick={() => onPick?.(data)}
          className="tw:mt-3 tw:w-full tw:flex tw:items-center tw:justify-center tw:gap-1 tw:rounded-xl tw:bg-[#A9600F] hover:tw:bg-[#8F4F0B] tw:text-white tw:font-semibold tw:text-sm tw:py-3 tw:px-3 tw:shadow-xs tw:cursor-pointer tw:transition-all"
        >
          <span>{buttonLabel}</span>
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
};

export default PlanCardMobile;
