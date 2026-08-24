import React from "react";
import clsx from "clsx";
import { Calendar } from "lucide-react";
import DateFormat from "~/components/core/date/DateFormat";
import AppBadge from "~/components/core/badge/AppBadge";
import Divider from "~/components/core/divider/Divider";
import AppCard from "~/components/core/card/AppCard";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";

interface MobileViewProps {
  data: any[];
  loading?: boolean;
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore: () => void;
  totalCount?: number;
  loadedCount: number;
  onView?: (item: any) => void;
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
  onView,
}) => {
  const renderReference = (referenceHref?: string, refNo?: string) => {
    const hasValidReferenceLink = !!referenceHref && referenceHref !== "#";

    if (!hasValidReferenceLink) {
      return (
        <span className="tw:block tw:min-w-0 tw:flex-1 tw:truncate tw:text-sm tw:font-semibold tw:text-slate-900">
          {refNo || "--"}
        </span>
      );
    }

    return (
      <AppLink
        asLink
        href={referenceHref}
        title={refNo}
        className="tw:block tw:min-w-0 tw:flex-1 tw:truncate tw:text-sm tw:font-semibold tw:text-blue-600"
        onClick={(e) => e.stopPropagation()}
      >
        {refNo || "--"}
      </AppLink>
    );
  };

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
        {data.map((item, idx) => (
          <div
            key={item._id || idx}
            className="tw:h-full tw:cursor-pointer"
            onClick={() => onView?.(item)}
          >
            <AppCard noPadding className={cardClass}>
              <div className="tw:px-3 tw:py-2.5">
                {/* reference no + change qty */}
                <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
                  {renderReference(item._tranRedirect?.path, item.refNo)}
                  <span
                    className={clsx(
                      "tw:shrink-0 tw:text-sm tw:font-semibold tw:whitespace-nowrap",
                      item.direction === "IN"
                        ? "tw:text-green-600"
                        : "tw:text-red-600",
                    )}
                  >
                    {item.direction === "IN" ? "+" : "-"}
                    <DisplayQty
                      qty={Number(item.changeQtyBy) || 0}
                      isLooseQty={false}
                      uom={item.selectedStockUom}
                    />
                  </span>
                </div>

                {/* date + opening → closing */}
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
                    <DisplayQty
                      qty={Number(item.effectiveOldQty) || 0}
                      isLooseQty={false}
                      uom={item.selectedStockUom}
                    />{" "}
                    <span className="tw:text-gray-300">→</span>{" "}
                    <DisplayQty
                      qty={Number(item.effectiveNewQty) || 0}
                      isLooseQty={false}
                      uom={item.selectedStockUom}
                    />
                  </span>
                </div>
              </div>

              <Divider className="tw:my-0!" />

              {/* ledger id + location + type */}
              <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:px-3 tw:py-1.5">
                <span
                  className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-xs tw:text-gray-500"
                  title={item.stockLedgerId}
                >
                  {item.stockLedgerId || "--"}
                </span>

                <span className="tw:flex tw:shrink-0 tw:items-center tw:gap-1.5">
                  {item.location?.name && (
                    <AppBadge
                      variant={
                        item.location.name === "Sellable" ? "success" : "danger"
                      }
                      size="sm"
                    >
                      {item.location.name}
                    </AppBadge>
                  )}
                  <AppBadge
                    variant={item.referenceTypeColor || "light"}
                    size="sm"
                    className="tw:uppercase"
                  >
                    {item.referenceType || "--"}
                  </AppBadge>
                </span>
              </div>
            </AppCard>
          </div>
        ))}
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
