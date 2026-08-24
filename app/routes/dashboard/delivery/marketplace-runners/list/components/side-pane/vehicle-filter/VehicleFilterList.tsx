import clsx from "clsx";
import { VEHICLE_OPTIONS, type VehicleOption } from "./helper";

interface VehicleFilterListProps {
  /** `key` of the picked vehicle row. */
  activeKey: string;
  /** How many nearby runners each row holds, keyed by the option's `key`. */
  counts: Record<string, number>;
  /** Fired with the tapped row; the pane writes it into the URL. */
  onSelect: (option: VehicleOption) => void;
  className?: string;
}

/**
 * Vehicle rail — every vehicle working around the store with how many runners
 * are free on it. Picking one narrows the marketplace beside the pane.
 */
export default function VehicleFilterList({
  activeKey,
  counts,
  onSelect,
  className,
}: VehicleFilterListProps) {
  return (
    <div className={className}>
      <p className="app-pane-label">
        Vehicle
      </p>

      <div className="tw:mt-1.5 tw:flex tw:flex-col tw:gap-1.5">
        {VEHICLE_OPTIONS.map((option) => {
          const active = option.key === activeKey;
          const Icon = option.icon;

          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onSelect(option)}
              aria-current={active ? "true" : undefined}
              className={clsx(
                "tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-2.5 tw:rounded-lg tw:border tw:px-2.5 tw:py-1.5 tw:text-left tw:transition-colors",
                active
                  ? "tw:border-emerald-500 tw:bg-emerald-50"
                  : "tw:border-transparent tw:bg-slate-50 tw:hover:bg-slate-100",
              )}
            >
              <span
                className={clsx(
                  "tw:flex tw:size-7 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-white",
                  active ? "tw:text-emerald-600" : "tw:text-slate-500",
                )}
              >
                <Icon size={14} />
              </span>

              <span className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-sm tw:font-semibold tw:text-slate-800">
                {option.label}
              </span>

              <span className="tw:shrink-0 tw:text-xs tw:tabular-nums tw:text-slate-500">
                {counts[option.key]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
