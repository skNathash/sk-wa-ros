import clsx from "clsx";
import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import useAppNav from "~/hooks/useAppNav";
import OmsService from "~/services/OmsService";
import type { VariantColor } from "~/types/CommonTypes";
import { getPaylaterOrders } from "../helper";

interface RecentOrdersProps {
  /** The buyer whose orders are listed. */
  buyerId: string;
  /** Rows shown. */
  limit?: number;
  className?: string;
}

/**
 * The buyer's most recent PayLater orders from this seller's catalog — the
 * spending the wallet under review actually funded. Rows open the order.
 */
const RecentOrders = ({ buyerId, limit = 5, className }: RecentOrdersProps) => {
  const appNav = useAppNav();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!buyerId) return;
    let mounted = true;

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const rows = await getPaylaterOrders(buyerId, limit);
        if (mounted) setOrders(rows);
      } catch (e) {
        if (mounted) setOrders([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchOrders();
    return () => {
      mounted = false;
    };
  }, [buyerId, limit]);

  const handleOpen = (order: any) => {
    if (!order?.orderId) return;
    appNav.to(`/dashboard/orders/view/${order.orderId}`);
  };

  return (
    <AppCard className={className}>
      <div className="tw:mb-3 tw:flex tw:items-baseline tw:justify-between tw:gap-2">
        <div className="tw:text-base tw:font-semibold">Recent orders</div>
        <span className="tw:text-xs tw:text-slate-400">
          Last {limit} PayLater orders · from your catalog
        </span>
      </div>

      {loading ? (
        <div className="tw:flex tw:flex-col tw:gap-2">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="tw:h-11 tw:animate-pulse tw:rounded-lg tw:bg-slate-100"
            />
          ))}
        </div>
      ) : !orders.length ? (
        <p className="tw:rounded-lg tw:border tw:border-dashed tw:border-slate-200 tw:bg-slate-50 tw:py-6 tw:text-center tw:text-sm tw:text-slate-400">
          No PayLater orders from this buyer yet
        </p>
      ) : (
        <div className="tw:flex tw:flex-col tw:divide-y tw:divide-slate-100">
          {orders.map((order, index) => (
            <button
              key={order.orderId || index}
              type="button"
              onClick={() => handleOpen(order)}
              className="tw:flex tw:w-full tw:items-center tw:gap-3 tw:px-1 tw:py-2.5 tw:text-left tw:hover:bg-slate-50"
            >
              <div className="tw:min-w-0 tw:flex-1">
                <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-x-2 tw:gap-y-1">
                  <span className="tw:text-sm tw:font-semibold tw:text-slate-800">
                    {order.orderRefNo || order.orderId}
                  </span>
                  <span className="tw:text-xs tw:text-slate-500">
                    <DateFormat
                      value={order.orderedDate}
                      formatStr="dd MMM yyyy"
                    />
                  </span>
                  {order.itemsCount ? (
                    <span className="tw:text-xs tw:text-slate-400">
                      · {order.itemsCount}{" "}
                      {order.itemsCount === 1 ? "item" : "items"}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-2">
                {order.paymentMethod ? (
                  <AppBadge variant="secondary">{order.paymentMethod}</AppBadge>
                ) : null}
                {order.status ? (
                  <AppBadge
                    variant={
                      (order._statusColor ||
                        OmsService.getStatusColor(order.status)) as VariantColor
                    }
                  >
                    {OmsService.getStatusLabel(order.status)}
                  </AppBadge>
                ) : null}
                <span
                  className={clsx(
                    "tw:w-20 tw:text-right tw:text-sm tw:font-bold tw:tabular-nums tw:text-slate-800",
                  )}
                >
                  <Amount value={order.orderAmount || 0} decimalPlaces={0} />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </AppCard>
  );
};

export default RecentOrders;
