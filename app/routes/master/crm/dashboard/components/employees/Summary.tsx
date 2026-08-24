import React from "react";
import {
  Store,
  PhoneOutgoing,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { colorClasses } from "~/components/core/stats-card/helpers";
import type { DashboardSummary } from "./helper";

interface SummaryProps {
  summary: DashboardSummary;
  loading?: boolean;
  className?: string;
  // Currently applied status filter, used to highlight the active tile.
  activeStatus?: string;
  // Fired when a filterable tile is clicked with the status it represents
  // ("" = clears the status filter). Context tiles (outreach counts) don't
  // carry a status and are not clickable.
  onSelect?: (status: string) => void;
}

type Tile = {
  // Key into the live DashboardSummary metric this tile displays.
  key: keyof DashboardSummary;
  label?: string;
  // Short line under the number giving the metric meaning for the reader.
  hint: string;
  color: keyof typeof colorClasses;
  Icon: React.ComponentType<{ className?: string }>;
  // Status this tile filters by when clicked. Undefined = context-only tile.
  status?: string;
};

// Reframed around the employee's actual job: reach the retailer and log a store
// note, then log a follow-up note when a call-back is owed. The tiles read as a
// funnel — how many retailers were reached, how many asked for a call-back, how
// many of those are still pending, and how many have slipped past their date.
const tiles: Tile[] = [
  // {
  //   key: "retailersContacted",
  //   label: "Retailers Contacted",
  //   hint: "store notes logged",
  //   color: "primary",
  //   Icon: Store,
  // },
  {
    key: "totalFollowups",
    label: "Follow-ups",
    hint: "follow-ups logged",
    color: "info",
    Icon: PhoneOutgoing,
  },
  {
    key: "pendingFollowups",
    label: "Pending Follow-ups",
    hint: "awaiting action",
    color: "warning",
    Icon: Clock,
    status: "Open",
  },
  {
    key: "overdue",
    label: "Overdue",
    hint: "past due date",
    color: "danger",
    Icon: AlertTriangle,
    status: "Overdue",
  },
];

const Summary: React.FC<SummaryProps> = ({
  summary,
  loading,
  className,
  activeStatus = "",
  onSelect,
}) => {
  return (
    <div
      className={`tw:grid tw:grid-cols-2 tw:gap-3 tw:lg:grid-cols-3 ${
        className || ""
      }`}
    >
      {tiles.map(({ key, label, hint, color, Icon, status }) => {
        const c = colorClasses[color];
        const clickable = status !== undefined;
        const isActive = clickable && (activeStatus || "") === status;
        return (
          <button
            key={key}
            type="button"
            disabled={!clickable}
            // Clicking the active tile again clears back to "all".
            onClick={
              clickable
                ? () => onSelect?.(isActive ? "" : (status as string))
                : undefined
            }
            className={`tw:group tw:flex tw:items-start tw:gap-3 tw:rounded-xl tw:border tw:bg-white tw:px-4 tw:py-3.5 tw:text-left tw:transition-all ${
              clickable ? "tw:cursor-pointer" : "tw:cursor-default"
            } ${
              isActive
                ? `${c.activeBorder} ${c.bg}`
                : `tw:border-gray-200 ${clickable ? "tw:hover:border-gray-300 tw:hover:shadow-sm" : ""}`
            }`}
          >
            <span
              className={`${c.bg} tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg`}
            >
              <Icon className={`${c.text} tw:h-5 tw:w-5`} />
            </span>
            <div className="tw:min-w-0">
              <div
                className={`tw:text-2xl tw:font-bold tw:leading-none tw:tabular-nums tw:text-gray-900`}
              >
                {loading ? (
                  <span className="tw:inline-block tw:h-6 tw:w-10 tw:animate-pulse tw:rounded tw:bg-gray-200" />
                ) : (
                  (summary[key] ?? 0).toLocaleString()
                )}
              </div>
              <div className="tw:mt-1.5 tw:truncate tw:text-xs tw:font-semibold tw:text-gray-700">
                {label}
              </div>
              <div className="tw:mt-0.5 tw:truncate tw:text-[11px] tw:text-gray-400">
                {hint}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default Summary;
