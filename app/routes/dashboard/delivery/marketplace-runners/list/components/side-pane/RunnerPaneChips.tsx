import PaneChips from "~/shared/navigation/pane-chips/PaneChips";
import {
  RUNNER_VIEWS,
  type RunnerPaneCounts,
  type RunnerViewKey,
} from "./helper";

interface RunnerPaneChipsProps {
  activeKey: RunnerViewKey;
  counts: RunnerPaneCounts;
  /** Fired with the tapped view; the pane writes it into the URL. */
  onSelect: (key: RunnerViewKey) => void;
  className?: string;
}

/**
 * Now / Top rated / Cheapest / Nearest — how the marketplace beside the pane
 * is ranked. "Now" and "Top rated" carry how many runners they hold; the two
 * price and distance orderings are the whole set, so they go without a badge.
 */
export default function RunnerPaneChips({
  activeKey,
  counts,
  onSelect,
  className,
}: RunnerPaneChipsProps) {
  const chipCounts: Record<RunnerViewKey, number> = {
    now: counts.available,
    "top-rated": counts.topRated,
    cheapest: 0,
    nearest: 0,
  };

  return (
    <PaneChips
      className={className}
      data={RUNNER_VIEWS.map((view) => ({
        ...view,
        count: chipCounts[view.key],
        active: view.key === activeKey,
      }))}
      callback={({ data }) => onSelect(data.key as RunnerViewKey)}
    />
  );
}
