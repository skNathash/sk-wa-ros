import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import AppBadge from "~/components/core/badge/AppBadge";
import { AppInput } from "~/components/core/form";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import type { PaginationState } from "~/types/CommonTypes";
import {
  getCount,
  getData,
  prepareParams,
  type ByOrder,
  type ByOrderFilter,
} from "../by-order/helper";

/**
 * The tracker's mobile runner list — every live shipment shown as one compact
 * card under the live map. Each card pairs the order with the courier carrying
 * it: the CLB ref + type chip and ETA on the top line, the customer's name as
 * the headline, then the runner's avatar + name · distance and the COD amount
 * along the bottom. It mirrors the desktop "By Order" data but reads as a
 * single-column hand-over queue.
 */
const RunnerList = () => {
  const [data, setData] = useState<ByOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const { register, getValues } = useForm<ByOrderFilter>({
    defaultValues: {
      search: "",
    },
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

    try {
      const params = prepareParams(getValues(), paginationRef.current);
      setData(await getData(params));
      paginationRef.current.totalRecords = await getCount(params);
    } catch (e) {
      setData([]);
      paginationRef.current.totalRecords = 0;
    } finally {
      setLoading(false);
    }
  }, [getValues]);

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);

    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const result = await getData(
        prepareParams(getValues(), paginationRef.current),
      );
      setData((prev) => [...prev, ...result]);
    } catch (e) {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage - 1,
      };
    } finally {
      setLoadingMore(false);
    }
  }, [getValues, loadingMore]);

  useEffect(() => {
    applyFilter();
  }, []);

  const debounceSearch = useDebouncedCallback(() => applyFilter(), 500);

  const handleSearchChange = () => {
    debounceSearch();
  };

  return (
    <div>
      <div className="tw:text-xs tw:font-semibold tw:mb-2">On route now</div>
      {loading ? (
        <div className="tw:flex tw:flex-col tw:gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={`runner-list-skeleton-${index}`}
              className="skeleton-loader tw:h-24 tw:w-full tw:rounded-xl"
            />
          ))}
        </div>
      ) : data.length === 0 ? (
        <p className="tw:px-4 tw:py-3 tw:text-xs tw:text-slate-400">
          No runner is carrying a shipment right now.
        </p>
      ) : (
        <>
          <div className="tw:flex tw:flex-col tw:gap-3">
            {data.map((order) => {
              const runnerName = order.deliveryAgent?.name;
              return (
                <div
                  key={order.orderId}
                  className="tw:overflow-hidden tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:shadow-sm"
                >
                  {/* Top line — ref + type chip on the left, ETA on the right. */}
                  <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:border-b tw:border-slate-100 tw:px-3.5 tw:py-2.5">
                    <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-2">
                      <span className="tw:truncate tw:text-xs tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-500">
                        {order.orderRefNo || "—"}
                      </span>
                      <AppBadge variant="primary" size="xs">
                        {order.orderType || "B2C"}
                      </AppBadge>
                    </div>
                    <AppBadge variant="primary" size="sm">
                      {order._etaLbl}
                    </AppBadge>
                  </div>

                  {/* Customer name. */}
                  <div className="tw:px-3.5 tw:pt-2.5 tw:text-lg tw:font-bold tw:leading-snug tw:text-slate-900">
                    {order.customerInfo?.name || "Customer"}
                  </div>

                  {/* Runner + COD row. */}
                  <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:px-3.5 tw:py-2.5">
                    <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-2.5">
                      <span className="tw:flex tw:size-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-orange-500 tw:text-xs tw:font-bold tw:text-white tw:uppercase">
                        {order._runnerInitials}
                      </span>
                      <span className="tw:truncate tw:text-sm tw:text-slate-600">
                        {runnerName || "Runner"}
                        {typeof order.deliveryDistance === "number" && (
                          <>
                            <span
                              aria-hidden
                              className="tw:mx-1 tw:text-slate-300"
                            >
                              ·
                            </span>
                            <span className="tw:tabular-nums">
                              {order.deliveryDistance.toFixed(1)} km
                            </span>
                          </>
                        )}
                      </span>
                    </div>
                    <AppBadge
                      variant="success"
                      size="sm"
                      className="tw:shrink-0"
                    >
                      {order._paymentLbl} {order._amountLbl}
                    </AppBadge>
                  </div>
                </div>
              );
            })}
          </div>

          <LoadMoreButton
            loadMore={loadMore}
            loading={loadingMore}
            loadedCount={data.length}
            totalCount={paginationRef.current.totalRecords}
            loaderType="button"
          />
        </>
      )}
    </div>
  );
};

export default RunnerList;
