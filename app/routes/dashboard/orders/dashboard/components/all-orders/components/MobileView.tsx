import React from "react";
import AppCard from "~/components/core/card/AppCard";
import AppBadge from "~/components/core/badge/AppBadge";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppLink from "~/components/core/link/AppLink";

interface MobileViewProps {
  data: any[];
  loading: boolean;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  showLoadMore: boolean;
}

const MobileView: React.FC<MobileViewProps> = ({
  data,
  loading,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  showLoadMore,
}) => {
  if (!loading && data.length === 0) {
    return <NoData />;
  }

  if (loading) {
    return (
      <div>
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <AppCard key={`skeleton-${idx}`} className="tw:h-full" noPadding>
              <div className="tw:p-3 tw:animate-pulse">
                <div className="tw:flex tw:justify-between tw:items-start">
                  <div>
                    <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:w-28 tw:mb-2"></div>
                    <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-20"></div>
                  </div>
                  <div>
                    <div className="tw:h-5 tw:bg-gray-200 tw:rounded tw:w-20"></div>
                  </div>
                </div>

                <div className="tw-flex tw-justify-between tw-items-center tw-mt-3">
                  <div>
                    <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-32 tw:mb-1"></div>
                    <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-20"></div>
                  </div>
                  <div>
                    <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:w-16"></div>
                  </div>
                </div>
              </div>
            </AppCard>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-3">
        {data.map((order) => (
          <div key={order.orderId}>
            <AppCard className="tw:h-full" noPadding>
              <div className="tw:p-3">
                <div className="tw:flex tw:justify-between tw:items-center">
                  <div>
                    <AppLink
                      asLink
                      href={`/dashboard/orders/view/${order._id}`}
                      showLinkColor
                      className="tw:font-medium tw:text-sm"
                    >
                      {order.orderRefId}
                    </AppLink>
                    <div className="tw:text-xs tw:text-gray-600">
                      <DateFormat value={order.orderedDate} />
                    </div>
                  </div>
                  <div className="tw:text-right tw:flex tw:gap-2">
                    {/* order type */}
                    <AppBadge variant={order.typeColor}>
                      {order.orderType}
                    </AppBadge>

                    {/* order status */}
                    <AppBadge variant={order.statusColor}>
                      {order.displayStatus}
                    </AppBadge>
                  </div>
                </div>

                <div className="tw:flex tw:justify-between tw:items-center tw:mt-3">
                  <div>
                    <div className="tw:text-xs tw:text-gray-600">Customer:</div>
                    {order.userLink ? (
                      <AppLink
                        asLink
                        href={order.userLink}
                        showLinkColor
                        className="tw:text-sm tw:text-gray-700"
                      >
                        {order.orderedBy?.name || "--"}
                      </AppLink>
                    ) : (
                      <div className="tw:text-sm tw:text-gray-700">
                        {order.orderedBy?.name || "--"}
                      </div>
                    )}
                  </div>
                  <div>
                    <Amount
                      value={order.totalValue}
                      className="tw:text-base tw:font-semibold"
                    />
                    <div className="tw:text-xs tw:text-gray-600">
                      {order.products?.length} items
                    </div>
                  </div>
                </div>

                {order.createdBy?.name && (
                  <div className="tw:mt-3">
                    <div className="tw:text-xs tw:text-gray-600">
                      Created By:
                    </div>
                    <div className="tw:text-xs tw:font-medium tw:text-slate-600">
                      {order.createdBy.name}
                    </div>
                  </div>
                )}
              </div>
            </AppCard>
          </div>
        ))}
      </div>

      {showLoadMore && !loading && (
        <div className="tw:p-3">
          <LoadMoreButton
            loadMore={loadMore}
            loading={loadingMore}
            totalCount={totalCount}
            loadedCount={loadedCount}
          />
        </div>
      )}
    </div>
  );
};

export default MobileView;
