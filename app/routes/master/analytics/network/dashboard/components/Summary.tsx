import AppStatsCard from "~/components/core/stats-card/AppStatsCard";
import type { NetworkSummaryItem } from "../helper";
import { summaryIconMap } from "../helper";
import React from "react";

const Summary = ({
  summary,
  loading = false,
}: {
  summary: NetworkSummaryItem[];
  loading?: boolean;
}) => {
  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-5 tw:gap-4 tw:mb-4">
      {summary.map((s) => (
        <AppStatsCard
          key={s.key}
          label={s.label}
          template={1}
          color={s.color}
          icon={
            summaryIconMap[s.key]
              ? React.createElement(summaryIconMap[s.key])
              : undefined
          }
        >
          {loading ? (
            <span className="tw:inline-block tw:h-7 tw:w-16 tw:rounded tw:bg-gray-200 tw:animate-pulse" />
          ) : (
            <span className="tw:text-2xl tw:font-bold">{s.value}</span>
          )}
        </AppStatsCard>
      ))}
    </div>
  );
};

export default Summary;
