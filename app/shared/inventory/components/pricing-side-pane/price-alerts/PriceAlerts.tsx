import clsx from "clsx";
import { ArrowDown, ArrowUp, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import Amount from "~/components/core/amount/Amount";
import ImgRender from "~/components/core/img/ImgRender";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import TintTile from "~/components/core/tint/TintTile";
import { tintIndexFor } from "~/components/core/tint/tints";
import useAppNav from "~/hooks/useAppNav";
import type { PaginationState } from "~/types/CommonTypes";
import {
  getCount,
  getData,
  prepareParams,
  PRICE_ALERT_DAYS,
  PRICE_ALERT_DISTANCE,
  type PriceAlert,
  type PriceAlertDirection,
  type PriceAlertFilters,
  type PriceAlertPriceType,
} from "./helper";

// Direction carries the whole read of a row: a drop is an opening (someone
// undercut us, or SK gave us room), a rise is pressure. Tint the row, the
// reason line and the price with the same hue so it lands without reading.
const TONE: Record<
  PriceAlertDirection,
  { row: string; reason: string; price: string }
> = {
  down: {
    row: "tw:bg-emerald-50/70 tw:ring-emerald-100",
    reason: "tw:text-emerald-700/80",
    price: "tw:text-emerald-700",
  },
  up: {
    row: "tw:bg-red-50/70 tw:ring-red-100",
    reason: "tw:text-red-600/90",
    price: "tw:text-red-600",
  },
};

interface PriceAlertsProps {
  /** Section title above the list. */
  title?: string;
  /** Which channel's prices the feed reads. Defaults to B2B. */
  priceType?: PriceAlertPriceType;
  /** Peer radius in km. */
  distance?: number;
  /** Lookback window in days. */
  days?: number;
  /** Rows fetched per page. Defaults to 10. */
  pageSize?: number;
  className?: string;
}

/**
 * "Seller & SK alerts" list for the Prices & Tax pane — every deal in the network
 * whose price moved inside the lookback window, either because a peer repriced
 * or because our own sync did. Each row shows the new price against the one it
 * replaced, so the size of the gap is visible before opening anything.
 *
 * Owns its header, search and paging: the feed comes off
 * `catalog/seller-deals/network/price-alerts` and pages in place, so callers
 * drop the section in without wiring any data.
 */
const PriceAlerts = ({
  title = "Seller & SK alerts",
  priceType = "b2b",
  distance = PRICE_ALERT_DISTANCE,
  days = PRICE_ALERT_DAYS,
  pageSize = 10,
  className,
}: PriceAlertsProps) => {
  const appNav = useAppNav();

  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: pageSize,
    startSlNo: 1,
    endSlNo: pageSize,
    totalRecords: 0,
  });

  const filterRef = useRef<PriceAlertFilters>({ priceType, distance, days });

  const applyFilter = useCallback(async () => {
    setLoading(true);
    paginationRef.current = {
      ...paginationRef.current,
      rowsPerPage: pageSize,
      activePage: 1,
      startSlNo: 1,
      endSlNo: pageSize,
    };

    try {
      const params = prepareParams(filterRef.current, paginationRef.current);
      const result = await getData(params);
      setAlerts(result);
      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);

      const total = await getCount(params);
      paginationRef.current.totalRecords = total;
      setTotalRecords(total || result.length);
    } catch (error) {
      console.error("Error fetching price alerts:", error);
      setAlerts([]);
      setHasMoreData(false);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) {
      return;
    }

    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(filterRef.current, paginationRef.current);
      const result = await getData(params);
      setAlerts((prev) => [...prev, ...result]);
      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    } catch (error) {
      console.error("Error loading more price alerts:", error);
      setHasMoreData(false);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMoreData, loadingMore]);

  // The feed context lives on the ref the fetch reads, so a prop change has to
  // write it before the re-fetch runs.
  useEffect(() => {
    filterRef.current = { ...filterRef.current, priceType, distance, days };
    applyFilter();
  }, [applyFilter, days, distance, priceType]);

  const handleSearch = useDebouncedCallback((value: string) => {
    filterRef.current = { ...filterRef.current, search: value };
    applyFilter();
  }, 500);

  const onSearchChange = (value: string) => {
    setSearch(value);
    handleSearch(value);
  };

  /**
   * A row is a lead, not a dead end — tapping one opens the same deal on the
   * Manage Price sheet for the channel the feed is read against, narrowed to
   * the deal that moved. The sheet searches on `dealRefId`, so that is what
   * rides across as the search term.
   */
  const openDeal = (alert: PriceAlert) => {
    if (!alert.dealRefId) {
      return;
    }
    appNav.to("/configs/rsp", {
      type: priceType === "b2c" ? "customer" : "network",
      search: alert.dealRefId,
    });
  };

  return (
    <div className={clsx("tw:flex tw:flex-col tw:gap-1.5", className)}>
      {/* Header — the section label with how many moves it covers. */}
      <div className="tw:flex tw:items-baseline tw:justify-between tw:gap-2">
        <p className="app-pane-label">
          {title}
          {totalRecords ? ` · ${totalRecords}` : ""}
        </p>
      </div>

      <div className="tw:relative">
        <Search className="tw:pointer-events-none tw:absolute tw:top-1/2 tw:left-2.5 tw:size-3.5 tw:-translate-y-1/2 tw:text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search alerts"
          className="tw:w-full tw:rounded-xl tw:bg-slate-100 tw:py-2 tw:pr-3 tw:pl-8 tw:text-xs tw:text-slate-800 tw:outline-none tw:placeholder:text-slate-400 tw:focus:bg-white tw:focus:ring-1 tw:focus:ring-slate-300"
        />
      </div>

      {/* Radix lays the viewport's content out as a `display:table` box, which
          sizes to its widest row and lets long deal names push past the pane —
          `no-table` puts it back to a block so `truncate` can do its job. */}
      <AppScrollArea className="no-table tw:h-60 tw:w-full tw:pr-1">
        {loading ? (
          <div className="tw:flex tw:flex-col tw:gap-2">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="tw:h-13 tw:animate-pulse tw:rounded-xl tw:bg-slate-100"
              />
            ))}
          </div>
        ) : !alerts.length ? (
          <p className="tw:rounded-xl tw:bg-slate-50 tw:px-2.5 tw:py-3 tw:text-center tw:text-[11px] tw:text-slate-400">
            No price moves in the last {days} days
          </p>
        ) : (
          <div className="tw:flex tw:flex-col tw:gap-2">
            {alerts.map((alert) => {
              const tone = TONE[alert.direction];
              const DirectionIcon =
                alert.direction === "down" ? ArrowDown : ArrowUp;

              return (
                <button
                  key={alert.id}
                  type="button"
                  title={alert.remarks}
                  onClick={() => openDeal(alert)}
                  className={clsx(
                    "tw:flex tw:w-full tw:items-center tw:gap-2.5 tw:rounded-xl tw:px-2.5 tw:py-2 tw:text-left tw:ring-1 tw:transition-shadow tw:hover:ring-2",
                    tone.row,
                  )}
                >
                  {alert.image ? (
                    <ImgRender
                      assetId={alert.image}
                      alt={alert.name}
                      size="100x100"
                      className="tw:size-9 tw:shrink-0 tw:rounded-full tw:bg-white tw:object-contain"
                    />
                  ) : (
                    <TintTile
                      index={tintIndexFor(alert.name)}
                      className="tw:size-9 tw:shrink-0 tw:rounded-full"
                    >
                      <span className="tw:text-[9px] tw:font-bold">
                        {alert.tileLabel}
                      </span>
                    </TintTile>
                  )}

                  <div className="tw:min-w-0 tw:flex-1">
                    <p className="tw:truncate tw:text-xs tw:font-semibold tw:text-slate-900">
                      {alert.name}
                    </p>
                    <p
                      className={clsx(
                        "tw:line-clamp-2 tw:text-[11px]",
                        tone.reason,
                      )}
                    >
                      {alert.reasonLabel} · {alert.changeLabel}
                    </p>
                  </div>

                  <div className="tw:shrink-0 tw:text-right">
                    <p
                      className={clsx(
                        "tw:flex tw:items-center tw:justify-end tw:gap-0.5 tw:text-sm tw:font-bold",
                        tone.price,
                      )}
                    >
                      <DirectionIcon className="tw:size-3" />
                      <Amount value={alert.price} decimalPlaces={0} />
                    </p>
                    {alert.previousPrice ? (
                      <p className="tw:text-[11px] tw:text-slate-400 tw:line-through">
                        <Amount value={alert.previousPrice} decimalPlaces={0} />
                      </p>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {hasMoreData && !loading && alerts.length > 0 && (
          <LoadMoreButton
            loadMore={loadMore}
            loading={loadingMore}
            totalCount={totalRecords}
            loadedCount={alerts.length}
            loaderType="button"
            noMargin
          />
        )}
      </AppScrollArea>
    </div>
  );
};

export default PriceAlerts;
