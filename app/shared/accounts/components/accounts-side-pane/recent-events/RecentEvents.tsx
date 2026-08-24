import { useCallback, useEffect, useRef, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import FilterChip from "~/components/core/filter-chip/FilterChip";
import FilterChipGroup from "~/components/core/filter-chip/FilterChipGroup";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import { Skeleton } from "~/components/ui/skeleton";
import useAppNav from "~/hooks/useAppNav";
import useAccountsDateRange from "~/shared/accounts/hooks/useAccountsDateRange";
import type { PaginationState } from "~/types/CommonTypes";
import {
  amountClass,
  directionChips,
  getCount,
  getData,
  prepareParams,
  toneBadgeClass,
  type EventDirection,
  type RecentEventRow,
} from "./helper";

interface RecentEventsProps {
  /** Page size for the list and for each load-more step. */
  limit?: number;
  /**
   * Locks the list to one direction — the chips are dropped, since the block is
   * then part of a page that is already about that direction.
   */
  direction?: Exclude<EventDirection, "all">;
}

const RecentEventSkeleton = () => (
  <div className="tw:flex tw:w-full tw:items-center tw:gap-3 tw:border-b tw:border-gray-100 tw:px-4 tw:py-3 tw:last:border-b-0">
    <Skeleton className="tw:h-10 tw:w-10 tw:shrink-0 tw:rounded-full" />
    <div className="tw:min-w-0 tw:flex-1">
      <Skeleton className="tw:mb-1.5 tw:h-3.5 tw:w-3/5" />
      <Skeleton className="tw:h-2.5 tw:w-2/5" />
    </div>
    <div className="tw:shrink-0 tw:text-right">
      <Skeleton className="tw:mb-1.5 tw:ml-auto tw:h-2.5 tw:w-12" />
      <Skeleton className="tw:ml-auto tw:h-3.5 tw:w-16" />
    </div>
  </div>
);

/**
 * Recent events block for the accounts side pane — the last money movements
 * across the store, newest first, with a direction filter. Tapping a row opens
 * the party behind the event.
 *
 * Paginated: a chip refetches from page 1, load-more appends the next page.
 */
const RecentEvents = ({
  limit = 24,
  direction: lockedDirection,
}: RecentEventsProps) => {
  const appNav = useAppNav();
  const range = useAccountsDateRange();

  const [rows, setRows] = useState<RecentEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [direction, setDirection] = useState<EventDirection>(
    lockedDirection || "all",
  );

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: limit,
    startSlNo: 1,
    endSlNo: limit,
    totalRecords: 0,
  });
  const filterRef = useRef<Record<string, any>>({
    ...range,
    direction: lockedDirection || "all",
  });

  const applyFilter = useCallback(async () => {
    setLoading(true);
    setRows([]);
    paginationRef.current = {
      ...paginationRef.current,
      rowsPerPage: limit,
      activePage: 1,
      startSlNo: 1,
      endSlNo: limit,
    };
    filterRef.current.startDate = range.startDate;
    filterRef.current.endDate = range.endDate;
    if (lockedDirection) filterRef.current.direction = lockedDirection;

    try {
      const params = prepareParams(filterRef.current, paginationRef.current);
      const result = await getData(params);
      setRows(result || []);
      paginationRef.current.totalRecords = await getCount(params);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
    } catch (error) {
      setRows([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, [range, limit, lockedDirection]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(filterRef.current, paginationRef.current);
      const result = await getData(params);
      setRows((prev) => [...prev, ...(result || [])]);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
    } catch (error) {
      setHasMoreData(false);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  const handleChipClick = (chip: EventDirection) => {
    setDirection(chip);
    filterRef.current = { ...filterRef.current, direction: chip };
    applyFilter();
  };

  useEffect(() => {
    applyFilter();
  }, [applyFilter]);

  return (
    <div>
      <div className="tw:mb-2 tw:px-1">
        <p className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500">
          {lockedDirection === "out"
            ? "Recent payments"
            : lockedDirection === "in"
              ? "Recent collections"
              : "Recent events"}
        </p>
      </div>

      {/* Dropped when the block is locked to one direction — the only chip left
          would be the one already in force. */}
      {!lockedDirection && (
        <FilterChipGroup className="tw:mb-2 tw:px-1">
          {directionChips.map((chip) => (
            <FilterChip
              key={chip.key}
              active={chip.key === direction}
              onClick={() => handleChipClick(chip.key)}
            >
              {chip.label}
            </FilterChip>
          ))}
        </FilterChipGroup>
      )}

      {/* `app-bleed-x` runs the list edge to edge in the pane — no card, the
          rows sit straight on the pane surface. */}
      {/* No `tw:w-full` here — `app-bleed-x` needs `width:auto` so its negative
          side margins pull the list to the pane edges instead of pushing it
          2rem past them. `no-table` forces Radix's viewport inner div back to
          a block display so `tw:truncate` works, and setting max-height on the
          viewport prevents content from overflowing the scroll area. */}
      <AppScrollArea className="app-bleed-x no-table tw:max-h-96 tw:bg-white tw:[&_[data-slot=scroll-area-viewport]]:max-h-96">
        <div className="tw:w-full">
          {loading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <RecentEventSkeleton key={`recent-event-skel-${idx}`} />
            ))
          ) : rows.length === 0 ? (
            <p className="tw:py-8 tw:text-center tw:text-xs tw:text-gray-400">
              No events in this period.
            </p>
          ) : (
            <>
              {rows.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => appNav.to(row.link)}
                  disabled={row.link === "#"}
                  className="tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-3 tw:border-b tw:border-gray-100 tw:px-4 tw:py-3 tw:text-left tw:transition-colors tw:last:border-b-0 tw:hover:bg-slate-50 tw:disabled:cursor-default tw:disabled:hover:bg-white"
                >
                  <span
                    className={`tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-[11px] tw:font-bold tw:text-white ${toneBadgeClass[row.tone]}`}
                  >
                    {row.code}
                  </span>

                  <div className="tw:min-w-0 tw:flex-1">
                    <div className="tw:truncate tw:text-sm tw:font-bold tw:text-slate-800">
                      {row.reference}
                    </div>
                    <div className="tw:truncate tw:text-[11px] tw:text-gray-500">
                      {row.meta}
                    </div>
                  </div>

                  <div className="tw:shrink-0 tw:text-right">
                    <div className="tw:text-[10px] tw:text-gray-400">
                      {row.when}
                    </div>
                    <div
                      className={`tw:text-sm tw:font-bold ${amountClass(row.direction)}`}
                    >
                      {row.sign}
                      <Amount value={row.amount} decimalPlaces={0} />
                    </div>
                  </div>
                </button>
              ))}

              {hasMoreData && (
                <div className="tw:pb-4">
                  <LoadMoreButton
                    loaderType="infinite-scroll"
                    loadMore={loadMore}
                    loading={loadingMore}
                    totalCount={
                      paginationRef.current.totalRecords > rows.length
                        ? paginationRef.current.totalRecords
                        : rows.length + 1
                    }
                    loadedCount={rows.length}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </AppScrollArea>
    </div>
  );
};

export default RecentEvents;
