import RunnerListItem from "./RunnerListItem";
import type { PaneRunner } from "./helper";

interface MyRunnersListProps {
  runners: PaneRunner[];
  /** `_id` of the runner the pane has picked, if any. */
  activeId?: string;
  onSelect: (runner: PaneRunner) => void;
  className?: string;
}

/** The registered roster — every runner the store can hand a drop to today. */
export default function MyRunnersList({
  runners,
  activeId,
  onSelect,
  className,
}: MyRunnersListProps) {
  return (
    <div className={className}>
      <p className="app-pane-label">
        My runners
      </p>

      {runners.length === 0 ? (
        <p className="tw:px-1 tw:py-3 tw:text-xs tw:text-slate-400">
          No runner matches this filter.
        </p>
      ) : (
        <div className="tw:mt-1.5 tw:flex tw:flex-col">
          {runners.map((runner) => (
            <RunnerListItem
              key={runner._id}
              runner={runner}
              active={runner._id === activeId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
