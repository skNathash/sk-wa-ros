import { useCallback, useEffect, useRef, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import FilterChip from "~/components/core/filter-chip/FilterChip";
import FilterChipGroup from "~/components/core/filter-chip/FilterChipGroup";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import type { PaginationState } from "~/types/CommonTypes";
import {
  getCount,
  getData,
  prepareParams,
  type EventType,
  type RecentEvent,
} from "./helper";

const tabs: EventType[] = ["All", "PO", "Inward", "Payment", "CN", "DN"];

const typeBadgeVariant: Record<
  Exclude<EventType, "All">,
  "primary" | "secondary" | "success" | "warning" | "danger" | "outline"
> = {
  PO: "primary",
  Inward: "success",
  Payment: "warning",
  CN: "outline",
  DN: "secondary",
};

const typeColorClass: Record<Exclude<EventType, "All">, string> = {
  PO: "tw:bg-blue-50 tw:text-blue-700 tw:border-blue-200",
  Inward: "tw:bg-green-50 tw:text-green-700 tw:border-green-200",
  Payment: "tw:bg-amber-50 tw:text-amber-700 tw:border-amber-200",
  CN: "tw:bg-transparent tw:text-slate-700 tw:border-slate-300",
  DN: "tw:bg-purple-50 tw:text-purple-700 tw:border-purple-200",
};

/** Left accent bar colour per event type — mirrors the tile's badge hue. */
const typeAccentClass: Record<Exclude<EventType, "All">, string> = {
  PO: "tw:border-l-blue-500",
  Inward: "tw:border-l-emerald-500",
  Payment: "tw:border-l-amber-500",
  CN: "tw:border-l-orange-500",
  DN: "tw:border-l-purple-500",
};

/**
 * Recent events list with type filter tabs.
 * Fetches paginated insights and supports load-more + chip filters.
 */
const RecentEvents = ({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) => {
  const [activeTab, setActiveTab] = useState<EventType>("All");
  const [data, setData] = useState<RecentEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const filterRef = useRef<Record<string, any>>({
    eventType: "All",
  });

  const applyFilter = useCallback(async () => {
    setLoading(true);
    setData([]);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };

    if (startDate && endDate) {
      filterRef.current.startDate = startDate;
      filterRef.current.endDate = endDate;
    }

    try {
      const params = prepareParams(filterRef.current, paginationRef.current);
      const result = await getData(params);
      setData(result || []);
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
    } catch (error) {
      console.error("Recent events insights error:", error);
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

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
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
    } catch (error) {
      console.error("Recent events load more error:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  const handleChipClick = (tab: EventType) => {
    setActiveTab(tab);
    filterRef.current = {
      ...filterRef.current,
      eventType: tab,
    };
    applyFilter();
  };

  useEffect(() => {
    applyFilter();
  }, [applyFilter]);

  return (
    <div>
      <div className="tw:mb-3 tw:flex tw:items-center tw:justify-between tw:px-1">
        <p className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500">
          Recent · {paginationRef.current.totalRecords || data.length} events
        </p>
      </div>

      <FilterChipGroup className="tw:mb-3 tw:px-1">
        {tabs.map((tab) => (
          <FilterChip
            key={tab}
            active={activeTab === tab}
            onClick={() => handleChipClick(tab)}
          >
            {tab}
          </FilterChip>
        ))}
      </FilterChipGroup>

      <AppScrollArea className="tw:h-[400px]">
        {loading ? (
          <div className="tw:flex tw:h-40 tw:items-center tw:justify-center">
            <AppSpinner />
          </div>
        ) : data.length === 0 ? (
          <p className="tw:py-8 tw:text-center tw:text-xs tw:text-gray-400">
            No events found.
          </p>
        ) : (
          <div className="tw:space-y-3">
            {data.map((event) => (
              <div
                key={event.id}
                className={`tw:flex tw:items-center tw:gap-3 tw:rounded-xl tw:border-l-4 tw:bg-white tw:p-2.5 tw:shadow-sm tw:ring-1 tw:ring-slate-200/70 ${typeAccentClass[event.type]}`}
              >
                <div className="tw:flex tw:w-10 tw:flex-col tw:items-center tw:justify-center tw:rounded-lg tw:bg-slate-50 tw:py-1.5 tw:text-center tw:ring-1 tw:ring-slate-200/70">
                  <span className="tw:text-[10px] tw:font-bold tw:text-slate-700">
                    {event.date} {event.month}
                  </span>
                  <span className="tw:text-[9px] tw:font-semibold tw:text-gray-400">
                    {event.year}
                  </span>
                </div>

                <AppBadge
                  variant={typeBadgeVariant[event.type]}
                  className={`tw:shrink-0 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold tw:uppercase ${typeColorClass[event.type]}`}
                >
                  {event.type.slice(0, 2).toUpperCase()}
                </AppBadge>

                <div className="tw:min-w-0 tw:flex-1">
                  <AppLink
                    asLink
                    noUnderline
                    href={event.redirectionUrl}
                    className="tw:block tw:line-clamp-2 tw:text-xs tw:font-bold tw:text-slate-800 tw:hover:text-primary"
                  >
                    {event.title}
                  </AppLink>
                  <p className="tw:text-[10px] tw:font-medium tw:text-gray-500">
                    <span className="tw:capitalize">{event.subtitle}</span>
                    {event.time ? ` · ${event.time}` : ""}
                  </p>
                </div>

                {event.amount !== 0 && (
                  <Amount
                    value={event.amount}
                    className={`tw:shrink-0 tw:text-sm tw:font-bold ${
                      event.isNegative ? "tw:text-red-600" : "tw:text-slate-900"
                    }`}
                  />
                )}
              </div>
            ))}

            {hasMoreData && (
              <div className="tw:text-center tw:mt-4 tw:mb-2">
                <LoadMoreButton
                  loadMore={loadMore}
                  loading={loadingMore}
                  totalCount={paginationRef.current.totalRecords}
                  loadedCount={data.length}
                  loaderType="button"
                />
              </div>
            )}
          </div>
        )}
      </AppScrollArea>
    </div>
  );
};

export default RecentEvents;
