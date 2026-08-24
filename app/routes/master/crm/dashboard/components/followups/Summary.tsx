import React from "react";
import {
  ListChecks,
  Clock,
  CircleCheck,
  AlertTriangle,
} from "lucide-react";
import { colorClasses } from "~/components/core/stats-card/helpers";
import { OVERDUE_STATUS, type DashboardSummary } from "./helper";

interface SummaryProps {
  summary: DashboardSummary;
  loading?: boolean;
  className?: string;
  // Current status filter ("" = no status filter / Total selected)
  activeStatus?: string;
  // Fired when a card is clicked so the parent can update the query params
  onSelect?: (status: string) => void;
}

type Tile = {
  key: keyof DashboardSummary;
  label: string;
  color: keyof typeof colorClasses;
  Icon: React.ComponentType<{ className?: string }>;
  // The status value this card filters by ("" = clear the status filter)
  status: string;
};

const tiles: Tile[] = [
  {
    key: "total",
    label: "Total Follow-ups",
    color: "primary",
    Icon: ListChecks,
    status: "",
  },
  { key: "open", label: "Open", color: "warning", Icon: Clock, status: "Open" },
  {
    key: "closed",
    label: "Closed",
    color: "success",
    Icon: CircleCheck,
    status: "Completed",
  },
  {
    key: "overdue",
    label: "Overdue",
    color: "danger",
    Icon: AlertTriangle,
    status: OVERDUE_STATUS,
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
      className={`tw:overflow-hidden tw:rounded-lg tw:border tw:border-gray-200 tw:bg-white ${
        className || ""
      }`}
    >
      <div className="tw:grid tw:grid-cols-2 tw:sm:grid-cols-4 tw:divide-x tw:divide-y tw:sm:divide-y-0 tw:divide-gray-100">
        {tiles.map(({ key, label, color, Icon, status }) => {
          const c = colorClasses[color];
          const active = activeStatus === status;
          const clickable = !!onSelect;
          return (
            <button
              key={key}
              type="button"
              onClick={clickable ? () => onSelect(status) : undefined}
              disabled={!clickable}
              className={`tw:flex tw:items-center tw:gap-2.5 tw:px-3.5 tw:py-2.5 tw:text-left tw:transition-colors ${
                active ? c.activeBg : "tw:bg-white"
              } ${
                clickable
                  ? "tw:cursor-pointer tw:hover:bg-gray-50"
                  : "tw:cursor-default"
              }`}
            >
              <span
                className={`${c.bg} tw:flex tw:h-8 tw:w-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-md`}
              >
                <Icon className={`${c.text} tw:h-4 tw:w-4`} />
              </span>
              <div className="tw:min-w-0">
                <div
                  className={`${c.text} tw:text-lg tw:font-bold tw:leading-none tw:tabular-nums`}
                >
                  {loading ? (
                    <span className="tw:inline-block tw:h-4 tw:w-8 tw:animate-pulse tw:rounded tw:bg-gray-200" />
                  ) : (
                    (summary[key] ?? 0).toLocaleString()
                  )}
                </div>
                <div className="tw:mt-1 tw:truncate tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500">
                  {label}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Summary;
