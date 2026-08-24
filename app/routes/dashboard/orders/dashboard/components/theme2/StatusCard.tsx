import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppSpinner from "~/components/core/Spinner/AppSpinner";

/**
 * Theme-2 stage card (Pending / Process / Completed) — the "fulfilment funnel"
 * pattern from the Analytics design: a tinted stage icon, one measured row per
 * figure with a proportional bar, the money line on its own plate, and the
 * card's actions on the bottom rule.
 *
 * Purely presentational — every figure and action is passed in by the card
 * that owns the fetch, so the data on show is unchanged from theme-1.
 */
export type StatusStat = {
  label: string;
  value: number;
  /** Bar colour for this row. */
  barClass: string;
};

export type StatusAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  color?: "primary" | "secondary";
};

type Props = {
  title: string;
  icon: React.ReactNode;
  /** Tint of the rounded icon plate beside the title. */
  iconWrapClass?: string;
  stats: StatusStat[];
  totalLabel: string;
  totalValue: number;
  actions: StatusAction[];
  loading?: boolean;
};

const StatusCard: React.FC<Props> = ({
  title,
  icon,
  iconWrapClass = "tw:bg-teal-50 tw:text-teal-700",
  stats,
  totalLabel,
  totalValue,
  actions,
  loading = false,
}) => {
  // Bars are proportional to the card's own figures, so an empty stage simply
  // shows the empty track rather than a misleading full bar.
  const statTotal = stats.reduce((sum, stat) => sum + (stat.value || 0), 0);
  const rows = stats.map((stat) => ({
    ...stat,
    width: `${statTotal ? ((stat.value || 0) / statTotal) * 100 : 0}%`,
  }));

  return (
    <div className="tw:flex tw:flex-col tw:rounded-2xl tw:border tw:border-gray-200 tw:bg-white tw:p-4">
      <div className="tw:flex tw:items-center tw:gap-2.5">
        <span
          className={`tw:flex tw:h-8 tw:w-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl ${iconWrapClass} [&>svg]:tw:h-4 [&>svg]:tw:w-4`}
        >
          {icon}
        </span>
        <span className="tw:truncate tw:text-sm tw:font-semibold tw:text-gray-900">
          {title}
        </span>
      </div>

      <div className="tw:mt-3.5 tw:space-y-2.5">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="tw:flex tw:items-baseline tw:justify-between tw:gap-2">
              <span className="tw:truncate tw:text-xs tw:text-gray-600">
                {row.label}
              </span>
              <span className="tw:text-base tw:font-bold tw:leading-none tw:text-gray-900 app-amount">
                {loading ? <AppSpinner size="sm" /> : row.value}
              </span>
            </div>
            <div className="tw:mt-1.5 tw:h-1.5 tw:overflow-hidden tw:rounded-full tw:bg-gray-100">
              <span
                className={`tw:block tw:h-full tw:rounded-full ${row.barClass}`}
                style={{ width: loading ? "0%" : row.width }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="tw:mt-3 tw:flex tw:items-center tw:justify-between tw:gap-2 tw:rounded-xl tw:bg-gray-50 tw:px-3 tw:py-2">
        <span className="tw:font-mono tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-gray-500">
          {totalLabel}
        </span>
        <span className="tw:text-sm tw:font-semibold tw:text-gray-900">
          {loading ? <AppSpinner size="sm" /> : <Amount value={totalValue} />}
        </span>
      </div>

      <div className="tw:mt-3 tw:flex tw:flex-wrap tw:justify-end tw:gap-2 tw:border-t tw:border-gray-100 tw:pt-3">
        {actions.map((action) => (
          <AppButton
            key={action.label}
            onClick={action.onClick}
            color={action.color || "primary"}
            size="small"
            disabled={action.disabled}
          >
            {action.label}
          </AppButton>
        ))}
      </div>
    </div>
  );
};

export default StatusCard;
