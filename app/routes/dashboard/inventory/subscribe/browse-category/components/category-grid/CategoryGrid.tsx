import { debounce } from "lodash";
import { SearchIcon, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import Alpha from "~/components/core/alpha/Alpha";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import { Skeleton } from "~/components/ui/skeleton";
import MenuChips from "~/shared/inventory/components/menu-chip/MenuChips";
import type { MenuItem } from "~/shared/inventory/components/menu-chip/types";
import type { PaginationState } from "~/types/CommonTypes";
import { getCount, getData, prepareParams } from "../category/helper";
import CategoryBlock from "./CategoryBlock";

const defaultPagination: PaginationState = {
  activePage: 1,
  rowsPerPage: 10,
  totalRecords: 0,
  startSlNo: 1,
  endSlNo: 10,
};

/**
 * Resolve the effective alpha filter from the URL: an explicit `alpha` param
 * wins; otherwise default to "" ("All").
 */
const resolveAlpha = (alphaParam: string | null) => alphaParam ?? "";

/**
 * Accordion wall. One full-width category row per line at every width: the grid
 * now lives one level down, inside the expanded panel, where the category's
 * deals are laid out as product tiles (<CategoryDeals>). Columning the
 * categories too would squeeze that product grid into a third of the page.
 */
const gridClassName = "tw:flex tw:flex-col tw:gap-2 tw:lg:gap-3";

/**
 * Theme-2 accordion view of subscribable categories. Renders one expandable row
 * per category (thumb + name + deal/brand counts); expanding previews the
 * category's top subscribable deals via <CategoryBlock>/<CategoryDeals>. Mirrors
 * the inventory browse-by-category accordion (`browse-category/index.tsx`) but
 * sourced from the subscribe category feed. The legacy swiper flow remains as
 * the non-theme-2 fallback in the parent `index.tsx`.
 *
 * Search and A–Z selections are written to the URL query string; a
 * `searchParams` effect is the single trigger for (re)fetching, so the filter
 * state stays shareable/back-navigable and there is one source of truth.
 */
const CategoryGrid: React.FC = () => {
  const { t } = useTranslation(["inventorySubscribe", "common"]);
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  // Local mirror of the search box for immediate typing feedback; the URL is
  // updated (debounced) and remains the source of truth for fetching.
  const [search, setSearch] = useState(searchParams.get("search") || "");

  const filterRef = useRef<Record<string, any>>({ sortType: "popular" });
  const paginationRef = useRef<PaginationState>({ ...defaultPagination });

  const selectedAlpha = resolveAlpha(searchParams.get("alpha"));
  const selectedMenuId = searchParams.get("menuId") || "";

  const applyFilter = useCallback(async () => {
    setLoading(true);
    setItems([]);
    paginationRef.current = { ...paginationRef.current, activePage: 1 };
    const params = prepareParams(filterRef.current, paginationRef.current);
    const count = await getCount(params);
    paginationRef.current = { ...paginationRef.current, totalRecords: count };
    const result = await getData(params);
    setItems(result.data);
    setHasMore(result.data.length < count);
    setLoading(false);
  }, []);

  // Single fetch trigger: react to the search/alpha query params changing.
  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    const alpha = resolveAlpha(searchParams.get("alpha"));
    const menuId = searchParams.get("menuId") || "";

    filterRef.current = {
      ...filterRef.current,
      search: urlSearch,
      alpha,
      menuId,
    };
    setSearch(urlSearch);
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: paginationRef.current.activePage + 1,
    };
    const params = prepareParams(filterRef.current, paginationRef.current);
    const result = await getData(params);
    setItems((prev) => [...prev, ...result.data]);
    setHasMore(result.data.length >= paginationRef.current.rowsPerPage);
    setLoadingMore(false);
  }, [hasMore, loadingMore]);

  // Merge filter changes into the URL, preserving unrelated params (tab, etc.).
  const updateParams = useCallback(
    (next: Record<string, string>) => {
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          Object.entries(next).forEach(([key, value]) => {
            if (value) p.set(key, value);
            else p.delete(key);
          });
          return p;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const debouncedWrite = useMemo(
    () =>
      debounce((value: string) => {
        // Typing clears the active letter.
        updateParams({ search: value, alpha: "" });
      }, 500),
    [updateParams],
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    debouncedWrite(e.target.value);
  };

  const handleClearSearch = () => {
    debouncedWrite.cancel();
    setSearch("");
    updateParams({ search: "", alpha: "" });
  };

  const handleAlphaSelect = (alpha: string) => {
    // Selecting a letter clears any active search term.
    setSearch("");
    updateParams({ alpha, search: "" });
  };

  const handleMenuSelect = (menu: MenuItem | null) => {
    updateParams({ menuId: menu?._id || "" });
  };

  return (
    <div>
      {/* Search + A–Z filter. */}
      <div className="catalog-search-sticky catalog-search-flush tw:mb-1.5 tw:space-y-2">
        <div className="tw:relative">
          <SearchIcon
            size={16}
            className="tw:pointer-events-none tw:absolute tw:left-3 tw:top-1/2 tw:-translate-y-1/2 tw:text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            aria-label={t("common:searchByCategoryName")}
            placeholder={t("common:searchByCategoryName")}
            className="tw:w-full tw:rounded-lg tw:border tw:border-slate-200 tw:bg-white tw:py-2 tw:pl-9 tw:pr-9 tw:text-sm tw:text-slate-900 tw:placeholder:text-slate-400 tw:outline-none tw:transition-colors tw:focus:border-[color:var(--primary)] tw:focus:ring-2 tw:focus:ring-[color-mix(in_srgb,var(--primary)_14%,transparent)]"
          />
          {search && (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label={t("common:clear", { defaultValue: "Clear" })}
              className="tw:absolute tw:right-1.5 tw:top-1/2 tw:flex tw:h-7 tw:w-7 tw:-translate-y-1/2 tw:items-center tw:justify-center tw:rounded-full tw:text-slate-400 tw:transition-colors tw:hover:bg-slate-100 tw:hover:text-slate-600 tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-[color-mix(in_srgb,var(--primary)_35%,transparent)]"
            >
              <X size={15} />
            </button>
          )}
        </div>
        <Alpha
          selected={selectedAlpha}
          callback={handleAlphaSelect}
          className="tw:w-full"
        />
      </div>

      {/* Menu filter strip. */}
      <MenuChips
        source="subscribe"
        entity="category"
        selectedMenuId={selectedMenuId}
        onSelect={handleMenuSelect}
        className="tw:mb-3"
      />

      {/* Section header — "CATEGORIES · N". */}
      <div className="tw:mb-3 tw:flex tw:items-center tw:justify-between tw:px-0.5">
        <div className="tw:text-xs tw:font-semibold tw:tracking-wide tw:text-gray-500 tw:uppercase">
          {t("common:categories", { defaultValue: "Categories" })}
          {paginationRef.current.totalRecords ? (
            <span className="tw:text-gray-400">
              {" · "}
              {paginationRef.current.totalRecords}
            </span>
          ) : null}
        </div>
        {/* <span className="tw:text-xs tw:font-medium tw:text-gray-400">A–Z</span> */}
      </div>

      {loading ? (
        <div className={gridClassName}>
          {Array.from({ length: paginationRef.current.rowsPerPage }).map(
            (_, idx) => (
              <Skeleton
                key={`s-${idx}`}
                className="tw:h-16 tw:w-full tw:rounded-xl"
              />
            ),
          )}
        </div>
      ) : (
        <>
          {!items.length && <NoData />}

          <div className={gridClassName}>
            {items.map((item, idx) => (
              <CategoryBlock
                key={`${item._id}-${idx}`}
                category={item}
                defaultExpanded={idx === 0}
              />
            ))}
          </div>

          {hasMore && items.length > 0 && (
            <div className="tw:flex tw:justify-center tw:mt-4">
              <LoadMoreButton
                loadMore={loadMore}
                loading={loadingMore}
                totalCount={paginationRef.current.totalRecords}
                loadedCount={items.length}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CategoryGrid;
