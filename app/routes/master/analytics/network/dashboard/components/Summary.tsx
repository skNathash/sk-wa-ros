import React from "react";
import type { NetworkSummaryItem } from "../helper";
import { summaryIconMap } from "../helper";

// Compact colour accents per stat colour.
const colorMap: Record<string, { icon: string; value: string }> = {
  primary: { icon: "tw:text-primary tw:bg-primary/10", value: "tw:text-primary" },
  secondary: {
    icon: "tw:text-indigo-600 tw:bg-indigo-100",
    value: "tw:text-indigo-700",
  },
  warning: {
    icon: "tw:text-amber-600 tw:bg-amber-100",
    value: "tw:text-amber-700",
  },
  info: { icon: "tw:text-sky-600 tw:bg-sky-100", value: "tw:text-sky-700" },
  success: {
    icon: "tw:text-emerald-600 tw:bg-emerald-100",
    value: "tw:text-emerald-700",
  },
  danger: { icon: "tw:text-rose-600 tw:bg-rose-100", value: "tw:text-rose-700" },
};

const Summary = ({
  summary,
  loading = false,
}: {
  summary: NetworkSummaryItem[];
  loading?: boolean;
}) => {
  return (
    <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-5 tw:gap-2 tw:mb-4">
      {summary.map((s) => {
        const c = colorMap[s.color || "primary"] || colorMap.primary;
        const Icon = summaryIconMap[s.key];
        return (
          <div
            key={s.key}
            className="tw:flex tw:items-center tw:gap-2.5 tw:rounded-lg tw:border tw:border-gray-200 tw:bg-white tw:px-3 tw:py-2"
          >
            {Icon && (
              <span
                className={`tw:flex tw:h-8 tw:w-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-md ${c.icon}`}
              >
                {React.createElement(Icon, { className: "tw:w-4 tw:h-4" })}
              </span>
            )}
            <div className="tw:flex tw:flex-col tw:min-w-0">
              <span className="tw:text-[11px] tw:text-gray-500 tw:truncate">
                {s.label}
              </span>
              {loading ? (
                <span className="tw:mt-0.5 tw:inline-block tw:h-4 tw:w-12 tw:rounded tw:bg-gray-200 tw:animate-pulse" />
              ) : (
                <span className={`tw:text-lg tw:font-bold tw:leading-tight ${c.value}`}>
                  {s.value}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Summary;
