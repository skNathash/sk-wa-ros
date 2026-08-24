import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import AppCard from "~/components/core/card/AppCard";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import type { PaginationState, ViewToggleType } from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import Filter from "./components/filter";
import MobileView from "./components/MobileView";
import SummaryCards from "./components/SummaryCards";
import {
  defaultFilter,
  EMPTY_SUMMARY,
  getCount,
  getData,
  getSummary,
  normalizeType,
  prepareParams,
  type PortfolioRow,
  type PortfolioSummary,
  type PortfolioType,
} from "./helper";

const ROWS_PER_PAGE = 10;

/**
 * PayLater portfolio — the outstanding / overdue / recovered book as a list.
 *
 * The URL is the single source of truth: the summary cards and the filter both
 * write into the search params, and the change in `searchParams` is what runs
 * `applyFilter` and refetches the slice.
 */
const Portfolio = () => {
  const { isMobile } = useScreenView();
  const nav = useAppNav();

  const [searchParams, setSearchParams] = useSearchParams();

  // Everything the fetch depends on comes off the URL.
  const type = normalizeType(searchParams.get("type"));
  const search = searchParams.get("search") || "";
  const userType = searchParams.get("userType") || defaultFilter.userType;

  const methods = useForm({
    defaultValues: { ...defaultFilter, search, userType },
  });

  const [data, setData] = useState<PortfolioRow[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const [summary, setSummary] = useState<PortfolioSummary>(EMPTY_SUMMARY);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [viewType, setViewType] = useState<ViewToggleType>("list");

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: ROWS_PER_PAGE,
    startSlNo: 1,
    endSlNo: ROWS_PER_PAGE,
    totalRecords: 0,
  });
  const filterRef = useRef<Record<string, any>>({ ...defaultFilter });

  /** Merge a patch into the URL — empty values drop the param entirely. */
  const patchSearchParams = useCallback(
    (patch: Record<string, string>) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(patch).forEach(([key, value]) => {
        if (value) next.set(key, value);
        else next.delete(key);
      });
      setSearchParams(next, { replace: true, preventScrollReset: true });
    },
    [searchParams, setSearchParams],
  );

  // The cards only move the URL; the effect below does the fetching.
  const handleCardClick = useCallback(
    (nextType: PortfolioType) => {
      if (nextType === type) return;
      patchSearchParams({ type: nextType });
    },
    [patchSearchParams, type],
  );

  // Same for the filter — its callback hands values back, the URL carries them.
  const handleFilterChange = useCallback(
    ({ formData }: { formData: any }) => {
      patchSearchParams({
        search: (formData?.search || "").trim(),
        userType:
          formData?.userType && formData.userType !== "All"
            ? formData.userType
            : "",
      });
    },
    [patchSearchParams],
  );

  /** Fresh fetch of page 1 for the current type + filters. */
  const applyFilter = useCallback(async () => {
    filterRef.current = { search, userType };
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: ROWS_PER_PAGE,
    };

    setLoading(true);
    setData([]);
    setPage(1);

    try {
      const params = prepareParams(filterRef.current, paginationRef.current, type);
      const rows = await getData(params);
      const totalRecords = await getCount(params);

      paginationRef.current.totalRecords = totalRecords;
      setData(rows);
      setCount(totalRecords);
      setHasMore(rows.length < totalRecords && rows.length > 0);
    } catch (e) {
      setData([]);
      setCount(0);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [type, search, userType]);

  const loadMore = useCallback(async () => {
    if (loadingMore || loading || !hasMore) return;

    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: nextPage,
      };
      const params = prepareParams(filterRef.current, paginationRef.current, type);
      const rows = await getData(params);

      setData((prev) => {
        const merged = [...prev, ...rows];
        setHasMore(rows.length > 0 && merged.length < paginationRef.current.totalRecords);
        return merged;
      });
      setPage(nextPage);
    } catch (e) {
      // Keep what is already on screen; the button stays available for a retry.
      paginationRef.current.activePage = page;
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, hasMore, type, page]);

  // Search-param change (card tap or filter) is the single fetch trigger.
  useEffect(() => {
    applyFilter();
  }, [applyFilter]);

  // Keep the form in step when the URL changes from outside the filter.
  useEffect(() => {
    methods.reset({ search, userType });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, userType]);

  // Card totals are book-level — they do not move with the list filters.
  useEffect(() => {
    let mounted = true;

    const loadSummary = async () => {
      setSummaryLoading(true);
      try {
        const result = await getSummary();
        if (mounted) setSummary(result);
      } catch (e) {
        if (mounted) setSummary(EMPTY_SUMMARY);
      } finally {
        if (mounted) setSummaryLoading(false);
      }
    };

    loadSummary();
    return () => {
      mounted = false;
    };
  }, []);

  const handleAction = useCallback(
    ({ action, data: row }: { action: string; data: PortfolioRow }) => {
      if (action === "view" && row.userRedirectionLink) {
        nav.to(row.userRedirectionLink);
      }
    },
    [nav],
  );

  return (
    <div className="tw:md:py-4">
      {/* On mobile the filter sits above the cards — search is the first thing
          reached for on a small screen; desktop keeps the cards on top. */}
      <div className="tw:flex tw:flex-col tw:gap-2 tw:md:gap-4">
        <div className="tw:order-2 tw:md:order-1">
          <SummaryCards
            summary={summary}
            loading={summaryLoading}
            activeType={type}
            callback={handleCardClick}
          />
        </div>

        <FormProvider {...methods}>
          <Filter
            callback={handleFilterChange}
            className="tw:order-1 tw:md:order-2 tw:mb-0"
          />
        </FormProvider>
      </div>

      {/* `app-bleed-x` (theme-2 mobile) pulls the strip out of the page gutter so
          it runs edge to edge, matching the list below it. No-op on desktop. */}
      <AppCard noPadding className="app-bleed-x tw:mt-2 tw:md:mt-4 tw:mb-2">
        <div className="tw:flex tw:justify-between tw:items-center tw:px-4 tw:py-2 tw:md:px-3">
          <PaginationSummary
            paginationConfig={paginationRef.current}
            loadingTotalRecords={loading}
            loadedCount={data.length}
            fwSize="sm"
          />
          <ViewToggle viewType={viewType} callback={setViewType} />
        </div>
      </AppCard>

      {isMobile || viewType === "card" ? (
        <>
          <MobileView
            data={data}
            loading={loading}
            type={type}
            callback={handleAction}
          />
          {hasMore && !loading && (
            <LoadMoreButton
              loadMore={loadMore}
              loading={loadingMore}
              totalCount={count}
              loadedCount={data.length}
            />
          )}
        </>
      ) : (
        <AppCard noPadding>
          <DesktopView
            data={data}
            loading={loading}
            type={type}
            loadMore={loadMore}
            loadingMore={loadingMore}
            totalCount={count}
            loadedCount={data.length}
            hasMoreData={hasMore}
            callback={handleAction}
          />
        </AppCard>
      )}
    </div>
  );
};

export default Portfolio;
