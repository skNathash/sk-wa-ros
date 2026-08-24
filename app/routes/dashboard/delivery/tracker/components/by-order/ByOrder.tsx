import { Banknote, Check, CheckCheck, MapPin, MessageCircle, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import { AppInput } from "~/components/core/form";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import type { PaginationState } from "~/types/CommonTypes";
import {
  getCount,
  getData,
  prepareParams,
  type ByOrder as OrderRow,
  type ByOrderFilter,
} from "./helper";

/**
 * The tracker's "By Order" tab — every live shipment shown as a chat bubble,
 * as if each customer had messaged the store about their order. It mirrors
 * "By Runner" (same paging + search shape) but reads as a WhatsApp thread:
 * the avatar on the left, the order as an incoming message with a tail, and a
 * soft doodle wallpaper behind the list.
 */
const ByOrder = () => {
  const [data, setData] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 20,
    startSlNo: 1,
    endSlNo: 20,
    totalRecords: 0,
  });

  const { register, getValues } = useForm<ByOrderFilter>({
    defaultValues: {
      search: "",
    },
  });

  // Initial load / search change — back to page one, count refreshed.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const debounceSearch = useDebouncedCallback(() => applyFilter(), 500);

  return (
    <div>
      <div className="app-full-bleed tw:mb-4 tw:bg-white tw:px-4 tw:py-3">
        <AppInput
          placeholder="Search by order · customer"
          register={register}
          name="search"
          leftIcon={<Search size={16} />}
          onChange={debounceSearch}
        />
      </div>

      {/* WhatsApp-style thread — each live shipment rendered as one outgoing
          message: bubble green, hugged to the right with the tail corner
          squared off, carrying the order number, the "ON ROUTE / B2C" chips,
          the route line, and the hand-over actions. */}
      <>
        {loading ? (
          <div className="tw:flex tw:flex-col tw:gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={`by-order-skeleton-${index}`}
                className="skeleton-loader tw:ml-auto tw:h-40 tw:w-full tw:max-w-[85%] tw:sm:max-w-xs tw:rounded-[0.85rem]"
              />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="tw:flex tw:min-h-56 tw:flex-col tw:items-center tw:justify-center tw:gap-1 tw:text-center">
            <span className="tw:text-2xl">📦</span>
            <p className="tw:text-sm tw:text-slate-500">
              No order is out for delivery right now.
            </p>
          </div>
        ) : (
          <>
            <div className="tw:flex tw:flex-col tw:gap-3">
              {data.map((order) => {
                return (
                  <div
                    key={order.orderId}
                    className="tw:ml-auto tw:w-full tw:max-w-[85%] tw:sm:max-w-xs tw:rounded-[0.9rem] tw:rounded-tr-sm tw:bg-[#dcf8c6] tw:px-3 tw:py-2.5 tw:pb-1.5 tw:shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]"
                  >
                    {/* Order number — the green "CLB-4805" slug. */}
                    <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-1.5">
                      <span className="tw:text-[13px] tw:font-semibold tw:tracking-wide tw:text-[#0a6b57] tw:uppercase">
                        {order.orderRefNo}
                      </span>
                      <AppBadge
                        variant="primary"
                        size="xs"
                        className="tw:uppercase"
                      >
                        {order._statusLbl || "ON ROUTE"}
                      </AppBadge>
                      <span className="tw:inline-flex tw:items-center tw:gap-[0.3rem] tw:px-2 tw:py-[0.18rem] tw:rounded-md tw:text-[12px] tw:leading-tight tw:whitespace-nowrap tw:bg-white/60 tw:text-[#075e54] tw:border tw:border-[#075e54]/[0.18] tw:font-semibold">
                        {order.orderType}
                      </span>
                    </div>

                    {/* Customer name. */}
                    <div className="tw:mt-1 tw:text-[17px] tw:font-bold tw:leading-snug tw:text-slate-900">
                      {order.customerInfo?.name || "Customer"}
                    </div>

                    {/* Route line — locality · distance · items · weight. */}
                    <div className="tw:mt-1 tw:flex tw:flex-wrap tw:items-center tw:gap-x-1 tw:gap-y-0.5 tw:text-[13px] tw:text-slate-700">
                      <MapPin size={13} className="tw:shrink-0 tw:text-slate-600" />
                      <span className="tw:truncate">{order._locality || "Store"}</span>
                      {typeof order.deliveryDistance === "number" && (
                        <>
                          <span aria-hidden className="tw:text-slate-400">·</span>
                          <span className="tw:tabular-nums">
                            {order.deliveryDistance.toFixed(1)} km
                          </span>
                        </>
                      )}
                      {order._itemCount > 0 && (
                        <>
                          <span aria-hidden className="tw:text-slate-400">·</span>
                          <span className="tw:tabular-nums">
                            {order._itemCount} items
                          </span>
                        </>
                      )}
                      {order._weightLbl && (
                        <>
                          <span aria-hidden className="tw:text-slate-400">·</span>
                          <span className="tw:tabular-nums">{order._weightLbl}</span>
                        </>
                      )}
                    </div>

                    {/* Runner line — the courier carrying the parcel. */}
                    {order._driverLbl && (
                      <div className="tw:mt-0.5 tw:text-[13px] tw:text-slate-700">
                        {order._driverLbl}
                      </div>
                    )}

                    {/* COD + ETA chips. */}
                    <div className="tw:mt-2 tw:flex tw:flex-wrap tw:items-center tw:gap-1.5">
                      <span className="tw:inline-flex tw:items-center tw:gap-[0.3rem] tw:px-2 tw:py-[0.18rem] tw:rounded-md tw:text-[12px] tw:leading-tight tw:whitespace-nowrap tw:bg-white/60 tw:text-[#075e54] tw:border tw:border-[#075e54]/[0.18]">
                        <Banknote size={13} className="tw:shrink-0" />
                        <span className="tw:font-semibold">{order._paymentLbl}</span>
                        <span className="tw:font-bold tw:tabular-nums">
                          {order._amountLbl}
                        </span>
                      </span>
                      {order._etaLbl && (
                        <span className="tw:inline-flex tw:items-center tw:gap-[0.3rem] tw:px-2 tw:py-[0.18rem] tw:rounded-md tw:text-[12px] tw:leading-tight tw:whitespace-nowrap tw:bg-white/60 tw:text-[#075e54] tw:border tw:border-[#075e54]/[0.18]">
                          <span className="tw:font-semibold">{order._etaLbl}</span>
                        </span>
                      )}
                    </div>

                    {/* Hand-over actions. */}
                    <div className="tw:mt-2.5 tw:flex tw:flex-wrap tw:items-center tw:gap-2">
                      <button
                        type="button"
                        className="tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-lg tw:bg-white/80 tw:px-2.5 tw:py-1.5 tw:text-[13px] tw:font-semibold tw:text-slate-800 tw:border tw:border-white tw:shadow-[0_1px_1px_rgba(11,20,26,0.10)] tw:cursor-pointer tw:transition-colors tw:duration-150 hover:tw:bg-white"
                      >
                        <Check size={15} className="tw:shrink-0 tw:text-slate-700" />
                        Delivery OTP
                      </button>
                      <button
                        type="button"
                        className="tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-lg tw:bg-white/80 tw:px-2.5 tw:py-1.5 tw:text-[13px] tw:font-semibold tw:text-slate-800 tw:border tw:border-white tw:shadow-[0_1px_1px_rgba(11,20,26,0.10)] tw:cursor-pointer tw:transition-colors tw:duration-150 hover:tw:bg-white"
                      >
                        <MessageCircle
                          size={15}
                          className="tw:shrink-0 tw:text-[#2b7a3f]"
                        />
                        WA cust
                      </button>
                    </div>

                    {/* Timestamp row — date + time, right aligned. */}
                    <div className="tw:mt-1.5 tw:flex tw:items-center tw:justify-end tw:gap-1 tw:text-[11px] tw:text-slate-500 tw:tabular-nums">
                      <DateFormat
                        value={order.orderedDate ?? null}
                        formatStr="dd MMM, h:mm a"
                      />
                      <CheckCheck size={13} className="tw:text-sky-500" />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="tw:mt-3 tw:border-t tw:border-slate-200 tw:pt-2">
              <LoadMoreButton
                loadMore={loadMore}
                loading={loadingMore}
                loadedCount={data.length}
                totalCount={paginationRef.current.totalRecords}
                loaderType="button"
              />
            </div>
          </>
        )}
      </>
    </div>
  );
};

export default ByOrder;
