import debounce from "lodash/debounce";
import { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import Alpha from "~/components/core/alpha/Alpha";
import FilterChip from "~/components/core/filter-chip/FilterChip";
import FilterChipGroup from "~/components/core/filter-chip/FilterChipGroup";
import { AppInput } from "~/components/core/form";

/**
 * Brand search + A–Z strip + "purchased before" quick filter for the
 * Vendors-by-brand view. Reads/writes the page's form context; `callback`
 * re-runs the list fetch.
 */

const purchasedChips = [
  { key: "all", label: "All brands" },
  { key: "purchased", label: "Purchased before" },
];

const Filter = ({ callback }: { callback: () => void }) => {
  const { register, control, setValue } = useFormContext();

  const purchased = useWatch({ control, name: "purchased" });
  const alpha = useWatch({ control, name: "alpha" });

  // Debounced so typing doesn't fire a request per keystroke.
  const debouncedSearch = useMemo(
    () => debounce(() => callback(), 500),
    [callback],
  );

  const handlePurchasedChange = (key: string) => {
    if (key === purchased) return;
    setValue("purchased", key);
    callback();
  };

  const handleAlphaChange = (value: string) => {
    if (value === alpha) return;
    setValue("alpha", value);
    callback();
  };

  return (
    <div className="tw:flex tw:flex-col tw:gap-2 tw:mb-3">
      <AppInput
        name="search"
        placeholder="Search by brand or vendor name"
        register={register}
        onChange={debouncedSearch}
        size="sm"
      />

      {/* A–Z strip narrows the brand groups by first letter. */}
      <Alpha
        selected={alpha || ""}
        callback={handleAlphaChange}
        className="tw:[&_span]:my-0"
      />

      <FilterChipGroup>
        {purchasedChips.map((chip) => (
          <FilterChip
            key={chip.key}
            active={purchased === chip.key}
            onClick={() => handlePurchasedChange(chip.key)}
          >
            {chip.label}
          </FilterChip>
        ))}
      </FilterChipGroup>
    </div>
  );
};

export default Filter;
