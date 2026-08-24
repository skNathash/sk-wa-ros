import clsx from "clsx";
import { ChevronRight, FileText } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import NoData from "~/components/core/no-data/NoData";

interface MobileViewProps {
  data: any[];
  loading: boolean;
  callback?: (args: { action: string; data: any }) => void;
}

/**
 * Theme-2 mobile order list for the retailer Orders tab.
 *
 * `app-bleed-x` pulls the list out of the page gutter on theme-2 mobile so the
 * rows run edge to edge; it is a no-op on other themes and on desktop.
 */
const MobileView = ({ data, loading, callback }: MobileViewProps) => {
  const openOrder = (order: any) => {
    if (!callback) return;
    callback({ action: "view-order", data: order });
  };

  return (
    <div className="app-bleed-x tw:overflow-hidden tw:rounded-2xl tw:bg-white tw:shadow-sm tw:ring-1 tw:ring-slate-200/70 tw:divide-y tw:divide-slate-100">
      {loading ? (
        Array.from({ length: 5 }).map((_, idx) => (
          <div
            key={`order-skeleton-${idx}`}
            className="tw:flex tw:items-center tw:gap-3 tw:px-3 tw:py-3"
          >
            <div className="tw:h-10 tw:w-10 tw:shrink-0 tw:rounded-full tw:bg-slate-100 tw:animate-pulse" />
            <div className="tw:flex-1 tw:space-y-2">
              <div className="tw:h-3.5 tw:w-2/5 tw:rounded tw:bg-slate-100 tw:animate-pulse" />
              <div className="tw:h-2.5 tw:w-3/5 tw:rounded tw:bg-slate-100 tw:animate-pulse" />
            </div>
            <div className="tw:space-y-2">
              <div className="tw:h-3.5 tw:w-16 tw:rounded tw:bg-slate-100 tw:animate-pulse" />
              <div className="tw:h-4 tw:w-20 tw:rounded tw:bg-slate-100 tw:animate-pulse" />
            </div>
          </div>
        ))
      ) : !data || data.length === 0 ? (
        <div className="tw:px-3 tw:py-6">
          <NoData />
        </div>
      ) : (
        data.map((order) => {
          return (
            <button
              key={order._id || order.orderId}
              type="button"
              onClick={() => openOrder(order)}
              className="tw:flex tw:w-full tw:items-center tw:gap-3 tw:px-3 tw:py-3 tw:text-left"
            >
              <span className="tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-slate-100 tw:text-slate-500">
                <FileText size={18} />
              </span>

              <div className="tw:min-w-0 tw:flex-1">
                <p className="tw:truncate tw:text-sm tw:font-bold tw:text-slate-900">
                  {order.orderRefNo}
                </p>
                <p className="tw:mt-0.5 tw:flex tw:flex-wrap tw:items-center tw:gap-x-1 tw:text-[11px] tw:text-gray-500">
                  <DateFormat
                    value={order.createdAt || order.orderedDate || null}
                    formatStr="dd MMM yyyy, hh:mm a"
                  />
                  <span className="tw:text-slate-300">·</span>
                  <span>{order._itemsCount} items</span>
                  {order._units > 0 && (
                    <>
                      <span className="tw:text-slate-300">·</span>
                      <span>{order._units}u</span>
                    </>
                  )}
                </p>
                <p className="tw:mt-0.5 tw:flex tw:items-center tw:gap-1 tw:text-[11px]">
                  <span className="tw:inline-flex tw:items-center tw:rounded tw:bg-slate-100 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide tw:text-slate-600">
                    {order._statusLbl || order.status}
                  </span>
                  <span
                    className={clsx(
                      "tw:truncate",
                      order._hasDue ? "tw:text-amber-600" : "tw:text-green-600",
                    )}
                  >
                    {order._paymentLine}
                  </span>
                </p>
              </div>

              <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-1">
                <div className="tw:text-right">
                  <Amount
                    value={order._total}
                    decimalPlaces={0}
                    className="tw:block tw:text-[15px] tw:font-bold tw:text-slate-900"
                  />
                  {order._hasDue && order._paidAmount > 0 ? (
                    <span className="tw:text-[10px] tw:font-semibold tw:text-amber-600">
                      <Amount value={order._dueAmount} decimalPlaces={0} /> left
                    </span>
                  ) : null}
                </div>
                <ChevronRight
                  size={18}
                  className="tw:text-slate-400"
                />
              </div>
            </button>
          );
        })
      )}
    </div>
  );
};

export default MobileView;
