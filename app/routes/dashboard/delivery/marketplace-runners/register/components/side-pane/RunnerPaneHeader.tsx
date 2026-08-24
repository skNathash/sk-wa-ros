import clsx from "clsx";
import type { RunnerCounts } from "./helper";

interface RunnerPaneHeaderProps {
  counts: RunnerCounts;
  className?: string;
}

/** Pane heading — the roster's name and how much of it is working now. */
export default function RunnerPaneHeader({
  counts,
  className,
}: RunnerPaneHeaderProps) {
  return (
    <div
      className={clsx(
        "tw:flex tw:items-baseline tw:justify-between tw:gap-2 tw:px-1",
        className,
      )}
    >
      <h2 className="tw:text-2xl tw:font-bold tw:text-slate-900">Runners</h2>

      <span className="tw:text-xs tw:tabular-nums tw:text-slate-500">
        {counts.all} · {counts.online} online
      </span>
    </div>
  );
}
