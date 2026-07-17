import { ChevronRight } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppPopover from "~/components/core/popover/AppPopover";
import DealSummaryPopover from "~/components/feature/inventory/popover/deal-sales-summary/DealSummaryPopover";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";
import { Skeleton } from "~/components/ui/skeleton";
import { isLooseStockUom, type FastMovingProduct } from "../../../helper";
import type { SkuMovementType } from "../helper";
import { getPeriods } from "./DesktopView";

type Props = {
  data: FastMovingProduct[];
  loading: boolean;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  showLoadMore: boolean;
  callback: (args: { action: string; data?: any }) => void;
  type?: SkuMovementType;
};

const MobileView = ({
  data,
  loading,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  showLoadMore,
  callback,
  type,
}: Props) => {
  // Last Order is hidden for the Non Moving tab.
  const showOrder = type !== "NON_MOVING";
  // Slow Moving surfaces the longer 45/60/90-day windows.
  const periods = getPeriods(type);
  if (loading) {
    return (
      <div className="tw:grid tw:grid-cols-1 tw:lg:grid-cols-3 tw:gap-2">
        {Array.from({ length: 5 }).map((_, idx) => (
          <AppCard key={`skeleton-${idx}`} noPadding>
            <div className="tw:p-3">
              <Skeleton className="tw:w-full tw:h-16" />
            </div>
          </AppCard>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <AppCard>
        <NoData />
      </AppCard>
    );
  }

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:lg:grid-cols-3 tw:gap-2">
        {data.map((p, idx) => (
          <AppCard
            key={idx}
            noPadding
            className="tw:h-full"
            bodyClassName="tw:flex tw:flex-col tw:h-full"
          >
            {/* Header */}
            <div className="tw:px-4 tw:py-3">
              <div className="tw:flex tw:items-start tw:gap-2">
                <span className="tw:text-xs tw:text-gray-400 tw:mt-0.5">#{idx + 1}</span>
                <div className="tw:flex-1 tw:min-w-0">
                  <AppLink
                    asLink
                    href={`/dashboard/inventory/products/view/${p.dealId}`}
                  >
                    <span className="tw:block tw:font-semibold tw:text-sm tw:line-clamp-2 tw:min-h-10">
                      {p.dealName}
                    </span>
                  </AppLink>
                  {p.dealRefId && (
                    <div className="tw:text-xs tw:text-gray-400 tw:mt-0.5">
                      {p.dealRefId}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="tw:border-t tw:border-gray-100" />

            {/* Details */}
            <div className="tw:px-4 tw:py-3 tw:space-y-2">
              <div className="tw:flex tw:justify-between tw:items-center">
                <span className="tw:text-xs tw:text-gray-500">Qty Sold</span>
                <div className="tw:flex tw:items-center tw:gap-2 tw:text-xs">
                  {periods.slice(0, -1).map((days) => (
                    <span
                      key={days}
                      className="tw:inline-flex tw:items-center tw:gap-1"
                    >
                      <span className="tw:text-gray-500">{days}d</span>
                      <span className="tw:font-semibold">
                        {(p.salesAnalytics as any)?.[`last${days}Days`]
                          ?.quantity ?? 0}
                      </span>
                    </span>
                  ))}
                  <AppPopover
                    triggerContent={
                      <span className="tw:inline-flex tw:items-center tw:gap-1 tw:cursor-pointer">
                        <span className="tw:text-gray-500">
                          {periods[periods.length - 1]}d
                        </span>
                        <span className="tw:font-semibold">
                          {(p.salesAnalytics as any)?.[
                            `last${periods[periods.length - 1]}Days`
                          ]?.quantity ?? 0}
                        </span>
                        <span className="tw:inline-flex tw:items-center tw:gap-0.5 tw:text-[10px] tw:text-slate-400">
                          More
                          <ChevronRight size={10} />
                        </span>
                      </span>
                    }
                  >
                    <DealSummaryPopover salesAnalytics={p.salesAnalytics as any} />
                  </AppPopover>
                </div>
              </div>
              <div className="tw:flex tw:justify-between tw:items-center">
                <span className="tw:text-xs tw:text-gray-500">Sales Value</span>
                <span className="tw:text-xs tw:font-semibold">
                  <Amount value={p.revenue} />
                </span>
              </div>
              {showOrder && (
                <div className="tw:flex tw:justify-between tw:items-center">
                  <span className="tw:text-xs tw:text-gray-500">Last Order</span>
                  {p.lastOrderDate ? (
                    <span className="tw:flex tw:items-center tw:gap-2 tw:text-xs">
                      <DateFormat
                        value={p.lastOrderDate}
                        formatStr="dd MMM yyyy"
                        className="tw:font-semibold tw:text-slate-700"
                      />
                      <span className="tw:font-semibold">
                        <Amount value={p.lastOrderValue ?? 0} />
                      </span>
                    </span>
                  ) : (
                    <span className="tw:text-xs tw:text-gray-400">-</span>
                  )}
                </div>
              )}
              <div className="tw:flex tw:justify-between tw:items-center">
                <span className="tw:text-xs tw:text-gray-500">Current Stock</span>
                <span className="tw:text-sm tw:font-medium">
                  <DisplayQty
                    qty={p.availableQuantity ?? 0}
                    isLooseQty={isLooseStockUom(p.selectedStockUom)}
                  />
                </span>
              </div>
              <div className="tw:flex tw:justify-between tw:items-center">
                <span className="tw:text-xs tw:text-gray-500">Menu</span>
                <span className="tw:text-xs">{p.menuName}</span>
              </div>
              <div className="tw:flex tw:justify-between tw:items-center">
                <span className="tw:text-xs tw:text-gray-500">Category</span>
                <span className="tw:text-xs">{p.categoryName}</span>
              </div>
              <div className="tw:flex tw:justify-between tw:items-center">
                <span className="tw:text-xs tw:text-gray-500">Brand</span>
                <span className="tw:text-xs">{p.brandName}</span>
              </div>
            </div>
          </AppCard>
        ))}
      </div>
      {showLoadMore && (
        <div className="tw:mt-3">
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
