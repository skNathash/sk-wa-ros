import clsx from "clsx";
import { Layers, Library, SearchX, Sparkles, Store } from "lucide-react";

import FilterChip from "~/components/core/filter-chip/FilterChip";
import FilterChipGroup from "~/components/core/filter-chip/FilterChipGroup";

import type { ReviewItem } from "../../helper";

/** Source bucket a review row falls into — "all" is the unfiltered view and
 *  "mine" cuts across the others. Mirrors the single-scan results chips. */
export type ReviewFilter = "all" | "sk" | "ai" | "notFound" | "mine";

export interface ReviewChip {
  key: ReviewFilter;
  label: string;
  count: number;
}

/** Rows still being resolved carry no source yet, so they only sit under "All". */
export const matchesReviewFilter = (
  item: ReviewItem,
  filter: ReviewFilter,
): boolean => {
  if (filter === "all") return true;
  if (filter === "mine") return !!item.deal?.isSubscribed;
  if (filter === "sk") return item.matchStatus === "FoundInSk";
  if (filter === "ai") return item.matchStatus === "FoundInAi";
  return item.matchStatus === "NotFound";
};

/** Chip list with live counts — always the full set, so the row never jumps. */
export const getReviewChips = (items: ReviewItem[]): ReviewChip[] => [
  { key: "all", label: "All Items", count: items.length },
  {
    key: "sk",
    label: "SK Library",
    count: items.filter((i) => matchesReviewFilter(i, "sk")).length,
  },
  {
    key: "ai",
    label: "SK AI",
    count: items.filter((i) => matchesReviewFilter(i, "ai")).length,
  },
  {
    key: "notFound",
    label: "Not found",
    count: items.filter((i) => matchesReviewFilter(i, "notFound")).length,
  },
  {
    key: "mine",
    label: "My Items",
    count: items.filter((i) => matchesReviewFilter(i, "mine")).length,
  },
];

const ICONS: Record<
  ReviewFilter,
  React.ComponentType<{ className?: string }>
> = {
  all: Layers,
  sk: Library,
  ai: Sparkles,
  notFound: SearchX,
  mine: Store,
};

interface Props {
  chips: ReviewChip[];
  value: ReviewFilter;
  onChange: (value: ReviewFilter) => void;
  className?: string;
}

/**
 * Source filter for the review list — All Items / SK Library / SK AI / Not
 * found / My Items, each with its live count. Empty buckets stay visible but
 * are disabled, so the row reads as a fixed set of tabs. The selected chip
 * takes FilterChip's own primary fill, matching every other chip row.
 */
const ReviewFilterChips: React.FC<Props> = ({
  chips,
  value,
  onChange,
  className,
}) => (
  <FilterChipGroup className={clsx("tw:px-3 tw:py-2", className)}>
    {chips.map((chip) => {
      const Icon = ICONS[chip.key];
      return (
        <FilterChip
          key={chip.key}
          active={value === chip.key}
          disabled={chip.count === 0 && chip.key !== "all"}
          leadingIcon={<Icon />}
          count={chip.count}
          onClick={() => onChange(chip.key)}
        >
          {chip.label}
        </FilterChip>
      );
    })}
  </FilterChipGroup>
);

export default ReviewFilterChips;
