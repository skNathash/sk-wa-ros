import clsx from "clsx";
import { FileText } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import NoData from "~/components/core/no-data/NoData";
import useAppNav from "~/hooks/useAppNav";
import {
  getOrderItemsCount,
  getOrderTotal,
  getStatusTone,
  RECENT_ORDERS_LIMIT,
} from "./helper";

type MobileViewProps = {
  data: any[];
  loading?: boolean;
};

/**
 * Compact order rows for mobile: a status-tinted tile, the order and its date
 * on the left, amount over a status pill on the right. `app-bleed-x` (theme-2)
 * pulls the list out of the page gutter so rows run edge to edge; a no-op on
 * other themes.
 */
const MobileView = ({ data, loading }: MobileViewProps) => {
  const appNav = useAppNav();

  const openOrder = (order: any) => {
    if (!order?.orderId) return;
    appNav.to(`/dashboard/orders/view/${order.orderId}`);
  };

  return (
    <div className="app-bleed-x tw:overflow-hidden tw:rounded-2xl tw:bg-white tw:shadow-sm tw:ring-1 tw:ring-slate-200/70 tw:divide-y tw:divide-slate-100">
      {loading ? (
        Array.from({ length: RECENT_ORDERS_LIMIT }).map((_, idx) => (
          <div
            key={`recent-order-skeleton-${idx}`}
            className="tw:flex tw:items-center tw:gap-3 tw:px-3 tw:py-3"
          >
            <div className="tw:h-10 tw:w-10 tw:shrink-0 tw:rounded-full tw:bg-slate-100 tw:animate-pulse" />
            <div className="tw:flex-1 tw:space-y-2">
              <div className="tw:h-3 tw:w-2/5 tw:rounded tw:bg-slate-100 tw:animate-pulse" />
              <div className="tw:h-2.5 tw:w-3/5 tw:rounded tw:bg-slate-100 tw:animate-pulse" />
            </div>
            <div className="tw:space-y-2">
              <div className="tw:h-3.5 tw:w-16 tw:rounded tw:bg-slate-100 tw:animate-pulse" />
              <div className="tw:h-4 tw:w-20 tw:rounded tw:bg-slate-100 tw:animate-pulse" />
            </div>
          </div>
        ))
      ) : data.length === 0 ? (
        <div className="tw:px-3 tw:py-6">
          <NoData />
        </div>
      ) : (
        data.map((order) => {
          const tone = getStatusTone(order);

          return (
            <button
              key={order._id || order.orderId}
              type="button"
              onClick={() => openOrder(order)}
              className="tw:flex tw:w-full tw:items-center tw:gap-3 tw:px-3 tw:py-3 tw:text-left"
            >
              <span
                className={clsx(
                  "tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full",
                  tone.icon,
                )}
              >
                <FileText size={18} />
              </span>

              <div className="tw:min-w-0 tw:flex-1">
                <p className="tw:truncate tw:text-sm tw:font-bold tw:text-slate-900">
                  {order.orderRefNo}
                </p>
                <p className="tw:mt-0.5 tw:flex tw:flex-wrap tw:items-center tw:gap-x-1 tw:text-[11px] tw:text-gray-500">
                  <DateFormat
                    value={order.createdAt || order.orderedDate || null}
                    formatStr="dd MMM yyyy"
                  />
                  <span className="tw:text-slate-300">·</span>
                  <span>{getOrderItemsCount(order)} items</span>
                </p>
              </div>

              <div className="tw:shrink-0 tw:text-right">
                <Amount
                  value={getOrderTotal(order)}
                  decimalPlaces={0}
                  className="tw:block tw:text-[15px] tw:font-bold tw:text-slate-900"
                />
                <span
                  className={clsx(
                    "tw:mt-1 tw:inline-flex tw:items-center tw:rounded-md tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide",
                    tone.badge,
                  )}
                >
                  {order._statusLbl || order.status}
                </span>
              </div>
            </button>
          );
        })
      )}
    </div>
  );
};

export default MobileView;
export type { MobileViewProps };
