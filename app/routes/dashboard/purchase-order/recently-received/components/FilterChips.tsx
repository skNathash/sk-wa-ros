import { SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import FilterChip from "~/components/core/filter-chip/FilterChip";
import FilterChipGroup from "~/components/core/filter-chip/FilterChipGroup";
import type { TabItem } from "~/types/CommonTypes";

interface FilterChipsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tab: TabItem) => void;
  className?: string;
}

/**
 * Grouping pills for the received feed — By Box / By Product / By Vendor.
 * Replaces the old AppTab bar: single-select, and reads as a filter row rather
 * than a second tab bar under the PO section tabs.
 */
const FilterChips = ({
  tabs,
  activeTab,
  onChange,
  className,
}: FilterChipsProps) => {
  const { t } = useTranslation(["common"]);

  return (
    <FilterChipGroup
      className={className}
      // Lead affordance: marks this row as a filter set, not a tab bar.
      label={<SlidersHorizontal aria-hidden size={15} />}
    >
      {tabs.map((tab) => (
        <FilterChip
          key={tab.key}
          active={activeTab === tab.key}
          onClick={() => onChange(tab)}
        >
          {tab.langKey ? t(tab.langKey) : tab.name}
        </FilterChip>
      ))}
    </FilterChipGroup>
  );
};

export default FilterChips;
