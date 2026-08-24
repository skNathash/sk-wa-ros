import clsx from "clsx";
import { Layers, Library, Sparkles, Store } from "lucide-react";

import FilterChip from "~/components/core/filter-chip/FilterChip";
import FilterChipGroup from "~/components/core/filter-chip/FilterChipGroup";

import type { ResultChip, ResultFilter } from "./helper";

interface Props {
  chips: ResultChip[];
  value: ResultFilter;
  onChange: (value: ResultFilter) => void;
  className?: string;
}

const ICONS: Record<
  ResultFilter,
  React.ComponentType<{ className?: string }>
> = {
  all: Layers,
  sk: Library,
  ai: Sparkles,
  mine: Store,
};

/**
 * Active chip colours per source, so the table's badges and chips agree. They
 * override FilterChip's primary fill, hence the important modifier.
 */
const ACTIVE_CLASS: Record<ResultFilter, string> = {
  all: "tw:bg-blue-600! tw:text-white!",
  sk: "tw:bg-emerald-600! tw:text-white!",
  ai: "tw:bg-violet-600! tw:text-white!",
  mine: "tw:bg-slate-700! tw:text-white!",
};

/**
 * Source filter for the unified results table — All / SK Library / SK AI /
 * My Items, each with its live count. Empty buckets stay visible but are
 * disabled, so the row of chips reads as a fixed set of tabs.
 */
const ResultFilterChips: React.FC<Props> = ({
  chips,
  value,
  onChange,
  className,
}) => (
  <FilterChipGroup className={clsx("tw:px-3 tw:py-2", className)}>
    {chips.map((chip) => {
      const Icon = ICONS[chip.key];
      const active = value === chip.key;
      return (
        <FilterChip
          key={chip.key}
          active={active}
          disabled={chip.count === 0 && chip.key !== "all"}
          leadingIcon={<Icon />}
          count={chip.count}
          onClick={() => onChange(chip.key)}
          className={active ? ACTIVE_CLASS[chip.key] : undefined}
        >
          {chip.label}
        </FilterChip>
      );
    })}
  </FilterChipGroup>
);

export default ResultFilterChips;
