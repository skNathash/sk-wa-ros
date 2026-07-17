import { Calendar, User } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";

interface Props {
  data: any[];
  loading: boolean;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  showLoadMore: boolean;
}

const MobileView = ({
  data,
  loading,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  showLoadMore,
}: Props) => {
  if (loading) {
    return (
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-3">
        {Array.from({ length: 4 }).map((_, idx) => (
          <AppCard key={idx} noPadding>
            <div className="tw:px-4 tw:py-4 tw:animate-pulse tw:space-y-2">
              <div className="tw:h-4 tw:bg-slate-200 tw:rounded tw:w-24" />
              <div className="tw:h-6 tw:bg-slate-200 tw:rounded tw:w-32" />
              <div className="tw:h-3 tw:bg-slate-200 tw:rounded tw:w-40" />
            </div>
          </AppCard>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <AppCard>
        <NoData />
      </AppCard>
    );
  }

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:xl:grid-cols-3 tw:gap-3">
        {data.map((item, idx) => {
          const refundId = item.refundSettlementId || "-";
          const refundLink = item._id
            ? `/dashboard/orders/refunds/view/${item._id}`
            : null;
          const orderLabel = item.orderRefNo || item.orderId;

          return (
            <AppCard
              key={item._id || refundId || idx}
              noPadding
              className="tw:overflow-hidden tw:hover:border-slate-300 tw:transition-colors"
            >
              <div className="tw:px-4 tw:pt-3 tw:pb-3 tw:flex tw:items-start tw:justify-between tw:gap-3">
                <div className="tw:min-w-0">
                  <div className="tw:text-[11px] tw:uppercase tw:tracking-wider tw:text-slate-500">
                    Refund
                  </div>
                  {refundLink ? (
                    <AppLink
                      asLink
                      href={refundLink}
                      className="tw:font-semibold tw:text-slate-900 tw:tabular-nums tw:break-all"
                    >
                      {refundId}
                    </AppLink>
                  ) : (
                    <div className="tw:font-semibold tw:text-slate-900 tw:tabular-nums tw:break-all">
                      {refundId}
                    </div>
                  )}
                </div>
                <div className="tw:text-right tw:shrink-0">
                  <Amount
                    value={item.refundAmount}
                    decimalPlaces={2}
                    className="tw:text-lg tw:font-semibold tw:text-rose-600 tw:tabular-nums tw:leading-tight"
                  />
                  <div className="tw:mt-1 tw:flex tw:items-center tw:gap-1 tw:justify-end tw:text-[11px] tw:text-slate-500">
                    <Calendar size={12} />
                    <DateFormat value={item.createdAt} formatStr="dd MMM yyyy" />
                  </div>
                </div>
              </div>

              <div className="tw:px-4 tw:pb-3 tw:flex tw:items-center tw:gap-1.5 tw:flex-wrap">
                <AppBadge variant={item._statusColor || "secondary"}>
                  {item.displayStatus || item.status || "-"}
                </AppBadge>
                {item.orderType && (
                  <AppBadge variant={item._typeColor || "secondary"}>
                    {item.orderType}
                  </AppBadge>
                )}
              </div>

              <div className="tw:px-4 tw:py-3 tw:bg-slate-50/60 tw:border-t tw:border-slate-100 tw:flex tw:flex-col tw:gap-1.5">
                <div className="tw:flex tw:items-baseline tw:justify-between tw:gap-2">
                  <span className="tw:text-xs tw:text-slate-500">Order</span>
                  {item.orderId ? (
                    <AppLink
                      asLink
                      href={`/dashboard/orders/view/${item.orderId}`}
                      className="tw:text-sm tw:font-medium tw:tabular-nums tw:truncate"
                    >
                      {orderLabel}
                    </AppLink>
                  ) : (
                    <span className="tw:text-sm tw:text-slate-400">—</span>
                  )}
                </div>
                <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:min-w-0">
                  <span className="tw:text-xs tw:text-slate-500 tw:flex tw:items-center tw:gap-1">
                    <User size={12} /> Customer
                  </span>
                  <div className="tw:text-right tw:min-w-0">
                    {item.customerInfo?.name ? (
                      item._customerLink ? (
                        <AppLink
                          asLink
                          href={item._customerLink}
                          className="tw:text-sm tw:font-medium tw:text-slate-900 tw:truncate tw:hover:underline"
                        >
                          {item.customerInfo.name}
                        </AppLink>
                      ) : (
                        <div className="tw:text-sm tw:font-medium tw:text-slate-900 tw:truncate">
                          {item.customerInfo.name}
                        </div>
                      )
                    ) : (
                      <div className="tw:text-sm tw:text-slate-400">—</div>
                    )}
                    {item.customerInfo?.mobile ? (
                      <div className="tw:text-[11px] tw:text-slate-500 tw:tabular-nums">
                        {item.customerInfo.mobile}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </AppCard>
          );
        })}
      </div>
      {showLoadMore && (
        <div className="tw:text-center tw:mt-4">
          <LoadMoreButton
            loadMore={loadMore}
            loading={loadingMore}
            totalCount={totalCount}
            loadedCount={loadedCount}
          />
        </div>
      )}
    </>
  );
};

export default MobileView;
