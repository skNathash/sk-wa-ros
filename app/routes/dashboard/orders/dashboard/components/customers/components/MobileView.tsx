import React from "react";
import {
  Package,
  Tag,
  Calendar,
  ChevronRight,
  ShoppingCart,
  Box,
  DollarSign,
  IndianRupee,
} from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import AppBadge from "~/components/core/badge/AppBadge";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import LastOrderPopover from "../../LastOrderPopover";
import KeyValue from "~/components/core/key-value/KeyValue";

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
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-2">
          {Array.from({ length: 6 }).map((_, idx) => (
            <AppCard key={`skeleton-${idx}`} className="tw:h-full" noPadding>
              <div className="tw:p-2.5 tw:animate-pulse tw:space-y-2">
                {/* Name & Amount */}
                <div className="tw:flex tw:justify-between tw:gap-2">
                  <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:flex-1"></div>
                  <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-16"></div>
                </div>

                {/* Address */}
                <div className="tw:h-2.5 tw:bg-gray-200 tw:rounded tw:w-3/4"></div>

                {/* Badges */}
                <div className="tw:flex tw:gap-1.5">
                  <div className="tw:h-5 tw:bg-gray-200 tw:rounded tw:w-12"></div>
                  <div className="tw:h-5 tw:bg-gray-200 tw:rounded tw:w-14"></div>
                </div>

                {/* Last date */}
                <div className="tw:h-2.5 tw:bg-gray-200 tw:rounded tw:w-32"></div>
              </div>
            </AppCard>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-2">
        {data.map((c, idx) => (
          <div key={c.customerId} className="tw:h-full">
            <AppCard noPadding className="tw:h-full">
              <div className="tw:p-3 tw:h-full tw:flex tw:flex-col">
                <div className="tw:flex tw:justify-between tw:gap-2 tw:flex-grow">
                  <div className="tw:flex-1">
                    {/* customer name */}
                    <div className="tw:text-xs tw:font-medium tw:text-gray-900 tw:mb-1">
                      <AppLink
                        asLink
                        href={`/dashboard/network/view/b2c/${c.customerId}`}
                        showLinkColor
                      >
                        {c.customerName}
                      </AppLink>
                    </div>
                    {/* customer address */}
                    <div className="tw:text-xs tw:text-gray-500">
                      {c.addressStr}
                    </div>
                  </div>

                  <div>
                    <AppBadge variant={c.typeColor}>{c.orderType}</AppBadge>
                  </div>
                </div>

                {/* laster order */}
                <div className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center tw:gap-1 tw:mt-2">
                  <Calendar size={14} className="tw:text-slate-400" />
                  Last Order:
                  <LastOrderPopover
                    triggerContent={
                      <div className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center tw:gap-1 tw:cursor-pointer">
                        <DateFormat value={c.lastOrder.createdAt} />
                        <ChevronRight size={14} className="tw:text-slate-400" />
                      </div>
                    }
                    date={c.lastOrder.createdAt}
                    orderId={c.lastOrder.orderRefNo}
                    value={c.lastOrder.orderAmount}
                    status={c.lastOrder.status}
                    orderObjId={c.lastOrder.orderId}
                  />
                </div>

                <div className="tw:grid tw:grid-cols-3 tw:gap-2 tw:mt-auto tw:pt-4">
                  <div className="tw:bg-blue-50 tw:rounded-lg tw:p-3 tw:border tw:border-blue-100">
                    <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
                      {/* <ShoppingCart size={16} className="tw:text-blue-600" /> */}
                      <span className="tw:text-xs tw:font-medium tw:text-gray-600">
                        Total Orders
                      </span>
                    </div>
                    <div className="tw:text-sm tw:font-bold tw:text-blue-900">
                      {c.totalOrders}
                    </div>
                  </div>

                  <div className="tw:bg-purple-50 tw:rounded-lg tw:p-3 tw:border tw:border-purple-100">
                    <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
                      {/* <Box size={16} className="tw:text-purple-600" /> */}
                      <span className="tw:text-xs tw:font-medium tw:text-gray-600">
                        Total Products
                      </span>
                    </div>
                    <div className="tw:text-sm tw:font-bold tw:text-purple-900">
                      {c.totalUniqueProducts}
                    </div>
                  </div>

                  <div className="tw:bg-green-50 tw:rounded-lg tw:p-3 tw:border tw:border-green-100">
                    <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
                      {/* <IndianRupee size={16} className="tw:text-green-600" /> */}
                      <span className="tw:text-xs tw:font-medium tw:text-gray-600">
                        Total Value
                      </span>
                    </div>
                    <div className="tw:text-sm tw:font-bold tw:text-green-900">
                      <Amount value={c.grandTotalValue} decimalPlaces={0} />
                    </div>
                  </div>
                </div>
              </div>
            </AppCard>
          </div>
        ))}
      </div>

      {showLoadMore && !loading && (
        <div className="tw:mt-3 tw:px-2">
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
