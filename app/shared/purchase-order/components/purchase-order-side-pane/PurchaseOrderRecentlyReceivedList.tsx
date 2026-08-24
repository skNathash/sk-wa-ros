import { endOfDay, startOfDay, subDays } from "date-fns";
import { ArrowRight, PackageCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import useAppNav from "~/hooks/useAppNav";

interface PurchaseOrderRecentlyReceivedListProps {
  className?: string;
  /** Maximum number of recently received packages to preview. Defaults to 5. */
  limit?: number;
}

interface RecentlyReceivedItem {
  _id?: string;
  refNo?: string;
  from?: { name?: string };
  totalReceivedValue?: number;
  totalValue?: number;
  totalReceivedQty?: number;
  receivedQty?: number;
  receivedAt?: string;
  createdAt?: string;
  orderData?: { id?: string; refId?: string };
}

const PAGE_SIZE = 5;

const fetchRecentlyReceived = async (
  limit: number,
): Promise<RecentlyReceivedItem[]> => {
  const now = new Date();
  const params = {
    page: 1,
    limit,
    groupBy: "box",
    startDate: startOfDay(subDays(now, 6)).toISOString(),
    endDate: endOfDay(now).toISOString(),
  };

  try {
    const response = await PurchaseOrderService.getRecentlyReceived(params);
    if (response.statusCode === 200 && Array.isArray(response.data?.data)) {
      return PurchaseOrderService.formatRecentlyReceived(response.data.data);
    }
    return [];
  } catch (error) {
    console.error(
      "Error fetching recently received packages for side pane:",
      error,
    );
    return [];
  }
};

const initials = (name?: string) =>
  (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "VN";

/**
 * Compact recently-received package list for the purchase-order side pane.
 * "View all" routes to the full recently-received page.
 */
const PurchaseOrderRecentlyReceivedList = ({
  className,
  limit = PAGE_SIZE,
}: PurchaseOrderRecentlyReceivedListProps) => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();

  const [items, setItems] = useState<RecentlyReceivedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchRecentlyReceived(limit);
    setItems(data);
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    load();
  }, [load]);

  const handleViewAll = () => {
    appNav.to("/dashboard/purchase-order/recently-received");
  };

  const handleRowClick = (row: RecentlyReceivedItem) => {
    const orderId = row.orderData?.id || row.orderData?.refId;
    if (orderId) {
      appNav.to(`/dashboard/purchase-order/view/${orderId}`);
      return;
    }
    if (row.refNo) {
      appNav.to("/dashboard/purchase-order/recently-received");
    }
  };

  return (
    <div className={className}>
      <div className="tw:flex tw:items-center tw:justify-between tw:px-1 tw:mb-2">
        <h3 className="tw:flex tw:items-center tw:gap-1.5 tw:text-sm tw:font-bold tw:text-slate-900">
          {t("recentlyReceived", { defaultValue: "Recently Received" })}
          {items.length > 0 && (
            <span className="tw:inline-flex tw:min-w-4 tw:items-center tw:justify-center tw:rounded-full tw:bg-emerald-100 tw:px-1 tw:py-px tw:text-[10px] tw:font-bold tw:tabular-nums tw:text-emerald-700">
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
            <PackageCheck size={24} className="tw:mb-2 tw:text-slate-300" />
            <div className="tw:text-sm">
              {t("noRecentlyReceived", {
                defaultValue: "No recently received packages",
              })}
            </div>
          </div>
        ) : (
          <div className="tw:divide-y tw:divide-slate-100">
            {items.map((row, index) => {
              const receivedAt = row.receivedAt || row.createdAt;
              const value = row.totalReceivedValue ?? row.totalValue ?? 0;
              const qty = row.totalReceivedQty ?? row.receivedQty ?? 0;

              return (
                <button
                  key={row._id || row.refNo || index}
                  type="button"
                  onClick={() => handleRowClick(row)}
                  aria-label={`${t("view")} ${row.refNo || ""}`.trim()}
                  className="tw:flex tw:w-full tw:items-center tw:gap-2.5 tw:px-3 tw:py-2.5 tw:text-left tw:cursor-pointer tw:transition-colors tw:hover:bg-slate-50"
                >
                  <span className="tw:flex tw:h-8 tw:w-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-emerald-50 tw:text-[11px] tw:font-bold tw:text-emerald-700">
                    {initials(row.from?.name)}
                  </span>

                  <span className="tw:min-w-0 tw:flex-1">
                    <span className="tw:flex tw:items-center tw:gap-2">
                      <span className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-[13px] tw:font-bold tw:text-slate-900">
                        {row.refNo || "--"}
                      </span>
                      <span className="tw:shrink-0 tw:text-[13px] tw:font-bold tw:text-slate-900">
                        <Amount value={value} decimalPlaces={0} />
                      </span>
                    </span>

                    <span className="tw:mt-0.5 tw:flex tw:items-center tw:gap-1.5 tw:text-[11px] tw:text-slate-500">
                      <span className="tw:min-w-0 tw:truncate">
                        {row.from?.name || "N/A"}
                      </span>
                      <span className="tw:shrink-0 tw:text-slate-300">·</span>
                      <span className="tw:shrink-0 tw:tabular-nums">
                        {qty} {t("items", { defaultValue: "items" })}
                      </span>
                      {receivedAt ? (
                        <span className="tw:ml-auto tw:shrink-0 tw:text-slate-400">
                          <DateFormat value={receivedAt} formatStr="dd MMM" />
                        </span>
                      ) : null}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseOrderRecentlyReceivedList;
