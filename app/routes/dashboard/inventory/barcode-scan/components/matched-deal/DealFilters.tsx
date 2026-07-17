import { useMemo } from "react";
import type { SwiperOptions } from "swiper/types";

import AppSwiper from "~/components/core/swiper/AppSwiper";

import type { MatchedDealData } from "./MatchedDeal";

// Stable identity: AppSwiper re-inits (and resets scroll) whenever `config`
// changes by reference, so this must not be re-created on every render.
const SWIPER_CONFIG: SwiperOptions = {
  slidesPerView: "auto",
  spaceBetween: 6,
  freeMode: true,
};

export interface DealFilterValue {
  brand: string | null;
  category: string | null;
}

interface Props {
  deals: MatchedDealData[];
  value: DealFilterValue;
  onChange: (value: DealFilterValue) => void;
}

interface Option {
  id: string;
  name: string;
  count: number;
}

/** Collect unique, named options for a given key, keyed by id (falling back to name), with counts. */
const collectOptions = (
  deals: MatchedDealData[],
  pick: (deal: MatchedDealData) => { id?: string; name?: string } | undefined,
): Option[] => {
  const map = new Map<string, Option>();
  for (const deal of deals) {
    const node = pick(deal);
    const name = node?.name?.trim();
    if (!name) continue;
    const id = node?.id || name;
    const existing = map.get(id);
    if (existing) existing.count += 1;
    else map.set(id, { id, name, count: 1 });
  }
  return Array.from(map.values());
};

const ChipFilter: React.FC<{
  label: string;
  options: Option[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}> = ({ label, options, selected, onSelect }) => {
  if (options.length < 1) return null;

  const renderChip = (
    key: string,
    text: string,
    count: number,
    active: boolean,
    onClick: () => void,
  ) => (
    <AppSwiper.Slide key={key} isAutoWidth>
      <button
        type="button"
        onClick={onClick}
        className={`tw:cursor-pointer tw:whitespace-nowrap tw:rounded-full tw:border tw:px-2.5 tw:py-1 tw:text-[11px] tw:font-semibold tw:transition-colors ${
          active
            ? "tw:border-blue-600 tw:bg-blue-600 tw:text-white"
            : "tw:border-gray-200 tw:bg-white tw:text-gray-700 hover:tw:bg-gray-50"
        }`}
      >
        {text}
        <span
          className={`tw:ml-1 tw:text-[10px] ${active ? "tw:text-blue-100" : "tw:text-gray-400"}`}
        >
          {count}
        </span>
      </button>
    </AppSwiper.Slide>
  );

  return (
    <div className="tw:flex tw:items-center tw:gap-2 tw:min-w-0">
      <span className="tw:w-14 tw:shrink-0 tw:text-[11px] tw:font-semibold tw:text-gray-500">
        {label}
      </span>
      <div className="tw:flex-1 tw:min-w-0">
        <AppSwiper config={SWIPER_CONFIG}>
          {options.map((opt) => {
            const active = selected === opt.id;
            return renderChip(opt.id, opt.name, opt.count, active, () =>
              onSelect(active ? null : opt.id),
            );
          })}
        </AppSwiper>
      </div>
    </div>
  );
};

const DealFilters: React.FC<Props> = ({ deals, value, onChange }) => {
  const brands = useMemo(() => collectOptions(deals, (d) => d.brand), [deals]);
  const categories = useMemo(
    () => collectOptions(deals, (d) => d.category),
    [deals],
  );

  // Nothing to show if neither dimension has any named option.
  if (brands.length < 1 && categories.length < 1) return null;

  return (
    <div className="tw:flex tw:flex-col tw:gap-1.5 tw:px-3 tw:py-2 tw:bg-gray-50 tw:border-b tw:border-gray-100">
      <ChipFilter
        label="Brand"
        options={brands}
        selected={value.brand}
        onSelect={(brand) => onChange({ ...value, brand })}
      />
      <ChipFilter
        label="Category"
        options={categories}
        selected={value.category}
        onSelect={(category) => onChange({ ...value, category })}
      />
    </div>
  );
};

/** Match a deal against a filter value. Exported for reuse by the consuming view. */
export const matchesDealFilter = (
  deal: MatchedDealData,
  value: DealFilterValue,
): boolean => {
  if (value.brand) {
    const brandKey = deal.brand?.id || deal.brand?.name;
    if (brandKey !== value.brand) return false;
  }
  if (value.category) {
    const categoryKey = deal.category?.id || deal.category?.name;
    if (categoryKey !== value.category) return false;
  }
  return true;
};

export default DealFilters;
