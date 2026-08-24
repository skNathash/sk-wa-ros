import clsx from "clsx";
import FilterChip from "~/components/core/filter-chip/FilterChip";
import FilterChipGroup from "~/components/core/filter-chip/FilterChipGroup";

export type PricingFilterChipKey =
  | "all"
  | "unpriced"
  | "low-margin"
  | "out-of-stock"
  | "new";

const CHIPS: { key: PricingFilterChipKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unpriced", label: "Unpriced" },
  { key: "low-margin", label: "Low margin" },
  { key: "out-of-stock", label: "Out of stock" },
  { key: "new", label: "New" },
];

interface PricingFilterChipsProps {
  active: PricingFilterChipKey;
  onSelect: (key: PricingFilterChipKey) => void;
  className?: string;
}

/**
 * Mobile-only pricing quick-filter strip (All · Unpriced · Low margin · Out of stock · New).
 * Tapping a chip updates the URL `pricingFilter` query param, which the parent
 * feeds back into `prepareFilters` and the list's client-side filters.
 */
const PricingFilterChips = ({
  active,
  onSelect,
  className,
}: PricingFilterChipsProps) => {
  return (
    <FilterChipGroup className={clsx("tw:mt-2", className)}>
      {CHIPS.map((chip) => (
        <FilterChip
          key={chip.key}
          active={active === chip.key}
          onClick={() => onSelect(chip.key)}
          // Same grey resting fill as the channel tabs above, so the two rows
          // read as one filter block instead of two competing outlines.
          className={
            active === chip.key
              ? undefined
              : "tw:border-transparent tw:bg-gray-100 tw:text-gray-700 tw:hover:bg-gray-200"
          }
        >
          {chip.label}
        </FilterChip>
      ))}
    </FilterChipGroup>
  );
};

export default PricingFilterChips;
