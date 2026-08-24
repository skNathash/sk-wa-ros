import clsx from "clsx";
import {
  Bell,
  Coins,
  Receipt,
  Star,
  Unlock,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import FilterChip from "~/components/core/filter-chip/FilterChip";
import FilterChipGroup from "~/components/core/filter-chip/FilterChipGroup";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import CommonService from "~/services/CommonService";
import type { PaginationState } from "~/types/CommonTypes";
import {
  getCount,
  getData,
  prepareParams,
  type TimelineEvent,
  type TimelineFilter,
  type TimelineKind,
} from "./helper";

const chips: TimelineFilter[] = [
  "All",
  "Bills",
  "Coins",
  "Paylater",
  "Notifications",
];

/** Icon + tint per event kind — the dot is the row's whole identity. */
const KIND_STYLE: Record<TimelineKind, { icon: LucideIcon; tone: string }> = {
  bill: { icon: Receipt, tone: "tw:bg-emerald-600" },
  coins: { icon: Coins, tone: "tw:bg-amber-500" },
  paylater: { icon: Unlock, tone: "tw:bg-violet-500" },
  notification: { icon: Bell, tone: "tw:bg-blue-500" },
  offer: { icon: Star, tone: "tw:bg-fuchsia-500" },
};

/**
 * Everything that has happened on this customer, newest first — bills, coin
 * movement, paylater and the nudges the shop has sent. Reads the same
 * `recentEvents` insights endpoint the dashboard timeline uses, scoped to the
 * customer in the route.
 */
const Timeline = () => {
  const { id } = useParams<{ id: string }>();

  const [activeChip, setActiveChip] = useState<TimelineFilter>("All");
  const [data, setData] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const [totalRecords, setTotalRecords] = useState(0);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const filterRef = useRef<Record<string, any>>({ eventFilter: "All" });

  // Guards `loadMore` against the infinite-scroll sentinel firing again while a
  // page is still in flight (and against a page landing after a filter reset).
  const loadingRef = useRef(false);

  const applyFilter = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    loadingRef.current = true;
    setData([]);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    filterRef.current.customerId = id;

    try {
      const params = prepareParams(filterRef.current, paginationRef.current);
      const [result, count] = await Promise.all([
        getData(params),
        getCount(params),
      ]);
      setData(result || []);
      paginationRef.current.totalRecords = count;
      setTotalRecords(count);
      setHasMoreData((result || []).length < count);
    } catch (error) {
      console.error("Customer timeline error:", error);
      setData([]);
      paginationRef.current.totalRecords = 0;
      setTotalRecords(0);
      setHasMoreData(false);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [id]);

  const loadMore = useCallback(async () => {
    // The infinite-scroll sentinel can re-fire while a page is still loading.
    if (loadingRef.current || !hasMoreData) return;
    loadingRef.current = true;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(filterRef.current, paginationRef.current);
      const result = await getData(params);
      // Functional update — `data` in this closure is stale when two pages land
      // back to back.
      setData((prev) => {
        const next = [...prev, ...(result || [])];
        setHasMoreData(
          (result || []).length > 0 &&
            next.length < paginationRef.current.totalRecords,
        );
        return next;
      });
    } catch (error) {
      console.error("Customer timeline load more error:", error);
    } finally {
      setLoadingMore(false);
      loadingRef.current = false;
    }
  }, [hasMoreData]);

  const handleChipClick = (chip: TimelineFilter) => {
    setActiveChip(chip);
    filterRef.current = { ...filterRef.current, eventFilter: chip };
    applyFilter();
  };

  useEffect(() => {
    applyFilter();
  }, [applyFilter]);

  // If the count call fails or answers short, what is on screen is still the
  // truthful floor — never read "2 of 0".
  const shownTotal = Math.max(totalRecords, data.length);

  return (
    <AppCard title="Recent Events" noContentPadding>
      <div className="tw:px-4">
        <FilterChipGroup className="tw:mb-3">
          {chips.map((chip) => (
            <FilterChip
              key={chip}
              active={activeChip === chip}
              onClick={() => handleChipClick(chip)}
            >
              {chip}
            </FilterChip>
          ))}
        </FilterChipGroup>

        {/* Where the reader is in the feed — the list itself has no page marks. */}
        {!loading && data.length > 0 && (
          <p className="tw:mb-2 tw:text-xs tw:text-slate-500">
            Showing{" "}
            <span className="tw:font-semibold tw:text-slate-700">
              {data.length}
            </span>{" "}
            of{" "}
            <span className="tw:font-semibold tw:text-slate-700">
              {shownTotal}
            </span>{" "}
            {shownTotal === 1 ? "event" : "events"}
          </p>
        )}
      </div>

      {loading ? (
        <div className="tw:flex tw:h-40 tw:items-center tw:justify-center">
          <AppSpinner />
        </div>
      ) : data.length === 0 ? (
        <NoData />
      ) : (
        <div className="tw:pb-2">
          {data.map((event, index) => {
            const { icon: Icon, tone } = KIND_STYLE[event.kind];
            return (
              <div
                key={event.id}
                className="tw:flex tw:items-start tw:gap-3 tw:border-t tw:border-slate-100 tw:px-4 tw:py-3 tw:first:border-t-0"
              >
                {/* Left rail — when it happened. Mobile moves it under the row. */}
                <div className="tw:hidden tw:w-28 tw:shrink-0 tw:pt-1 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400 tw:md:block">
                  <DateFormat value={event.when} formatStr={event.whenFormat} />
                </div>

                {/* The dot, with the connector running through the list. */}
                <div className="tw:relative tw:flex tw:shrink-0 tw:flex-col tw:items-center tw:self-stretch">
                  {index > 0 ? (
                    <span className="tw:absolute tw:-top-3 tw:hidden tw:h-3 tw:w-px tw:bg-slate-200 tw:md:block" />
                  ) : null}
                  <span
                    className={clsx(
                      "tw:flex tw:size-10 tw:items-center tw:justify-center tw:rounded-full tw:text-white tw:md:size-9",
                      tone,
                    )}
                  >
                    <Icon size={18} />
                  </span>
                  <span className="tw:hidden tw:w-px tw:flex-1 tw:bg-slate-200 tw:md:block" />
                </div>

                <div className="tw:min-w-0 tw:flex-1">
                  <p className="tw:truncate tw:text-sm tw:font-bold tw:text-slate-800">
                    {event.title}
                  </p>
                  <p className="tw:truncate tw:text-xs tw:text-slate-500">
                    {event.subtitle}
                  </p>
                  {/* On mobile the timestamp sits with the copy, not on a rail. */}
                  <p className="tw:mt-1 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400 tw:md:hidden">
                    <DateFormat
                      value={event.when}
                      formatStr={event.whenFormat}
                    />
                  </p>
                </div>

                <div
                  className={clsx(
                    "tw:shrink-0 tw:text-sm tw:font-bold",
                    event.isNegative ? "tw:text-red-600" : "tw:text-slate-900",
                  )}
                >
                  {event.amount !== undefined ? (
                    <>
                      {event.isNegative ? "-" : ""}
                      <Amount value={event.amount} />
                    </>
                  ) : (
                    event.value
                  )}
                </div>
              </div>
            );
          })}

          {hasMoreData && (
            <div className="tw:mt-3 tw:px-4 tw:pb-2">
              <LoadMoreButton
                loadMore={loadMore}
                loading={loadingMore}
                totalCount={shownTotal}
                loadedCount={data.length}
              />
            </div>
          )}
        </div>
      )}
    </AppCard>
  );
};

export default Timeline;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Customer Timeline"),
    },
  ];
}
