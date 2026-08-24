import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import TintTile from "~/components/core/tint/TintTile";
import type { PaginationState } from "~/types/CommonTypes";
import Filter from "../Filter";
import {
  defaultPagination,
  defaultTrendFilters,
  getData,
  prepareParams,
  type TrendDeal,
  type TrendFilterFormFields,
} from "./helper";

/** The search term a set of form values fetches on, normalised for comparison. */
const searchTermOf = (values: Record<string, any>) =>
  (values?.search || "").trim();

export interface DealListProps {
  /** Pricing channel the listed prices are read on. */
  type: "network" | "customer";
  /** Deal currently charted on the right — highlighted in the list. */
  selectedId?: string;
  /**
   * Fires on selection ("select") and once the first page lands ("loaded"),
   * so the host can chart a deal without owning the list's fetching.
   */
  callback?: (payload: { action: "select" | "loaded"; data?: TrendDeal }) => void;
  /**
   * Renders the picker's own search block. Turned off on mobile, where the
   * host lifts the search box into the sticky command bar instead — the same
   * place the price sheet and the electronics screen keep theirs.
   */
  showFilter?: boolean;
  /** Search term to fetch on while {@link showFilter} is off. */
  search?: string;
  className?: string;
}

/**
 * Deal picker of the Trend watch screen — the middle column that lists the
 * SKUs a price trend can be charted for.
 *
 * The component owns everything about the list: the filter form (handed to
 * {@link Filter} through a `FormProvider`), the price-comparison fetching,
 * pagination and the current selection. The host only says which channel is
 * being priced and reacts to the picked deal.
 */
const DealList = ({
  type,
  selectedId,
  callback,
  showFilter = true,
  search,
  className = "",
}: DealListProps) => {
  const formMethods = useForm<TrendFilterFormFields>({
    defaultValues: { ...defaultTrendFilters, type },
  });

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [data, setData] = useState<TrendDeal[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);

  const paginationRef = useRef<PaginationState>({ ...defaultPagination });

  // Every fetch is stamped with the filter generation it belongs to. A response
  // from an older generation (the unfiltered first page, a `loadMore` fired
  // before the search landed) is dropped instead of overwriting the current
  // list — otherwise a slow earlier request repaints the filtered rows with
  // the whole catalogue.
  const requestIdRef = useRef(0);

  // Rows currently loaded, tracked outside state so `loadMore` can decide
  // whether another page exists without reading a stale `data`.
  const loadedCountRef = useRef(0);

  // Ids already listed. The endpoint clamps a page past the last one back to
  // the first, so a page can come back as rows the list already carries —
  // those are dropped instead of duplicated.
  const loadedIdsRef = useRef<Set<string>>(new Set());

  // Search term the rows on screen were fetched with. The form is written on
  // every keystroke while the fetch behind it is debounced, so the form alone
  // cannot say what the current list belongs to — paging compares against this
  // instead, otherwise a page fetched with a term the list has not been
  // reloaded for yet gets appended to the old, unfiltered rows.
  const [appliedSearch, setAppliedSearch] = useState("");
  const appliedSearchRef = useRef("");

  // Live term in the box — watched (not just read on submit) so the picker
  // re-renders on the keystroke rather than 500ms later when the debounced
  // fetch lands.
  const typedSearch = useWatch({
    control: formMethods.control,
    name: "search",
  });

  // True between the keystroke and the fetch it triggers. Paging is shut down
  // for that window: the endpoint clamps an out-of-range page back to the
  // first one, so a page-2 request made mid-typing comes back looking like a
  // first page of the new term and would be appended to the rows of the old.
  const searchPending =
    (showFilter ? (typedSearch || "").trim() : (search || "").trim()) !==
    appliedSearch;

  // Selecting the first row is a load-time side effect, so it must not make
  // `applyFilter` depend on the current selection (that would refetch on every
  // click). The ref carries it instead.
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  const applyFilter = useCallback(async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };

    const requestId = ++requestIdRef.current;
    const values = formMethods.getValues();
    appliedSearchRef.current = searchTermOf(values);
    setAppliedSearch(appliedSearchRef.current);

    setLoading(true);
    setData([]);
    setTotalRecords(0);
    setHasMoreData(false);
    loadedCountRef.current = 0;
    loadedIdsRef.current = new Set();

    try {
      const params = prepareParams(values, paginationRef.current);
      const { rows, total } = await getData(params, type);

      // Only the newest generation may paint — an earlier fetch that outran
      // its generation would otherwise repaint the filtered rows.
      if (requestId !== requestIdRef.current) return;

      loadedIdsRef.current = new Set(rows.map((row) => row._id));
      loadedCountRef.current = rows.length;
      setData(rows);
      setTotalRecords(total);
      paginationRef.current.totalRecords = total;
      setHasMoreData(rows.length > 0 && rows.length < total);

      // Nothing is charted until a deal is picked — open on the first row.
      const first = rows[0];
      if (first && !selectedIdRef.current) {
        callback?.({ action: "loaded", data: first });
      }
    } catch (error) {
      console.error("Error loading trend deals:", error);
      if (requestId !== requestIdRef.current) return;
      setData([]);
      setTotalRecords(0);
      setHasMoreData(false);
      loadedCountRef.current = 0;
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [type, callback, formMethods]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;

    const values = formMethods.getValues();

    // The box already carries a term this list has not been reloaded for — the
    // debounced `applyFilter` behind it is about to fetch page 1 of it. Paging
    // now would append those filtered rows to the rows still on screen, which
    // is how a search made after scrolling ended up listing the whole
    // catalogue with the filtered SKUs tacked on the end.
    if (searchTermOf(values) !== appliedSearchRef.current) return;

    const requestId = requestIdRef.current;
    const nextPage = paginationRef.current.activePage + 1;

    setLoadingMore(true);
    try {
      const params = prepareParams(values, {
        ...paginationRef.current,
        activePage: nextPage,
      });
      const { rows, total } = await getData(params, type);

      // The filter moved on while this page was in flight — its rows belong to
      // a list that is no longer on screen. The pagination cursor is only
      // advanced here, so a dropped page leaves it where the visible list is.
      if (requestId !== requestIdRef.current) return;
      if (searchTermOf(values) !== appliedSearchRef.current) return;

      // Rows the list already carries mean the endpoint handed back a page it
      // had clamped — there is nothing past what is on screen.
      const fresh = rows.filter((row) => !loadedIdsRef.current.has(row._id));
      if (fresh.length === 0) {
        setHasMoreData(false);
        return;
      }

      setTotalRecords(total);
      paginationRef.current = {
        ...paginationRef.current,
        activePage: nextPage,
        totalRecords: total,
      };

      fresh.forEach((row) => loadedIdsRef.current.add(row._id));
      loadedCountRef.current += fresh.length;
      setData((prev) => [...prev, ...fresh]);
      setHasMoreData(fresh.length > 0 && loadedCountRef.current < total);
    } catch (error) {
      console.error("Error loading more trend deals:", error);
    } finally {
      // Always cleared — a superseded page must not leave the picker stuck in
      // its "loading more" state.
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, type, formMethods]);

  useEffect(() => {
    formMethods.setValue("type", type);
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  // Search box lifted into the command bar: the term arrives as a prop, so it
  // is written to the form the fetching already reads from and refetched here.
  // The host's box is debounced, so this fires no more often than the local one.
  useEffect(() => {
    if (showFilter) return;

    // Nothing new to fetch — notably on mount, where the `type` effect already
    // loads the first page.
    if ((formMethods.getValues("search") || "") === (search || "")) return;

    formMethods.setValue("search", search || "");
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, showFilter]);

  const handleFilterChange = useCallback(() => {
    applyFilter();
  }, [applyFilter]);

  return (
    <div className={clsx("tw:flex tw:flex-col", className)}>
      {showFilter && (
        <div className="tw:border-b tw:border-slate-100 tw:p-3">
          <p className="tw:mb-2 tw:text-[11px] tw:font-semibold tw:tracking-wide tw:text-slate-400 tw:uppercase">
            Trend for
          </p>

          <FormProvider {...formMethods}>
            <Filter callback={handleFilterChange} />
          </FormProvider>
        </div>
      )}

      {/* Count line — reports the rows actually listed. */}
      <div className="tw:bg-slate-50 tw:px-3 tw:py-2 tw:text-[11px] tw:font-semibold tw:tracking-wide tw:text-slate-500 tw:uppercase">
        {loading ? "Loading…" : `${totalRecords || data.length} SKUs`}
      </div>

      <div className="tw:min-h-0 tw:flex-1 tw:overflow-y-auto">
        {loading ? (
          <div className="tw:divide-y tw:divide-slate-100">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="tw:animate-pulse tw:p-3">
                <div className="tw:h-3.5 tw:w-2/3 tw:rounded tw:bg-slate-200" />
                <div className="tw:mt-2 tw:h-3 tw:w-1/3 tw:rounded tw:bg-slate-100" />
              </div>
            ))}
          </div>
        ) : data.length === 0 ? (
          <NoData />
        ) : (
          <>
            <div className="tw:divide-y tw:divide-slate-100">
              {data.map((deal) => {
                const isActive = deal._id === selectedId;
                return (
                  <button
                    key={deal._id}
                    type="button"
                    onClick={() => callback?.({ action: "select", data: deal })}
                    aria-current={isActive ? "true" : undefined}
                    className={clsx(
                      "tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-3 tw:px-3 tw:py-2.5 tw:text-left tw:transition-colors",
                      isActive
                        ? "tw:bg-emerald-50"
                        : "tw:bg-white tw:hover:bg-slate-50",
                    )}
                  >
                    <TintTile
                      index={deal.tintIndex}
                      className="tw:size-8 tw:shrink-0 tw:rounded-full tw:text-[10px] tw:font-bold"
                    >
                      {deal.initials}
                    </TintTile>

                    <span className="tw:min-w-0 tw:flex-1">
                      <span className="tw:flex tw:items-center tw:gap-1.5">
                        <span className="tw:truncate tw:text-sm tw:font-semibold tw:text-slate-900">
                          {deal.name}
                        </span>
                        {deal.isElectronics && (
                          <span className="tw:shrink-0 tw:rounded tw:bg-amber-100 tw:px-1 tw:text-[9px] tw:font-bold tw:tracking-wide tw:text-amber-700 tw:uppercase">
                            Elec
                          </span>
                        )}
                      </span>
                      <span className="tw:mt-0.5 tw:block tw:truncate tw:text-xs tw:text-slate-500">
                        {deal.subLabel}
                      </span>
                    </span>

                    {/* Below md the row opens the detail sheet rather than a
                        column beside the list — the chevron says so. */}
                    <ChevronRight
                      size={16}
                      className="tw:shrink-0 tw:text-slate-300 tw:md:hidden"
                    />
                  </button>
                );
              })}
            </div>

            {/* Paging stands down while a typed term is still waiting for its
                fetch — the sentinel is unmounted rather than merely ignored,
                so the infinite scroll cannot request a page that belongs to a
                list about to be replaced. */}
            {hasMoreData && !searchPending && (
              <LoadMoreButton
                loadMore={loadMore}
                loading={loadingMore}
                totalCount={totalRecords}
                loadedCount={data.length}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DealList;
