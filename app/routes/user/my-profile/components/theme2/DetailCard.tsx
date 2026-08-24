import clsx from "clsx";
import React from "react";
import type { DetailValue } from "./helper";

export interface DetailCardAction {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  /** Renders the action as the card's primary (filled) button. */
  primary?: boolean;
}

interface DetailCardProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Tailwind classes for the icon chip, e.g. "tw:bg-sky-50 tw:text-sky-600". */
  accent: string;
  /** Second line under the title — a count, a status, a hint. */
  subtitle?: string;
  actions?: DetailCardAction[];
  className?: string;
  children: React.ReactNode;
}

/**
 * The shell every store-detail card shares in theme-2 — icon, title, the
 * actions that edit it, and whatever the card reads out underneath.
 */
const DetailCard: React.FC<DetailCardProps> = ({
  title,
  icon: Icon,
  accent,
  subtitle,
  actions = [],
  className = "",
  children,
}) => (
  <div
    className={clsx(
      "tw:flex tw:h-full tw:flex-col tw:rounded-2xl tw:border tw:border-gray-200 tw:bg-white tw:p-5 tw:transition-all hover:tw:shadow-xs",
      className,
    )}
  >
    {/* Title and actions share a wrapping row — once the buttons no longer fit
        beside the title they drop to their own right-aligned line instead of
        squeezing the heading down to an ellipsis. */}
    <div className="tw:flex tw:flex-wrap tw:items-start tw:justify-between tw:gap-x-3 tw:gap-y-2.5">
      <div className="tw:flex tw:min-w-0 tw:flex-1 tw:basis-44 tw:items-start tw:gap-3">
        <span
          className={clsx(
            "tw:flex tw:size-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl",
            accent,
          )}
        >
          <Icon className="tw:h-5 tw:w-5" />
        </span>
        <div className="tw:min-w-0">
          <h3
            title={title}
            className="tw:truncate tw:text-base tw:font-bold tw:tracking-tight tw:text-gray-900"
          >
            {title}
          </h3>
          {subtitle && (
            <p
              title={subtitle}
              className="tw:mt-0.5 tw:line-clamp-2 tw:text-xs tw:text-gray-500"
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {actions.length > 0 && (
        <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-end tw:gap-1.5 tw:ms-auto">
          {actions.map((action) => {
            const ActionIcon = action.icon;
            return (
              <button
                key={action.key}
                type="button"
                onClick={action.onClick}
                title={action.label}
                className={clsx(
                  "tw:inline-flex tw:shrink-0 tw:cursor-pointer tw:items-center tw:gap-1.5 tw:rounded-lg tw:px-2.5 tw:py-1.5 tw:text-xs tw:font-bold tw:whitespace-nowrap tw:transition-colors",
                  action.primary
                    ? "tw:bg-primary tw:text-white tw:hover:bg-primary/90"
                    : "tw:border tw:border-gray-300 tw:bg-white tw:text-gray-700 tw:hover:bg-gray-50",
                )}
              >
                <ActionIcon className="tw:h-3.5 tw:w-3.5" />
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>

    <div className="tw:mt-4 tw:flex tw:flex-1 tw:flex-col">{children}</div>
  </div>
);

interface DetailRowsProps {
  rows: DetailValue[];
  /** One column instead of the default two — for narrow cards. */
  single?: boolean;
}

/**
 * The label/value grid the detail cards read out. Labels on the left, values
 * on the right with responsive styling and equal height flex alignment.
 */
export const DetailRows: React.FC<DetailRowsProps> = ({ rows, single }) => (
  <div className="tw:flex tw:h-full tw:flex-1 tw:flex-col tw:justify-between tw:gap-2 tw:rounded-xl tw:border tw:border-gray-100 tw:bg-gray-50/70 tw:p-4">
    {rows.map((row) => {
      const isMuted =
        row.value === "—" ||
        row.value === "Not set" ||
        row.value === "None set" ||
        row.value === "Unregistered" ||
        row.value === "Off";
      const isPositive =
        row.value === "Registered" ||
        row.value === "On" ||
        row.value === "Approved" ||
        row.value === "Active";

      return (
        <div
          key={row.key}
          className="tw:flex tw:items-start tw:justify-between tw:gap-3"
        >
          <span className="tw:shrink-0 tw:text-xs tw:text-gray-500">
            {row.label}
          </span>
          <span
            className={clsx(
              "tw:min-w-0 tw:text-right tw:text-xs tw:break-words",
              isMuted
                ? "tw:font-normal tw:text-gray-400"
                : isPositive
                  ? "tw:font-semibold tw:text-emerald-600"
                  : "tw:font-semibold tw:text-gray-900",
            )}
          >
            {row.value}
          </span>
        </div>
      );
    })}
  </div>
);

export default DetailCard;
