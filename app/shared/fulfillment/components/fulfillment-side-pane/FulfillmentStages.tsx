import clsx from "clsx";
import {
  FULFILLMENT_STAGE_TONES,
  FULFILLMENT_STAGES,
  type FulfillmentStageCounts,
} from "./helper";

interface FulfillmentStagesProps {
  /** Stage key currently open in the main pane — reads as selected. */
  activeKey?: string;
  /** Counts keyed by stage key, resolved by the page. */
  counts?: FulfillmentStageCounts;
  loading?: boolean;
  onSelect: (key: string) => void;
  className?: string;
}

/**
 * The fulfilment pipeline as a vertical list — one tinted row per stage with
 * its short label, a hint at where the work physically happens, and how many
 * orders are waiting there. Tapping a row switches the page to that stage.
 */
const FulfillmentStages = ({
  activeKey,
  counts,
  loading = false,
  onSelect,
  className,
}: FulfillmentStagesProps) => {
  if (loading) {
    return (
      <div className={clsx("tw:flex tw:flex-col tw:gap-2", className)}>
        {FULFILLMENT_STAGES.map((stage) => (
          <div
            key={`stage-skeleton-${stage.key}`}
            className="skeleton-loader tw:h-14 tw:rounded-xl"
          />
        ))}
      </div>
    );
  }

  return (
    <div className={clsx("tw:flex tw:flex-col tw:gap-2", className)}>
      {FULFILLMENT_STAGES.map((stage) => {
        const tone = FULFILLMENT_STAGE_TONES[stage.tone];
        const active = stage.key === activeKey;
        return (
          <button
            key={stage.key}
            type="button"
            onClick={() => onSelect(stage.key)}
            aria-current={active ? "true" : undefined}
            className={clsx(
              "tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:justify-between tw:gap-3 tw:rounded-xl tw:px-3 tw:py-2.5 tw:text-left tw:transition-colors",
              tone.row,
              active && "tw:ring-2 tw:ring-slate-900/15",
            )}
          >
            <span className="tw:min-w-0">
              <span
                className={clsx(
                  "tw:block tw:truncate tw:text-sm tw:font-bold tw:tracking-wide",
                  tone.label,
                )}
              >
                {stage.paneLabel}
              </span>
              <span className="tw:block tw:truncate tw:text-xs tw:text-slate-500">
                {stage.hint}
              </span>
            </span>
            <span
              className={clsx(
                "app-amount tw:shrink-0 tw:text-lg tw:font-bold tw:tabular-nums",
                tone.count,
              )}
            >
              {counts?.[stage.key] || 0}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default FulfillmentStages;
