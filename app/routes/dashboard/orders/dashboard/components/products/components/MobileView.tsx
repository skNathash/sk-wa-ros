import React from "react";
import { ChevronRight, Info } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import LastOrderPopover from "../../LastOrderPopover";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import DateFormat from "~/components/core/date/DateFormat";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppLink from "~/components/core/link/AppLink";
import type { VariantColor } from "~/types/CommonTypes";

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
  if (loading) {
    return (
      <div className="tw:grid tw:grid-cols-1 tw:lg:grid-cols-3 tw:gap-3">
        {[...Array(6)].map((_, index) => (
          <AppCard key={index} className="tw:mb-0 tw:h-full" noPadding>
            <div className="tw:p-4 tw:space-y-3">
              <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:animate-pulse tw:w-3/4" />

              <div className="tw:flex tw:justify-between tw:items-center tw:gap-2">
                <div className="tw:h-3 tw:w-1/3 tw:bg-gray-200 tw:rounded tw:animate-pulse" />
                <div className="tw:h-6 tw:w-16 tw:bg-gray-200 tw:rounded tw:animate-pulse" />
              </div>

              <div className="tw:grid tw:grid-cols-2 tw:gap-2.5 tw:pt-2 tw:border-t">
                <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:animate-pulse" />
                <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:animate-pulse" />
                <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:animate-pulse" />
                <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:animate-pulse" />
              </div>
            </div>
          </AppCard>
        ))}
      </div>
    );
  }

  if (!loading && data.length === 0) {
    return <NoData />;
  }

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:lg:grid-cols-3 tw:gap-3">
        {data.map((row) => (
          <AppCard key={row.orderId} className="tw:mb-0 tw:h-full" noPadding>
            <div className="tw:p-4 tw:space-y-3">
              {/* Product Name and Deal ID */}

              <div className="tw:flex-1">
                <div className="tw:h-10">
                  <AppLink
                    asLink
                    href={`/dashboard/inventory/products/view/${row.productId}`}
                    showLinkColor
                    className="tw:font-medium tw:text-sm tw:line-clamp-2"
                  >
                    {row.productName}
                  </AppLink>
                </div>
                <div className="tw:flex tw:justify-between tw:items-center tw:gap-2">
                  {row.productRefId && (
                    <div className="tw:text-xs tw:text-gray-500">
                      ID: {row.productRefId}
                    </div>
                  )}
                  <AppBadge variant={row.orderTypeColor || "secondary"}>
                    {row.orderType}
                  </AppBadge>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="tw:grid tw:grid-cols-2 tw:gap-2.5 tw:pt-2 tw:border-t">
                <KeyValue label="Units Sold" size="sm">
                  {row.totalUnits || 0}
                </KeyValue>
                <KeyValue label="Sales Value" size="sm">
                  <Amount value={row.totalValue || 0} />
                </KeyValue>
                <KeyValue label="Current Stock" size="sm">
                  {row.currentStock || 0} units
                </KeyValue>
                <KeyValue label="Status" size="sm">
                  <AppBadge variant={row.statusColor as VariantColor}>
                    {row.displayStatus}
                  </AppBadge>
                </KeyValue>
              </div>

              {row.lastOrder && (
                <div className="tw:pt-2 tw:border-t">
                  <LastOrderPopover
                    triggerContent={
                      <div className="tw:cursor-pointer">
                        <div className="tw:text-xs tw:text-gray-500 tw:mb-1">
                          Last Order
                        </div>
                        <div className="tw:text-xs tw:flex tw:items-center tw:gap-1 tw:text-gray-600">
                          <DateFormat value={row.lastOrder.createdAt} />
                          <ChevronRight
                            size={14}
                            className="tw:flex-shrink-0"
                          />
                        </div>
                      </div>
                    }
                    date={row.lastOrder.createdAt}
                    orderId={row.lastOrder.orderRefNo}
                    value={row.lastOrder.orderAmount}
                    status={row.lastOrder.status}
                    orderObjId={row.lastOrder.orderId}
                  />
                </div>
              )}
            </div>
          </AppCard>
        ))}
      </div>

      {/* Load More Button */}
      {showLoadMore && !loading && data.length > 0 && (
        <div className="tw:mt-4 tw:text-center">
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
