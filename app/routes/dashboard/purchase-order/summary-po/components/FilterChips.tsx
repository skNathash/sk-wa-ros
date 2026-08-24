import { SlidersHorizontal } from "lucide-react";
import { useCallback } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import FilterChip from "~/components/core/filter-chip/FilterChip";
import FilterChipGroup from "~/components/core/filter-chip/FilterChipGroup";
import { filterChips, getActiveChip } from "../helper";

/**
 * Quick-filter pill row for the PO summary page. The three source chips are a
 * shortcut for the `purchasedFrom` (type) filter; "Arriving Today" filters by
 * expected-delivery-date instead. Chips are single-select: picking one sets the
 * relevant form value and clears the other axis so exactly one reads as active.
 */
const FilterChips = ({ callback }: { callback: (data: any) => void }) => {
  const { t } = useTranslation(["common"]);
  const { control, setValue, getValues } = useFormContext();

  // Watch both axes so the active chip stays in sync with the modal / URL.
  const purchasedFrom = useWatch({ control, name: "purchasedFrom" });
  const arrivingToday = useWatch({ control, name: "arrivingToday" });

  const activeChip = getActiveChip({ purchasedFrom, arrivingToday });

  const handleSelect = useCallback(
    (value: string) => {
      if (value === "arrivingToday") {
        setValue("arrivingToday", true);
        setValue("purchasedFrom", "All");
      } else if (value === "all") {
        setValue("arrivingToday", false);
        setValue("purchasedFrom", "All");
      } else {
        setValue("arrivingToday", false);
        setValue("purchasedFrom", value);
      }
      callback({ formData: getValues() });
    },
    [setValue, getValues, callback]
  );

  return (
    <FilterChipGroup
      className="tw:mb-3"
      // Lead affordance: marks this row as a filter set, not a second tab bar.
      label={<SlidersHorizontal aria-hidden size={15} />}
    >
      {filterChips.map((chip) => (
        <FilterChip
          key={chip.value}
          active={activeChip === chip.value}
          onClick={() => handleSelect(chip.value)}
        >
          {t(chip.langKey, chip.label)}
        </FilterChip>
      ))}
    </FilterChipGroup>
  );
};

export default FilterChips;
