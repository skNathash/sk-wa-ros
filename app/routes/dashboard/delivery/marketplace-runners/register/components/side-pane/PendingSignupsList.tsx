import PendingSignupItem from "./PendingSignupItem";
import type { PaneRunner } from "./helper";

interface PendingSignupsListProps {
  runners: PaneRunner[];
  onContinue: (runner: PaneRunner) => void;
  className?: string;
}

/**
 * Sign-ups still in the middle of the flow. The section only exists while
 * something is unfinished — an empty roster of these is not worth a heading.
 */
export default function PendingSignupsList({
  runners,
  onContinue,
  className,
}: PendingSignupsListProps) {
  if (runners.length === 0) return null;

  return (
    <div className={className}>
      <p className="app-pane-label">
        Pending sign-ups
      </p>

      <div className="tw:mt-1.5 tw:flex tw:flex-col">
        {runners.map((runner) => (
          <PendingSignupItem
            key={runner._id}
            runner={runner}
            onContinue={onContinue}
          />
        ))}
      </div>
    </div>
  );
}
