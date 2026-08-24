import React from "react";
import { useTranslation } from "react-i18next";
import { Calendar, Truck } from "lucide-react";
import DateFormat from "~/components/core/date/DateFormat";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppLink from "~/components/core/link/AppLink";
import Divider from "~/components/core/divider/Divider";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import AppCard from "~/components/core/card/AppCard";
import NoData from "~/components/core/no-data/NoData";

interface MobileViewProps {
  data: any[];
  loading?: boolean;
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore: () => void;
  totalCount?: number;
  loadedCount: number;
}

// auto-fill keeps every card at least 280px wide, so the content never gets
// squeezed into overlapping/one-character columns on any breakpoint.
const gridClass =
  "tw:grid tw:gap-3 tw:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]";

const cardClass =
  "tw:mb-0 tw:h-full tw:transition-shadow tw:hover:shadow-md tw:gap-0";

const MobileView: React.FC<MobileViewProps> = ({
  data,
  loading,
  showLoadMore = false,
  loadingMore = false,
  loadMore,
  totalCount = 0,
  loadedCount,
}) => {
  const { t } = useTranslation(["common"]);

  // Loading state
  if (loading) {
    return (
      <div className={gridClass}>
        {Array.from({ length: 6 }).map((_, idx) => (
          <AppCard key={`skeleton-${idx}`} noPadding className={cardClass}>
            <div className="tw:animate-pulse">
              <div className="tw:flex tw:items-start tw:justify-between tw:gap-3 tw:px-3 tw:py-2.5">
                <div className="tw:flex-1 tw:space-y-1.5">
                  <div className="tw:h-4 tw:w-32 tw:rounded tw:bg-gray-200" />
                  <div className="tw:h-3 tw:w-24 tw:rounded tw:bg-gray-100" />
                </div>
                <div className="tw:space-y-1.5">
                  <div className="tw:h-4 tw:w-16 tw:rounded tw:bg-gray-200" />
                  <div className="tw:h-3 tw:w-14 tw:rounded tw:bg-gray-100" />
                </div>
              </div>
              <Divider className="tw:my-0!" />
              <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:px-3 tw:py-2">
                <div className="tw:h-3.5 tw:w-28 tw:rounded tw:bg-gray-100" />
                <div className="tw:h-5 tw:w-20 tw:rounded-full tw:bg-gray-100" />
              </div>
            </div>
          </AppCard>
        ))}
      </div>
    );
  }

  // No data state
  if (!data || data.length === 0) {
    return (
      <AppCard>
        <NoData />
      </AppCard>
    );
  }

  // Data state
  return (
    <>
      <div className={gridClass}>
        {data.map((item, idx) => {
          const poId = item.orderId || item.po?.id || "--";
          const vendorName = item.vendorName || item.vendor?.name || "--";
          const unitPrice = item.purchasePrice ?? item._dealPrice ?? 0;
          const quantity = item.quantity ?? item._dealQty ?? 0;
          const deliveryDate = item.receivedDate || item.expectedDeliveryDate;

          return (
            <AppCard
              key={item._id || poId || idx}
              noPadding
              className={cardClass}
            >
              <div className="tw:px-3 tw:py-2.5">
                {/* po ref + total */}
                <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
                  <AppLink
                    asLink
                    href={`/dashboard/purchase-order/view/${item._id}`}
                    title={poId}
                    className="tw:block tw:min-w-0 tw:flex-1 tw:truncate tw:text-sm tw:font-semibold tw:text-blue-600"
                  >
                    {poId}
                  </AppLink>
                  <Amount
                    value={unitPrice * quantity}
                    decimalPlaces={2}
                    className="tw:shrink-0 tw:text-sm tw:font-semibold tw:whitespace-nowrap tw:text-slate-900"
                  />
                </div>

                {/* date + qty × unit price */}
                <div className="tw:mt-1 tw:flex tw:items-center tw:justify-between tw:gap-2 tw:text-xs tw:text-gray-500">
                  <span className="tw:flex tw:min-w-0 tw:flex-1 tw:items-center tw:gap-1">
                    <Calendar
                      size={12}
                      className="tw:shrink-0 tw:text-slate-400"
                    />
                    {item.createdAt ? (
                      <DateFormat
                        value={item.createdAt}
                        formatStr="dd MMM yy, hh:mm a"
                        className="tw:truncate"
                      />
                    ) : (
                      <span className="tw:truncate">--</span>
                    )}
                  </span>
                  <span className="tw:shrink-0 tw:whitespace-nowrap">
                    {quantity} × <Amount value={unitPrice} />
                  </span>
                </div>
              </div>

              <Divider className="tw:my-0!" />

              {/* vendor + delivery date + status */}
              <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:px-3 tw:py-1.5">
                <span className="tw:flex tw:min-w-0 tw:flex-1 tw:items-center tw:gap-1">
                  <Truck size={12} className="tw:shrink-0 tw:text-slate-400" />
                  {item.vendorId ? (
                    <AppLink
                      asLink
                      href={`/dashboard/vendor/view/${item.vendorId}`}
                      title={vendorName}
                      className="tw:block tw:min-w-0 tw:truncate tw:text-xs tw:text-blue-600"
                    >
                      {vendorName}
                    </AppLink>
                  ) : (
                    <span className="tw:truncate tw:text-xs tw:text-gray-500">
                      {vendorName}
                    </span>
                  )}
                </span>

                <span className="tw:flex tw:shrink-0 tw:items-center tw:gap-1.5">
                  {deliveryDate && (
                    <span
                      className="tw:whitespace-nowrap tw:text-xs tw:text-gray-500"
                      title={t("deliveryDate")}
                    >
                      <DateFormat value={deliveryDate} formatStr="dd MMM yy" />
                    </span>
                  )}
                  <AppBadge variant={item._statusColor || "default"} size="sm">
                    {item._statusLbl || item.status || "--"}
                  </AppBadge>
                </span>
              </div>
            </AppCard>
          );
        })}
      </div>
      {showLoadMore && !loading && data.length > 0 && (
        <LoadMoreButton
          loadMore={loadMore}
          loading={loadingMore}
          totalCount={totalCount}
          loadedCount={loadedCount}
        />
      )}
    </>
  );
};

export default MobileView;
