import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpDown,
  Check,
  CheckCircle2,
  PartyPopper,
  ScanLine,
  Store,
} from "lucide-react";

import AppButton from "~/components/core/button/AppButton";
import AppPopover from "~/components/core/popover/AppPopover";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";

import {
  SORT_OPTIONS,
  filterAndSortDeals,
  getBrandOptions,
  getCategoryOptions,
  type SortKey,
} from "../../helper";
import DesktopView from "./DesktopView";
import MobileView from "./MobileView";
import AppCard from "~/components/core/card/AppCard";

interface Props {
  items: any[];
  onScanNext?: () => void;
  onImagePreview?: (
    images: string[],
    initialImageId?: string,
    useProxy?: boolean,
  ) => void;
}

/**
 * skSuggestedDeals from the AI search — products already in the StoreKing
 * catalog. Brand chips and MRP/relevance sorting are pure client-side
 * (lodash orderBy); the filtered list renders via MobileView (card rows)
 * or DesktopView (table), toggled with ViewToggle on desktop. Tapping
 * Subscribe adds the deal to the cart.
 */
const SkSuggestedDeals: React.FC<Props> = ({
  items,
  onScanNext,
  onImagePreview,
}) => {
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("relevance");
  const [sortOpen, setSortOpen] = useState(false);
  const { isMobile } = useScreenView();
  const [view, setView] = useState<"list" | "card">("list");
  const [subscribedCount, setSubscribedCount] = useState(0);
  const appNav = useAppNav();

  const onSubscribed = () => setSubscribedCount((c) => c + 1);

  const brands = useMemo(() => getBrandOptions(items), [items]);
  const categories = useMemo(() => getCategoryOptions(items), [items]);
  const visible = useMemo(
    () =>
      filterAndSortDeals(
        items,
        { brand: activeBrand, category: activeCategory },
        sortKey,
      ),
    [items, activeBrand, activeCategory, sortKey],
  );

  const activeSort =
    SORT_OPTIONS.find((s) => s.key === sortKey) || SORT_OPTIONS[0];

  const clearFilters = () => {
    setActiveBrand(null);
    setActiveCategory(null);
  };

  if (!items.length) return null;

  return (
    <section>
      <div className="tw:flex tw:items-center tw:gap-1.5 tw:mb-2">
        <div className="tw:flex tw:items-center tw:justify-center tw:w-6 tw:h-6 tw:rounded-full tw:bg-emerald-100 tw:shrink-0">
          <Store className="tw:w-3.5 tw:h-3.5 tw:text-emerald-600" />
        </div>
        <h2 className="tw:flex tw:items-center tw:gap-1 tw:text-sm tw:font-bold tw:text-gray-900 tw:leading-none">
          Similar items for the above in the SK catalog
          <PartyPopper className="tw:w-3.5 tw:h-3.5 tw:text-emerald-600" />
        </h2>
        {/* <span className="tw:text-[10px] tw:font-bold tw:text-emerald-700 tw:bg-emerald-50 tw:border tw:border-emerald-200 tw:rounded-full tw:px-2 tw:py-0.5">
          {visible.length} ready to add
        </span> */}
      </div>
      <div className="tw:flex tw:items-start tw:gap-2 tw:mb-3 tw:mt-3">
        {(brands.length > 1 || categories.length > 1) && (
          <div className="tw:flex-1 tw:min-w-0 tw:flex tw:flex-col tw:gap-1.5">
            <ChipFilter
              label="Brand"
              options={brands}
              selected={activeBrand}
              onSelect={setActiveBrand}
            />
            <ChipFilter
              label="Category"
              options={categories}
              selected={activeCategory}
              onSelect={setActiveCategory}
            />
          </div>
        )}

        <div className="tw:flex tw:items-center tw:gap-2 tw:shrink-0 tw:ml-auto">
          <AppPopover
            side="bottom"
            align="end"
            noPadding
            open={sortOpen}
            onOpenChange={setSortOpen}
            contentClassName="tw:w-48"
            triggerContent={
              <button
                type="button"
                className={`tw:cursor-pointer tw:inline-flex tw:items-center tw:gap-1 tw:rounded-full tw:border tw:px-3 tw:py-1.5 tw:text-xs tw:font-semibold tw:shrink-0 ${
                  sortKey !== "relevance"
                    ? "tw:border-blue-600 tw:bg-blue-50 tw:text-blue-700"
                    : "tw:border-gray-200 tw:bg-white tw:text-gray-700 tw:hover:bg-gray-50"
                }`}
              >
                <ArrowUpDown className="tw:w-3 tw:h-3" />
                <span className="tw:hidden tw:md:inline">
                  {activeSort.label}
                </span>
                <span className="tw:md:hidden">Sort</span>
              </button>
            }
          >
            <ul className="tw:py-1">
              {SORT_OPTIONS.map((opt) => {
                const isActive = opt.key === sortKey;
                return (
                  <li key={opt.key}>
                    <button
                      type="button"
                      onClick={() => {
                        setSortKey(opt.key);
                        setSortOpen(false);
                      }}
                      className={`tw:cursor-pointer tw:flex tw:w-full tw:items-center tw:justify-between tw:gap-2 tw:px-3 tw:py-2 tw:text-xs tw:text-left tw:hover:bg-gray-50 ${
                        isActive
                          ? "tw:text-blue-700 tw:font-semibold"
                          : "tw:text-gray-700"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isActive && <Check className="tw:w-3.5 tw:h-3.5" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </AppPopover>

          <ViewToggle viewType={view} callback={setView} showOnlyIcon />
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="tw:text-xs tw:text-gray-500 tw:py-4 tw:text-center">
          No products match this filter. Tap{" "}
          <button
            type="button"
            className="tw:font-semibold tw:text-blue-600 tw:underline tw:cursor-pointer"
            onClick={clearFilters}
          >
            Clear all
          </button>{" "}
          to see everything.
        </div>
      ) : isMobile || view === "card" ? (
        <MobileView
          items={visible}
          activeBrand={activeBrand}
          activeCategory={activeCategory}
          onSelectBrand={setActiveBrand}
          onSelectCategory={setActiveCategory}
          onSubscribed={onSubscribed}
          onImagePreview={onImagePreview}
        />
      ) : (
        <AppCard noPadding>
          <DesktopView
            items={visible}
            activeBrand={activeBrand}
            activeCategory={activeCategory}
            onSelectBrand={setActiveBrand}
            onSelectCategory={setActiveCategory}
            onSubscribed={onSubscribed}
            onImagePreview={onImagePreview}
          />
        </AppCard>
      )}

      {subscribedCount > 0 && (
        <div className="tw:sticky tw:bottom-2 tw:z-30 tw:mt-3">
          <div className="tw:flex tw:flex-col tw:gap-2 tw:rounded-xl tw:border tw:border-emerald-200 tw:bg-emerald-50 tw:px-3 tw:py-2.5 tw:shadow-md tw:sm:flex-row tw:sm:items-center tw:sm:justify-between">
            <div className="tw:flex tw:items-center tw:gap-1.5 tw:min-w-0">
              <CheckCircle2 className="tw:w-4 tw:h-4 tw:text-emerald-600 tw:shrink-0" />
              <span className="tw:text-xs tw:font-semibold tw:text-emerald-800">
                {subscribedCount}{" "}
                {subscribedCount === 1 ? "product" : "products"} added to your
                Subscription Cart
              </span>
            </div>
            <div className="tw:flex tw:gap-2 tw:shrink-0">
              {onScanNext && (
                <AppButton
                  size="small"
                  color="primary"
                  onClick={onScanNext}
                  className="tw:flex-1 tw:font-semibold tw:whitespace-nowrap"
                >
                  <ScanLine className="tw:w-4 tw:h-4 tw:mr-1" />
                  Scan next
                </AppButton>
              )}
              <AppButton
                size="small"
                fill="outline"
                color="primary"
                onClick={() =>
                  appNav.to(
                    "/dashboard/inventory/subscribe/cart?from=barcode-scan",
                  )
                }
                className="tw:flex-1 tw:font-semibold tw:whitespace-nowrap"
              >
                Review cart
                <ArrowRight className="tw:w-4 tw:h-4 tw:ml-1" />
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

/**
 * Labeled chip-swiper filter row (Brand / Category). Chips toggle: tapping the
 * active chip clears the filter. Hidden when there's nothing worth filtering by.
 */
const ChipFilter: React.FC<{
  label: string;
  options: Array<{ name: string; count: number }>;
  selected: string | null;
  onSelect: (name: string | null) => void;
}> = ({ label, options, selected, onSelect }) => {
  if (options.length < 2) return null;

  return (
    <div className="tw:flex tw:items-center tw:gap-2 tw:min-w-0">
      <span className="tw:w-14 tw:shrink-0 tw:text-[11px] tw:font-semibold tw:text-gray-500">
        {label}
      </span>
      <div className="hide-scrollbar tw:flex tw:flex-1 tw:min-w-0 tw:items-center tw:gap-1.5 tw:overflow-x-auto">
        {options.map((opt) => {
          const active = selected === opt.name;
          return (
            <button
              key={opt.name}
              type="button"
              onClick={() => onSelect(active ? null : opt.name)}
              className={`tw:shrink-0 tw:cursor-pointer tw:whitespace-nowrap tw:rounded-full tw:border tw:px-2.5 tw:py-1 tw:text-[11px] tw:font-semibold tw:transition-colors ${
                active
                  ? "tw:border-blue-600 tw:bg-blue-600 tw:text-white"
                  : "tw:border-gray-200 tw:bg-white tw:text-gray-700 hover:tw:bg-gray-50"
              }`}
            >
              {opt.name}
              <span
                className={`tw:ml-1 tw:text-[10px] ${active ? "tw:text-blue-100" : "tw:text-gray-400"}`}
              >
                {opt.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SkSuggestedDeals;
