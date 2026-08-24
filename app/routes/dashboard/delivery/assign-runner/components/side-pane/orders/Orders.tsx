import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import { useTranslation } from "react-i18next";
import AppBadge from "~/components/core/badge/AppBadge";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import DateFormat from "~/components/core/date/DateFormat";
import { AppInput } from "~/components/core/form";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import { useSearchParams } from "react-router";
import PaneChips, {
  type PaneChipItem,
  type PaneChipsAction,
} from "~/shared/navigation/pane-chips/PaneChips";
import type { PaginationState } from "~/types/CommonTypes";
import {
  getCount,
  getData,
  prepareParams,
  type OrderTabKey,
  type ReadyOrder,
} from "./helper";

interface OrdersProps {
  /** Bubbles the loaded/total count up so the pane header can show "N ready". */
  onCountChange?: (count: number) => void;
}

/** Orders closer than this (km) show under the "Nearby" tab. */
const NEARBY_KM = 3;

const SORT = { key: "orderedDate", value: "desc" } as const;

export default function Orders({ onCountChange }: OrdersProps) {
  const { t } = useTranslation(["common"]);
  const { register, getValues } = useForm({ defaultValues: { search: "" } });
  const [searchParams, setSearchParams] = useSearchParams();

  // The selected order lives in the URL — tapping a row only rewrites the
  // query string and the page reacts to it.
  const selectedOrderId = searchParams.get("orderId") || "";

  const [data, setData] = useState<ReadyOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [activeTab, setActiveTab] = useState<OrderTabKey>("all");
  const [counts, setCounts] = useState({ all: 0, cod: 0 });

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });
  const filterRef = useRef<Record<string, any>>({ tab: "all" });

  // Initial load / filter change — resets to page one and refreshes the count.
  const applyFilter = useCallback(async () => {
    setLoading(true);
    setData([]);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    try {
      const result = await getData(
        prepareParams(filterRef.current, paginationRef.current, SORT),
      );
      setData(result || []);

      // Both chips carry a total, so each tab is counted under the current
      // search — the active one also drives pagination.
      const [all, cod] = await Promise.all([
        getCount(
          prepareParams(
            { ...filterRef.current, tab: "all" },
            paginationRef.current,
            SORT,
          ),
        ),
        getCount(
          prepareParams(
            { ...filterRef.current, tab: "cod" },
            paginationRef.current,
            SORT,
          ),
        ),
      ]);
      setCounts({ all, cod });

      const totalRecords = filterRef.current.tab === "cod" ? cod : all;
      paginationRef.current.totalRecords = totalRecords;
      onCountChange?.(all);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
    } catch (e) {
      setData([]);
      setCounts({ all: 0, cod: 0 });
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        SORT,
      );
      const result = await getData(params);
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
    } catch (e) {
      setHasMoreData(false);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  useEffect(() => {
    applyFilter();
  }, []);

  const handleSearchChange = useDebouncedCallback(() => {
    filterRef.current = { ...filterRef.current, search: getValues("search") };
    applyFilter();
  }, 500);

  const handleTabChange = useCallback(
    (key: OrderTabKey) => {
      setActiveTab(key);
      // "Nearby" has no server-side distance filter — it narrows what is
      // already loaded, so only `all`/`cod` round-trip.
      if (key === "nearby") return;
      filterRef.current = { ...filterRef.current, tab: key };
      applyFilter();
    },
    [applyFilter],
  );

  const nearbyOrders = useMemo(
    () =>
      data.filter(
        (o) =>
          typeof o.deliveryDistance === "number" &&
          o.deliveryDistance < NEARBY_KM,
      ),
    [data],
  );

  const visibleOrders = activeTab === "nearby" ? nearbyOrders : data;

  const chips = useMemo<PaneChipItem[]>(
    () =>
      [
        { key: "all", label: t("all", "All"), count: counts.all },
        { key: "cod", label: "COD", count: counts.cod },
        {
          key: "nearby",
          label: t("nearby", "Nearby"),
          count: nearbyOrders.length,
        },
      ].map((chip) => ({ ...chip, active: chip.key === activeTab })),
    [t, counts, nearbyOrders.length, activeTab],
  );

  const handleSelectOrder = useCallback(
    (order: ReadyOrder) => {
      const next = new URLSearchParams(searchParams);
      next.set("orderId", order.orderId);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  return (
    <>
      <AppInput
        name="search"
        register={register}
        placeholder={t("filterCustomerNbhd", "Filter · customer · nbhd")}
        leftIcon={<Search size={16} />}
        className="tw:w-full"
        onChange={handleSearchChange}
      />

      <PaneChips
        data={chips}
        callback={({ data: chip }: PaneChipsAction) =>
          handleTabChange(chip.key as OrderTabKey)
        }
      />

      {/* The rows run edge to edge inside the pane — `app-bleed-x` cancels the
          page gutter on mobile, and hairline dividers replace the card gaps. */}
      <div className="tw:flex-1 tw:min-h-0 tw:overflow-y-auto app-bleed-x tw:border-t tw:border-slate-100">
        {loading && data.length === 0 ? (
          <BusyLoader show={true} />
        ) : visibleOrders.length === 0 ? (
          <NoData />
        ) : (
          <>
            {visibleOrders.map((order) => {
              const selected = order.orderId === selectedOrderId;
              const isB2b = order.orderType === "B2B";

              return (
                <button
                  key={order.orderId}
                  type="button"
                  onClick={() => handleSelectOrder(order)}
                  className={`tw:flex tw:w-full tw:items-start tw:gap-2.5 tw:border-b tw:border-slate-100 tw:border-l-3 tw:px-3 tw:py-2 tw:text-left tw:transition-colors ${
                    selected
                      ? "tw:border-l-emerald-600 tw:bg-emerald-50"
                      : "tw:border-l-transparent tw:bg-white tw:hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`tw:flex tw:size-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:text-xs tw:font-bold tw:text-white ${
                      isB2b ? "tw:bg-emerald-600" : "tw:bg-blue-600"
                    }`}
                  >
                    {order._initials}
                  </span>

                  <div className="tw:min-w-0 tw:flex-1">
                    <div className="tw:flex tw:items-start tw:justify-between tw:gap-2">
                      <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-2">
                        <span className="tw:truncate tw:text-[13px] tw:font-bold tw:text-slate-900">
                          #{order.orderRefNo}
                        </span>
                        <AppBadge
                          variant={isB2b ? "success" : "primary"}
                          size="sm"
                        >
                          {order.orderType}
                        </AppBadge>
                      </div>

                      <span
                        className={`tw:shrink-0 tw:text-[13px] tw:font-bold ${
                          order._isCod
                            ? "tw:text-emerald-700"
                            : "tw:text-slate-400"
                        }`}
                      >
                        {order._amountLbl}
                      </span>
                    </div>

                    <div className="tw:flex tw:items-start tw:justify-between tw:gap-2">
                      <p className="tw:min-w-0 tw:flex-1 tw:text-[11px] tw:text-slate-500">
                        {order._meta}
                      </p>
                      <DateFormat
                        value={order.orderedDate ?? null}
                        formatStr="dd MMM, h:mm a"
                        className="tw:shrink-0 tw:whitespace-nowrap tw:text-[11px] tw:text-slate-400 tw:tabular-nums"
                      />
                    </div>
                  </div>
                </button>
              );
            })}

            {hasMoreData && activeTab !== "nearby" && (
              <LoadMoreButton
                loadMore={loadMore}
                loadedCount={data.length}
                loading={loadingMore}
                totalCount={paginationRef.current.totalRecords}
              />
            )}
          </>
        )}
      </div>
    </>
  );
}
