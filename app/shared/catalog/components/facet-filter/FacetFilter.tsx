import { useEffect, useRef, useState } from "react";
import type { SwiperOptions } from "swiper/types";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppSwiper from "~/components/core/swiper";
import {
  EMPTY_FACETS,
  getFacets,
  INLINE_BRANDS_COUNT,
  INLINE_CATEGORIES_COUNT,
  type FacetSource,
  type Facets,
} from "./helper";
import FacetFilterModal, {
  type FacetSelection,
} from "./modals/facet-filter/FacetFilterModal";

const EMPTY_SELECTION: FacetSelection = {
  menus: [],
  categories: [],
  brands: [],
};

type Props = {
  /** Search term used to fetch facets. */
  search?: string;
  /**
   * Which catalog endpoint to source facets from. Defaults to "popular"
   * (subscribe search). The inventory products list passes "seller-deal".
   */
  source?: FacetSource;
  /** Distance (in km or "all") to scope network facet results. */
  distance?: number | string;
  /**
   * Seller to scope "seller-deal" facet results to (buy-from-other-retailer
   * catalog). Omitted for the own-inventory products list.
   */
  sellerId?: string;
  /**
   * Currently-applied selection (driven by the parent's URL params). Keeps the
   * internal selection in sync when filters are changed/removed elsewhere
   * (e.g. an AppliedFilters chip), so re-applying via an inline chip doesn't
   * resurrect selections the user already removed.
   */
  selected?: FacetSelection;
  /** Emits the chosen menus/categories/brands once the user applies the modal. */
  callback?: (a: { action: string; data?: FacetSelection }) => void;
};

const FacetFilter = ({
  search = "",
  source = "popular",
  distance,
  sellerId,
  selected,
  callback,
}: Props) => {
  const [facets, setFacets] = useState<Facets>(EMPTY_FACETS);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selection, setSelection] = useState<FacetSelection>(
    selected ?? EMPTY_SELECTION,
  );

  // Mirror the externally-applied selection. The parent memoizes `selected` on
  // the URL params, so this only re-syncs when the applied filters actually
  // change — not on every render.
  useEffect(() => {
    setSelection(selected ?? EMPTY_SELECTION);
  }, [selected]);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();

    if (!search.trim()) {
      setFacets(EMPTY_FACETS);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    // Clear stale facets from the previous search term so the loading state
    // shows instead of the old chips while the new facets are being fetched.
    setFacets(EMPTY_FACETS);
    setLoading(true);
    getFacets(search, source, { distance, sellerId, signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        setFacets(data);
      })
      .catch(() => {
        // abort errors are expected when the search term changes quickly
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [search, source, distance, sellerId]);

  const inlineBrands = facets.brands.slice(0, INLINE_BRANDS_COUNT);
  const inlineCategories = facets.categories.slice(0, INLINE_CATEGORIES_COUNT);
  const hasMenus = facets.menus.length > 0;
  // The modal also holds menus, so expose it from the brands row when present,
  // otherwise from the categories row — never both, to avoid a redundant chip.
  const brandsShowMore =
    facets.brands.length > INLINE_BRANDS_COUNT || hasMenus;
  const categoriesShowMore =
    facets.categories.length > INLINE_CATEGORIES_COUNT ||
    (hasMenus && inlineBrands.length === 0);

  const selectedBrandIds = new Set(selection.brands.map((b) => b.id));
  const selectedCategoryIds = new Set(selection.categories.map((c) => c.id));

  const handleInlineBrandClick = (brandId: string) => {
    setSelection((prev) => {
      const exists = prev.brands.some((b) => b.id === brandId);
      const brands = exists
        ? prev.brands.filter((b) => b.id !== brandId)
        : [...prev.brands, facets.brands.find((b) => b.id === brandId)!].filter(
            Boolean,
          );
      const next = { ...prev, brands };
      callback?.({ action: "apply", data: next });
      return next;
    });
  };

  const handleInlineCategoryClick = (categoryId: string) => {
    setSelection((prev) => {
      const exists = prev.categories.some((c) => c.id === categoryId);
      const categories = exists
        ? prev.categories.filter((c) => c.id !== categoryId)
        : [
            ...prev.categories,
            facets.categories.find((c) => c.id === categoryId)!,
          ].filter(Boolean);
      const next = { ...prev, categories };
      callback?.({ action: "apply", data: next });
      return next;
    });
  };

  const handleModalCallback = (a: { action: string; data?: any }) => {
    if (a.action === "apply" && a.data) {
      setSelection(a.data as FacetSelection);
      callback?.({ action: "apply", data: a.data as FacetSelection });
    }
    setShowModal(false);
  };

  if (!search.trim()) return null;

  if (loading && facets.brands.length === 0) {
    return (
      <div className="tw:flex tw:items-center tw:gap-2 tw:py-2">
        <AppSpinner />
        <span className="tw:text-xs tw:text-gray-500">Loading filters…</span>
      </div>
    );
  }

  if (inlineBrands.length === 0 && inlineCategories.length === 0) return null;

  return (
    <div className="tw:flex tw:flex-col tw:gap-1.5 tw:py-2">
      {inlineBrands.length > 0 && (
        <FacetRow
          label="Brands"
          items={inlineBrands}
          selectedIds={selectedBrandIds}
          onToggle={handleInlineBrandClick}
          showMore={brandsShowMore}
          onMore={() => setShowModal(true)}
        />
      )}

      {inlineCategories.length > 0 && (
        <FacetRow
          label="Category"
          items={inlineCategories}
          selectedIds={selectedCategoryIds}
          onToggle={handleInlineCategoryClick}
          showMore={categoriesShowMore}
          onMore={() => setShowModal(true)}
        />
      )}

      <FacetFilterModal
        show={showModal}
        facets={facets}
        selected={selection}
        callback={handleModalCallback}
      />
    </div>
  );
};

/** A single labelled, horizontally-scrollable row of facet chips. */
const FacetRow = ({
  label,
  items,
  selectedIds,
  onToggle,
  showMore,
  onMore,
}: {
  label: string;
  items: { id: string; name: string }[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  showMore: boolean;
  onMore: () => void;
}) => (
  <div className="tw:flex tw:items-center tw:gap-2">
    <span className="tw:w-[68px] tw:shrink-0 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-400">
      {label}
    </span>
    <AppSwiper config={swiperConfig} className="tw:min-w-0 tw:flex-1">
      {items.map((item) => {
        const isSelected = selectedIds.has(item.id);
        return (
          <AppSwiper.Slide key={item.id} isAutoWidth={true}>
            <button
              type="button"
              onClick={() => onToggle(item.id)}
              className={`tw:cursor-pointer tw:rounded-full tw:border tw:px-3 tw:py-1 tw:text-xs tw:font-medium tw:whitespace-nowrap tw:transition-colors ${
                isSelected
                  ? "tw:border-blue-600 tw:bg-blue-600 tw:text-white"
                  : "tw:border-gray-300 tw:bg-white tw:text-gray-700 tw:hover:border-blue-400"
              }`}
            >
              {item.name}
            </button>
          </AppSwiper.Slide>
        );
      })}

      {showMore && (
        <AppSwiper.Slide isAutoWidth={true} className="tw:flex tw:items-center">
          <button
            type="button"
            onClick={onMore}
            className="tw:cursor-pointer tw:rounded-full tw:border tw:border-dashed tw:border-gray-300 tw:px-3 tw:py-1 tw:text-xs tw:font-medium tw:whitespace-nowrap tw:text-blue-600 tw:hover:border-blue-400"
          >
            More
          </button>
        </AppSwiper.Slide>
      )}
    </AppSwiper>
  </div>
);

const swiperConfig: SwiperOptions = {
  slidesPerView: "auto",
  spaceBetween: 8,
  freeMode: true,
  pagination: false,
  navigation: false,
};

export default FacetFilter;
