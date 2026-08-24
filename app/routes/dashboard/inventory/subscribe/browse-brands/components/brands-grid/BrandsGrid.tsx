import { debounce } from "lodash";
import { SearchIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import Alpha from "~/components/core/alpha/Alpha";
import EntityThumb from "~/components/core/img/EntityThumb";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import { Skeleton } from "~/components/ui/skeleton";
import useAppNav from "~/hooks/useAppNav";
import MenuChips from "~/shared/inventory/components/menu-chip/MenuChips";
import type { MenuItem } from "~/shared/inventory/components/menu-chip/types";
import type { PaginationState } from "~/types/CommonTypes";
import { getCount, getData, prepareParams } from "../brand/helper";

const SEARCH_PATH = "/dashboard/inventory/subscribe/search";

const defaultPagination: PaginationState = {
  activePage: 1,
  rowsPerPage: 24,
  totalRecords: 0,
  startSlNo: 1,
  endSlNo: 24,
};

/**
 * Resolve the effective alpha filter from the URL: an explicit `alpha` param
 * wins; otherwise default to "" ("All").
 */
const resolveAlpha = (alphaParam: string | null) => alphaParam ?? "";

/**
 * Theme-2 card-grid view of subscribable brands. Renders a wall of brand tiles
 * (logo + name + deal count); tapping a tile drills into that brand's products
 * via the shared subscribe `BrowseProducts` list. Mirrors the inventory browse
 * card grid (`inventory/components/brands/Brands.tsx`) but sourced from the
 * subscribe brand feed. The legacy swiper flow remains as the non-theme-2
 * fallback in the parent `index.tsx`.
 *
 * Search and A–Z selections are written to the URL query string; a
 * `searchParams` effect is the single trigger for (re)fetching, so the filter
 * state stays shareable/back-navigable and there is one source of truth.
 */
const BrandsGrid: React.FC = () => {
  const { t } = useTranslation(["inventorySubscribe", "common"]);
  const [searchParams, setSearchParams] = useSearchParams();
  const appNav = useAppNav();

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

    filterRef.current = { ...filterRef.current, search: urlSearch, alpha, menuId };
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
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const debouncedWrite = useMemo(
    () =>
      debounce((value: string) => {
        // Typing clears the active letter; the effect restores "A" when blank.
        updateParams({ search: value, alpha: "" });
      }, 500),
    [updateParams]
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    debouncedWrite(e.target.value);
  };

  const handleAlphaSelect = (alpha: string) => {
    // Selecting a letter clears any active search term.
    setSearch("");
    updateParams({ alpha, search: "" });
  };

  const handleMenuSelect = (menu: MenuItem | null) => {
    updateParams({ menuId: menu?._id || "" });
  };

  // Tapping a brand tile opens the search page pre-filtered to that brand.
  const handleBrandTap = (item: any) => {
    const query = new URLSearchParams({
      tab: "search",
      hideTab: "true",
      brandId: item._id,
      brandName: item.name || item._displayName || "",
    });
    appNav.to(`${SEARCH_PATH}?${query.toString()}`);
  };

  return (
    <div>
      {/* Search + A–Z filter. */}
      <div className="catalog-search-sticky catalog-search-flush tw:mb-1.5 tw:space-y-2">
        <div className="tw:relative">
          <SearchIcon
            size={16}
            className="tw:absolute tw:left-3 tw:top-1/2 tw:-translate-y-1/2 tw:text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder={t("common:searchByBrandName", "Search by brand name")}
            className="tw:w-full tw:rounded-lg tw:border tw:border-slate-200 tw:bg-white tw:py-2 tw:pl-9 tw:pr-3 tw:text-sm tw:outline-none tw:focus:border-slate-300"
          />
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
        entity="brand"
        selectedMenuId={selectedMenuId}
        onSelect={handleMenuSelect}
        className="tw:mb-3"
      />

      {/* Logo-wall header — "BRANDS · N". */}
      <div className="tw:mb-3 tw:flex tw:items-center tw:justify-between tw:px-0.5">
        <div className="tw:text-xs tw:font-semibold tw:tracking-wide tw:text-gray-500 tw:uppercase">
          {t("common:brands")}
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
        <div className="tw:grid tw:grid-cols-3 tw:sm:grid-cols-4 tw:md:grid-cols-6 tw:gap-3">
          {Array.from({ length: paginationRef.current.rowsPerPage }).map(
            (_, idx) => (
              <div
                key={`s-${idx}`}
                className="tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:p-2 tw:shadow-sm"
              >
                <Skeleton className="tw:aspect-square tw:w-full tw:rounded-xl" />
                <Skeleton className="tw:mt-2 tw:h-3 tw:w-3/4 tw:mx-auto" />
                <Skeleton className="tw:mt-1.5 tw:h-2.5 tw:w-1/2 tw:mx-auto" />
              </div>
            )
          )}
        </div>
      ) : (
        <>
          {!items.length && <NoData />}

          <div className="tw:grid tw:grid-cols-3 tw:sm:grid-cols-4 tw:md:grid-cols-6 tw:gap-3">
            {items.map((item, idx) => (
              <button
                key={`${item._id}-${idx}`}
                type="button"
                onClick={() => handleBrandTap(item)}
                className="tw:block tw:text-left tw:cursor-pointer"
              >
                <div className="tw:h-full tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:p-2 tw:text-center tw:shadow-sm tw:transition-shadow tw:hover:shadow-md">
                  <EntityThumb
                    assetId={item._displayImg}
                    name={item._displayName || item.name}
                    size="300"
                    fit="contain"
                    boxClassName="tw:aspect-square tw:w-full tw:rounded-xl tw:bg-white"
                    initialClassName="tw:text-lg"
                  />
                  <div className="tw:mt-2 tw:truncate tw:text-sm tw:font-semibold tw:text-slate-900">
                    {item._displayName || item.name}
                  </div>
                  <div className="tw:mt-0.5 tw:text-xs tw:text-slate-500">
                    {item.totalDeals || 0} {t("common:deals")}
                  </div>
                </div>
              </button>
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

export default BrandsGrid;
