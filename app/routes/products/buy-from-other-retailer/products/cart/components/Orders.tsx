import { ArrowRight, Inbox } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import OmsService from "~/services/OmsService";
import useAppNav from "~/hooks/useAppNav";
import type { VariantColor } from "~/types/CommonTypes";

interface OrdersProps {
  className?: string;
  /** Maximum number of recent orders to preview in the pane. */
  limit?: number;
}

interface OrderItem {
  orderId: string;
  orderRefNo: string;
  sellerInfo?: { franchiseName?: string };
  orderAmount: number;
  orderedDate: string | Date;
  _statusLbl?: string;
  _statusColor?: VariantColor;
}

const fetchMyOrders = async (limit: number): Promise<OrderItem[]> => {
  const params = {
    page: 1,
    count: limit,
    filter: {},
    sort: { orderedDate: -1 },
  };

  try {
    const response = await OmsService.getMyOrders(params);
    const orders = response?.data?.data || [];
    return OmsService.formatOrderResponse(orders);
  } catch (error) {
    console.error("Error fetching my orders for side pane:", error);
    return [];
  }
};

/**
 * Compact "My Orders" preview for the buy-from-other-retailer cart side pane.
 *
 * Mirrors the data and formatting used by `dashboard/orders/list?tab=my-orders`,
 * but rendered as tappable rows that navigate to the full order detail view.
 */
const Orders = ({ className, limit = 5 }: OrdersProps) => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();

  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchMyOrders(limit);
    setItems(data);
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    load();
  }, [load]);

  const handleViewAll = () => {
    appNav.to("/dashboard/orders/list", { tab: "my-orders" });
  };

  const handleRowClick = (order: OrderItem) => {
    if (order.orderId) {
      appNav.to(`/dashboard/orders/view/${order.orderId}`);
    }
  };

  return (
    <div className={className}>
      <div className="tw:flex tw:items-center tw:justify-between tw:px-1 tw:mb-2">
        <h3 className="tw:flex tw:items-center tw:gap-1.5 tw:text-sm tw:font-bold tw:text-slate-900">
          {t("myOrders", { defaultValue: "My Orders" })}
          {items.length > 0 && (
            <span className="tw:inline-flex tw:min-w-4 tw:items-center tw:justify-center tw:rounded-full tw:bg-blue-100 tw:px-1 tw:py-px tw:text-[10px] tw:font-bold tw:tabular-nums tw:text-blue-700">
              {items.length}
            </span>
          )}
        </h3>
        <button
          type="button"
          onClick={handleViewAll}
          className="tw:inline-flex tw:items-center tw:gap-0.5 tw:text-xs tw:font-medium tw:text-primary tw:cursor-pointer tw:hover:underline"
        >
          {t("viewAll", { defaultValue: "View all" })}
          <ArrowRight size={12} />
        </button>
      </div>

      <div className="tw:overflow-hidden tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white">
        {loading ? (
          <div className="tw:divide-y tw:divide-slate-100">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="tw:flex tw:items-center tw:gap-2.5 tw:px-3 tw:py-2.5 tw:animate-pulse"
              >
                <div className="tw:h-8 tw:w-8 tw:shrink-0 tw:rounded-full tw:bg-slate-100" />
                <div className="tw:flex-1 tw:space-y-1.5">
                  <div className="tw:h-3 tw:w-2/3 tw:rounded tw:bg-slate-100" />
                  <div className="tw:h-2.5 tw:w-1/2 tw:rounded tw:bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-8 tw:px-4 tw:text-center tw:text-slate-500">
            <Inbox size={24} className="tw:mb-2 tw:text-slate-300" />
            <div className="tw:text-sm">
              {t("noOrders", { defaultValue: "No orders" })}
            </div>
            <div className="tw:text-xs tw:text-slate-400 tw:mt-0.5">
              {t("myOrdersWillAppearHere", {
                defaultValue: "My orders will appear here",
              })}
            </div>
          </div>
        ) : (
          <div className="tw:divide-y tw:divide-slate-100">
            {items.map((row) => (
              <button
                key={row.orderId}
                type="button"
                onClick={() => handleRowClick(row)}
                aria-label={`${t("view")} ${row.orderRefNo || ""}`.trim()}
                className="tw:flex tw:w-full tw:items-center tw:gap-2.5 tw:px-3 tw:py-2.5 tw:text-left tw:cursor-pointer tw:transition-colors tw:hover:bg-slate-50"
              >
                <span className="tw:flex tw:h-8 tw:w-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-slate-100 tw:text-[11px] tw:font-bold tw:text-slate-700">
                  {(row.sellerInfo?.franchiseName || "")
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase() || "OR"}
                </span>

                <span className="tw:min-w-0 tw:flex-1">
                  <span className="tw:flex tw:items-center tw:gap-2">
                    <span className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-[13px] tw:font-bold tw:text-slate-900">
                      {row.orderRefNo || "--"}
                    </span>
                    <span className="tw:shrink-0 tw:text-[13px] tw:font-bold tw:text-slate-900">
                      <Amount value={row.orderAmount || 0} decimalPlaces={0} />
                    </span>
                  </span>

                  <span className="tw:mt-0.5 tw:flex tw:items-center tw:gap-1.5 tw:text-[11px] tw:text-slate-500">
                    <span className="tw:min-w-0 tw:truncate">
                      {row.sellerInfo?.franchiseName || "N/A"}
                    </span>
                    {row.orderedDate && (
                      <>
                        <span className="tw:shrink-0 tw:text-slate-300">·</span>
                        <span className="tw:shrink-0 tw:tabular-nums tw:text-slate-400">
                          <DateFormat
                            value={row.orderedDate}
                            formatStr="dd MMM"
                          />
                        </span>
                      </>
                    )}
                    {row._statusLbl && (
                      <AppBadge
                        variant={row._statusColor || "default"}
                        size="sm"
                        className="tw:ml-auto"
                      >
                        {row._statusLbl}
                      </AppBadge>
                    )}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
