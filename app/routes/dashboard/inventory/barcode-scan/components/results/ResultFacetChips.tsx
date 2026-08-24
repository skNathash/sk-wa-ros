import FilterChip from "~/components/core/filter-chip/FilterChip";
import FilterChipGroup from "~/components/core/filter-chip/FilterChipGroup";

import type { ResultFacetOption, ResultFacetValue } from "./helper";

interface Props {
  brands: ResultFacetOption[];
  categories: ResultFacetOption[];
  value: ResultFacetValue;
  onChange: (value: ResultFacetValue) => void;
}

const ChipRow: React.FC<{
  label: string;
  options: ResultFacetOption[];
  selected: string | null;
  onSelect: (name: string | null) => void;
}> = ({ label, options, selected, onSelect }) => {
  if (options.length < 2) return null;

  return (
    <FilterChipGroup label={label}>
      {options.map((opt) => {
        const active = selected === opt.name;
        return (
          <FilterChip
            key={opt.name}
            active={active}
            count={opt.count}
            onClick={() => onSelect(active ? null : opt.name)}
          >
            {opt.name}
          </FilterChip>
        );
      })}
    </FilterChipGroup>
  );
};

/**
 * Brand and category narrowing for the results table, sitting under the source
 * chips. A dimension with a single value adds nothing to filter by, so its row
 * stays hidden.
 */
const ResultFacetChips: React.FC<Props> = ({
  brands,
  categories,
  value,
  onChange,
}) => {
  if (brands.length < 2 && categories.length < 2) return null;

  return (
    <div className="tw:flex tw:flex-col tw:gap-1.5 tw:border-b tw:border-gray-100 tw:bg-gray-50 tw:px-3 tw:py-2">
      <ChipRow
        label="Brand"
        options={brands}
        selected={value.brand}
        onSelect={(brand) => onChange({ ...value, brand })}
      />
      <ChipRow
        label="Category"
        options={categories}
        selected={value.category}
        onSelect={(category) => onChange({ ...value, category })}
      />
    </div>
  );
};

export default ResultFacetChips;
