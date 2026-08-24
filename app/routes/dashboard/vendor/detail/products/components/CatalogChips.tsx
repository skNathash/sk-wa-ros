import { useState } from "react";
import FilterChip from "~/components/core/filter-chip/FilterChip";
import FilterChipGroup from "~/components/core/filter-chip/FilterChipGroup";

export type CatalogChipKey = "all" | "reorder" | "low" | "out";

type CatalogChipsProps = {
  className?: string;
  /** Selection is reported back; filtering itself is wired later. */
  callback?: (key: CatalogChipKey) => void;
};

/** Counts are hard-coded until the catalog stats API is available. */
const chips: { key: CatalogChipKey; label: string; count: number }[] = [
  { key: "all", label: "All items", count: 12 },
  { key: "reorder", label: "Reorder now", count: 6 },
  { key: "low", label: "Low stock", count: 5 },
  { key: "out", label: "Out of stock", count: 1 },
];

const CatalogChips = ({ className, callback }: CatalogChipsProps) => {
  const [active, setActive] = useState<CatalogChipKey>("all");

  const onSelect = (key: CatalogChipKey) => {
    setActive(key);
    callback?.(key);
  };

  return (
    <FilterChipGroup className={className}>
      {chips.map((chip) => (
        <FilterChip
          key={chip.key}
          active={active === chip.key}
          count={chip.count}
          onClick={() => onSelect(chip.key)}
        >
          {chip.label}
        </FilterChip>
      ))}
    </FilterChipGroup>
  );
};

export default CatalogChips;
