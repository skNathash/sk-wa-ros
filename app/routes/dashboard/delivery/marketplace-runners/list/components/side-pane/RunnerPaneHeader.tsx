import clsx from "clsx";

interface RunnerPaneHeaderProps {
  /** Runners free to take a drop around the store right now. */
  availableCount: number;
  className?: string;
}

/** Pane heading — the marketplace's name and how much of it is free now. */
export default function RunnerPaneHeader({
  availableCount,
  className,
}: RunnerPaneHeaderProps) {
  return (
    <div
      className={clsx(
        "tw:flex tw:items-baseline tw:justify-between tw:gap-2 tw:px-1",
        className,
      )}
    >
      <h2 className="tw:text-2xl tw:font-bold tw:text-slate-900">
        Marketplace
      </h2>

      <span className="tw:text-xs tw:tabular-nums tw:text-slate-500">
        {availableCount} available now
      </span>
    </div>
  );
}
