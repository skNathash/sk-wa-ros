import clsx from "clsx";
import { Star } from "lucide-react";
import { InitialsAvatar } from "~/shared/network/components/directory-bits/DirectoryBits";
import { PRESENCE_THEME, type PaneRunner } from "./helper";

interface RunnerListItemProps {
  runner: PaneRunner;
  /** Marks the row as the pane's current pick. */
  active?: boolean;
  /** Fired with the tapped runner so the pane decides what a tap opens. */
  onSelect: (runner: PaneRunner) => void;
}

/**
 * One runner on the roster — who they are and what they ride on the left,
 * whether they are working and how much they have carried on the right.
 */
export default function RunnerListItem({
  runner,
  active,
  onSelect,
}: RunnerListItemProps) {
  const presence = PRESENCE_THEME[runner._presence];

  return (
    <button
      type="button"
      onClick={() => onSelect(runner)}
      aria-current={active ? "true" : undefined}
      className={clsx(
        "tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-3 tw:border-b tw:border-slate-100 tw:px-1 tw:py-3 tw:text-left tw:transition-colors",
        active ? "tw:bg-slate-50" : "tw:hover:bg-slate-50",
      )}
    >
      <InitialsAvatar
        initials={runner._initials}
        name={runner.name}
        size={40}
      />

      <div className="tw:min-w-0 tw:flex-1">
        <div className="tw:flex tw:items-center tw:gap-2">
          <h3 className="tw:truncate tw:text-sm tw:font-bold tw:text-slate-900">
            {runner.name}
          </h3>

          {runner.isPrimary && (
            <span className="tw:shrink-0 tw:rounded tw:bg-slate-100 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wider tw:text-slate-500">
              Primary
            </span>
          )}
        </div>

        <p className="tw:mt-0.5 tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-slate-500">
          <span className="tw:truncate">{runner._vehicleLbl}</span>
          <span className="tw:text-slate-300">·</span>
          <Star size={11} className="tw:fill-amber-400 tw:text-amber-400" />
          <span className="tw:font-semibold tw:text-slate-700">
            {runner._ratingLbl}
          </span>
        </p>
      </div>

      <div className="tw:shrink-0 tw:text-right">
        <span
          className={clsx(
            "tw:inline-block tw:rounded tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wider",
            presence.className,
          )}
        >
          {presence.label}
        </span>
        <p className="tw:mt-1 tw:text-xs tw:tabular-nums tw:text-slate-500">
          {runner.totalDeliveries} deliv
        </p>
      </div>
    </button>
  );
}
