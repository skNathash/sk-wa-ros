import React from "react";
import clsx from "clsx";
import {
  planCardAccents,
  tierGradients,
  type PlanCardAccent,
  type PlanCardData,
  type PlanCardTier,
} from "./helper";

interface PlanCardProps {
  data: PlanCardData;
  accent: PlanCardAccent;
  /** Stock cards centre the badge, Shop cards anchor it to the left. */
  badgeAlign?: "center" | "left";
  /** Keeps card heights aligned when subtitles wrap to different line counts. */
  subtitleMinHeight?: number;
}

const PlanCardIcon: React.FC<{ tier: PlanCardTier }> = ({ tier }) => (
  <div
    className={clsx(
      "tw:w-11 tw:h-11 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:bg-gradient-to-br tw:shadow-sm tw:text-white",
      tierGradients[tier]
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

const PlanCard: React.FC<PlanCardProps> = ({
  data,
  accent,
  badgeAlign = "center",
  subtitleMinHeight = 20,
}) => {
  const tokens = planCardAccents[accent];

  return (
    <div
      id={data.id}
      className={clsx(
        "tw:relative tw:bg-white tw:rounded-3xl tw:p-5 tw:flex tw:flex-col tw:justify-between tw:transition-all",
        data.isHighlighted
          ? tokens.activeBorder
          : "tw:border tw:border-slate-200/90 tw:shadow-xs hover:tw:border-slate-300"
      )}
    >
      {/* Top Pill / Badge */}
      {data.badge && (
        <div
          className={clsx(
            "tw:absolute -tw:top-3.5 tw:px-3 tw:py-1 tw:rounded-md tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wider tw:shadow-xs tw:whitespace-nowrap tw:z-10",
            badgeAlign === "center"
              ? "tw:left-1/2 -tw:translate-x-1/2"
              : "tw:left-6",
            data.badge.variant === "recommended"
              ? tokens.recommendedBadge
              : tokens.popularBadge
          )}
        >
          {data.badge.label}
        </div>
      )}

      {/* Card Body */}
      <div>
        <PlanCardIcon tier={data.iconTier} />

        <h3 className="tw:font-serif tw:text-xl tw:font-bold tw:text-[#183B47] tw:mt-3">
          {data.name}
        </h3>
        <p
          className="tw:text-xs tw:text-slate-500 tw:mt-1 tw:leading-normal"
          style={{ minHeight: `${subtitleMinHeight}px` }}
        >
          {data.subtitle}
        </p>

        {/* Highlight Box — monthly credit / monthly bills */}
        <div className="tw:bg-[#F8FAFC] tw:rounded-2xl tw:p-3.5 tw:my-4">
          <span className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wider tw:text-slate-500 tw:block">
            {data.highlight.label}
          </span>
          <div
            className={clsx(
              "tw:font-serif tw:text-2xl tw:font-bold tw:mt-0.5",
              tokens.value
            )}
          >
            {data.highlight.value}
          </div>
          {data.highlight.sub && (
            <span className="tw:text-xs tw:text-slate-500 tw:block tw:mt-0.5">
              {data.highlight.sub}
            </span>
          )}
        </div>

        {/* Fee Breakdown */}
        <div className="tw:space-y-1.5 tw:text-xs tw:text-slate-600">
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

        {/* Dashed Separator */}
        <div className="tw:border-t tw:border-dashed tw:border-slate-200 tw:my-3.5" />

        {/* Pay Today */}
        <div className="tw:flex tw:items-baseline tw:justify-between">
          <span className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wider tw:text-slate-700">
            {data.payTodayLabel}
          </span>
          <span
            className={clsx(
              "tw:font-serif tw:text-2xl tw:font-bold",
              tokens.value
            )}
          >
            {data.payTodayValue}
          </span>
        </div>
      </div>

      {/* Bottom Badges */}
      <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2 tw:mt-4 tw:pt-1">
        {data.tags.map((tag) => (
          <span
            key={tag}
            className="tw:bg-[#F1F5F9] tw:text-slate-700 tw:text-xs tw:font-medium tw:px-2.5 tw:py-1 tw:rounded-md"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};

export default PlanCard;
