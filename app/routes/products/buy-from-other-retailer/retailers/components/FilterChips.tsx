import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import FilterChip from "~/components/core/filter-chip/FilterChip";
import FilterChipGroup from "~/components/core/filter-chip/FilterChipGroup";
import AppPopover from "~/components/core/popover/AppPopover";
import { Button } from "~/components/ui/button";

export type RetailersFilterParam =
  | "skSeller"
  | "skRetailer"
  | "hasPaylater"
  | "connected";

interface FilterChipsProps {
  /** Currently highlighted sort/preset chip key (`az` | `topSellers`). */
  activeSort: string;
  /** Applied name sort, when set via the Sort dropdown. */
  sort: { key: string; value: "asc" | "desc" } | null;
  /** Boolean chip toggles driven by URL search params. */
  filters: {
    skSeller: boolean;
    skRetailer: boolean;
    hasPaylater: boolean;
    connected: boolean;
  };
  onSortSelect: (key: string, value: "asc" | "desc") => void;
  onTopSellersSelect: () => void;
  onActiveSortChange: (key: string) => void;
  onToggleFilter: (key: RetailersFilterParam) => void;
  className?: string;
}

const sortChips = [
  { key: "az", label: "A–Z" },
  { key: "topSellers", label: "Top seller" },
];

/** Sort key the API expects for the seller rating average. */
const RATING_SORT_KEY = "ratingsSummary.avgRating";

/**
 * Quick-filter chip row for the Discover Sellers list: sort dropdown + preset
 * chips, plus Connected / SK Seller / SK Retailer / Paylater toggles.
 */
const FilterChips = ({
  activeSort,
  sort,
  filters,
  onSortSelect,
  onTopSellersSelect,
  onActiveSortChange,
  onToggleFilter,
  className,
}: FilterChipsProps) => {
  const [popoverOpen, setPopoverOpen] = useState(false);

  // No explicit sort → the API's own ordering, which is nearest-first.
  const sortLabel =
    sort?.key === "name"
      ? sort.value === "asc"
        ? "Name A–Z"
        : "Name Z–A"
      : sort?.key === RATING_SORT_KEY
        ? "Top rated"
        : "Nearest";

  const handleSortSelect = (key: string, value: "asc" | "desc") => {
    onSortSelect(key, value);
    setPopoverOpen(false);
  };

  return (
    <div className={className}>
      <FilterChipGroup>
        <AppPopover
          triggerContent={
            <span>
              <FilterChip
                active={activeSort === "az"}
                prefix="Sort:"
                leadingIcon={<SlidersHorizontal />}
                trailingIcon={<ChevronDown />}
              >
                {sortLabel}
              </FilterChip>
            </span>
          }
          contentClassName="tw:w-48"
          open={popoverOpen}
          onOpenChange={setPopoverOpen}
        >
          <div className="tw:space-y-1">
            <div className="tw:px-2 tw:pt-1 tw:pb-2">
              <span className="tw:text-xs tw:font-semibold tw:text-gray-500 tw:uppercase tw:tracking-wider">
                Sort by
              </span>
            </div>
            <Button
              size="sm"
              variant={
                activeSort === "az" && !sort?.key ? "secondary" : "ghost"
              }
              className="tw:w-full tw:justify-start"
              onClick={() => handleSortSelect("nearest", "asc")}
            >
              Nearest
            </Button>
            <Button
              size="sm"
              variant={
                sort?.key === "name" && sort?.value === "asc"
                  ? "secondary"
                  : "ghost"
              }
              className="tw:w-full tw:justify-start"
              onClick={() => handleSortSelect("name", "asc")}
            >
              Name A–Z
            </Button>
            <Button
              size="sm"
              variant={
                sort?.key === "name" && sort?.value === "desc"
                  ? "secondary"
                  : "ghost"
              }
              className="tw:w-full tw:justify-start"
              onClick={() => handleSortSelect("name", "desc")}
            >
              Name Z–A
            </Button>
            <Button
              size="sm"
              variant={sort?.key === RATING_SORT_KEY ? "secondary" : "ghost"}
              className="tw:w-full tw:justify-start"
              onClick={() => handleSortSelect(RATING_SORT_KEY, "desc")}
            >
              Top rated
            </Button>
          </div>
        </AppPopover>

        {sortChips
          .filter((c) => c.key !== "az")
          .map((chip) => (
            <FilterChip
              key={chip.key}
              active={activeSort === chip.key}
              onClick={() => {
                if (chip.key === "topSellers") {
                  onTopSellersSelect();
                } else {
                  onActiveSortChange(chip.key);
                }
              }}
            >
              {chip.label}
            </FilterChip>
          ))}

        <FilterChip
          active={filters.connected}
          onClick={() => onToggleFilter("connected")}
        >
          Connected
        </FilterChip>
        <FilterChip
          active={filters.skSeller}
          onClick={() => onToggleFilter("skSeller")}
        >
          SK Seller
        </FilterChip>
        <FilterChip
          active={filters.skRetailer}
          onClick={() => onToggleFilter("skRetailer")}
        >
          SK Retailer
        </FilterChip>
        <FilterChip
          active={filters.hasPaylater}
          onClick={() => onToggleFilter("hasPaylater")}
        >
          Paylater Avail
        </FilterChip>
      </FilterChipGroup>
    </div>
  );
};

export default FilterChips;
