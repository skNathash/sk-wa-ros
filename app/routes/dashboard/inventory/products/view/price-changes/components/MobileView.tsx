import { Calendar, Info, User } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import DisplayPrice from "~/shared/products/display-price/DisplayPrice";
import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import Divider from "~/components/core/divider/Divider";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppPopover from "~/components/core/popover/AppPopover";
import SchemeDetailsPopover from "~/routes/configs/rsp/history/components/SchemeDetailsPopover";

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
      <div className={clsx("mobile-view-list", gridClass)}>
        {data.map((item, idx) => {
          const oldMrp =
            item.oldData?.mrp !== undefined ? Number(item.oldData.mrp) : 0;
          const newMrp =
            item.newData?.mrp !== undefined ? Number(item.newData.mrp) : 0;
          const changeColor = !item.isPositive
            ? "tw:text-red-600"
            : "tw:text-green-600";

          return (
            <AppCard key={item._id || idx} noPadding className={cardClass}>
              <div className="tw:px-3 tw:py-2.5">
                {/* prev → new price + change */}
                <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
                  <span className="tw:flex tw:min-w-0 tw:flex-1 tw:items-center tw:gap-1 tw:text-sm tw:whitespace-nowrap">
                    <span className="tw:text-gray-400 tw:line-through">
                      <DisplayPrice
                        price={item.prevPrice}
                        uom={item.oldData?.selectedStockUom}
                        hideUom
                      />
                    </span>
                    <span className="tw:text-gray-300">→</span>
                    <span className="tw:font-semibold tw:text-slate-900">
                      <DisplayPrice
                        price={item.newPrice}
                        uom={item.newData?.selectedStockUom}
                      />
                    </span>
                  </span>
                  <span
                    className={clsx(
                      "tw:shrink-0 tw:text-sm tw:font-semibold tw:whitespace-nowrap",
                      changeColor,
                    )}
                  >
                    {item.change < 0 ? "" : "+"}
                    <DisplayPrice
                      price={item.change}
                      uom={item.newData?.selectedStockUom}
                      hideUom
                    />{" "}
                    ({item.percent < 0 ? "" : "+"}
                    {item.percent.toFixed(1)}%)
                  </span>
                </div>

                {/* date + mrp */}
                <div className="tw:mt-1 tw:flex tw:items-center tw:justify-between tw:gap-2 tw:text-xs tw:text-gray-500">
                  <span className="tw:flex tw:min-w-0 tw:flex-1 tw:items-center tw:gap-1">
                    <Calendar
                      size={12}
                      className="tw:shrink-0 tw:text-slate-400"
                    />
                    <DateFormat
                      value={item.createdAt}
                      formatStr="dd MMM yy, hh:mm a"
                      className="tw:truncate"
                    />
                  </span>
                  <span className="tw:shrink-0 tw:whitespace-nowrap">
                    {t("mrp")}:{" "}
                    {oldMrp > 0 && oldMrp !== newMrp && (
                      <>
                        <span className="tw:text-gray-400 tw:line-through">
                          <DisplayPrice
                            price={oldMrp}
                            uom={item.oldData?.selectedStockUom}
                            hideUom
                          />
                        </span>{" "}
                        <span className="tw:text-gray-300">→</span>{" "}
                      </>
                    )}
                    <DisplayPrice
                      price={newMrp}
                      uom={item.newData?.selectedStockUom}
                      hideUom
                    />
                  </span>
                </div>
              </div>

              <Divider className="tw:my-0!" />

              {/* updated by + badges */}
              <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:px-3 tw:py-1.5">
                <span className="tw:flex tw:min-w-0 tw:flex-1 tw:items-center tw:gap-1">
                  <User size={12} className="tw:shrink-0 tw:text-slate-400" />
                  <span
                    className="tw:truncate tw:text-xs tw:text-gray-500"
                    title={item.createdByName}
                  >
                    {item.createdByName || t("unknownUser")}
                  </span>
                  {item.reason && (
                    <AppPopover
                      triggerContent={
                        <Info
                          size={12}
                          className="tw:shrink-0 tw:cursor-pointer tw:text-gray-400"
                        />
                      }
                    >
                      <div>
                        <div className="tw:text-xs">Remarks</div>
                        <p className="tw:text-xs tw:text-gray-700">
                          {item.reason}
                        </p>
                      </div>
                    </AppPopover>
                  )}
                </span>

                <span className="tw:flex tw:shrink-0 tw:items-center tw:gap-1.5">
                  {(item.newData?.offerDiscount ||
                    item.newData?.isOfferOfTheDay) && (
                    <SchemeDetailsPopover
                      oldData={item.oldData}
                      newData={item.newData}
                      triggerText="Scheme"
                    />
                  )}
                  {item.newData?.isFixedPrice && (
                    <AppPopover
                      triggerContent={
                        <span className="tw:cursor-pointer">
                          <AppBadge variant="secondary" size="sm">
                            {t("fixed")}
                          </AppBadge>
                        </span>
                      }
                    >
                      <div>
                        <div className="tw:text-xs tw:font-semibold">
                          Fixed Price
                        </div>
                        <p className="tw:text-xs tw:text-gray-700">
                          This item is sold at a fixed price, not subject to
                          discounts or variations.
                        </p>
                      </div>
                    </AppPopover>
                  )}
                  <AppBadge variant={item.applicableForVariant} size="sm">
                    {item.applicableForText}
                  </AppBadge>
                </span>
              </div>
            </AppCard>
          );
        })}
      </div>
      {showLoadMore && data.length > 0 && (
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
