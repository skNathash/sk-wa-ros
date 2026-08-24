import PaneChips from "~/shared/navigation/pane-chips/PaneChips";
import {
  RUNNER_CHIPS,
  type RunnerChipKey,
  type RunnerCounts,
} from "./helper";

interface RunnerPaneChipsProps {
  activeKey: RunnerChipKey;
  counts: RunnerCounts;
  onSelect: (key: RunnerChipKey) => void;
  className?: string;
}

/** All / Online / Pending KYC strip, each chip carrying its live count. */
export default function RunnerPaneChips({
  activeKey,
  counts,
  onSelect,
  className,
}: RunnerPaneChipsProps) {
  return (
    <PaneChips
      className={className}
      data={RUNNER_CHIPS.map((chip) => ({
        ...chip,
        count: counts[chip.key],
        active: chip.key === activeKey,
      }))}
      callback={({ data }) => onSelect(data.key as RunnerChipKey)}
    />
  );
}
