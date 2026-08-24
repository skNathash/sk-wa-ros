import { ChevronRight } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppPopover from "~/components/core/popover/AppPopover";
import { Skeleton } from "~/components/ui/skeleton";
import DealSummaryPopover from "~/components/feature/inventory/popover/deal-sales-summary/DealSummaryPopover";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";
import type { InventoryRiskRow, InventoryRiskType } from "../helper";

type Props = {
  data: InventoryRiskRow[];
  loading: boolean;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  showLoadMore: boolean;
  callback: (args: { action: string; data?: any }) => void;
  type?: InventoryRiskType;
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
            key={p._key}
            noPadding
            className="tw:h-full"
            bodyClassName="tw:flex tw:flex-col tw:h-full"
          >
            {/* Header */}
            <div className="tw:px-4 tw:py-3">
              <div className="tw:flex tw:items-start tw:gap-2">
                <span className="tw:text-xs tw:text-gray-400 tw:mt-0.5">
                  #{idx + 1}
                </span>
                <div className="tw:flex-1 tw:min-w-0">
                  <AppLink
                    asLink
                    href={`/dashboard/inventory/products/view/${p.dealId}`}
                  >
                    <span className="tw:block tw:font-semibold tw:text-sm tw:line-clamp-2 tw:min-h-10">
                      {p.dealName}
                    </span>
                  </AppLink>
                  <div className="tw:text-xs tw:text-gray-500">
                    {p.dealRefId}
                  </div>
                </div>
              </div>
            </div>

            <div className="tw:border-t tw:border-gray-100" />

            {/* Details */}
            <div className="tw:px-4 tw:py-3 tw:space-y-2 tw:flex-1">
              {type !== "expiryRisk" && (
                <div className="tw:flex tw:justify-between tw:items-center">
                  <span className="tw:text-xs tw:text-gray-500">Qty Sold</span>
                  <div className="tw:flex tw:items-center tw:gap-2 tw:text-xs">
                    <span className="tw:text-gray-500">7d</span>
                    <span className="tw:font-semibold">{p._sales7Qty}</span>
                    <span className="tw:text-gray-500">15d</span>
                    <span className="tw:font-semibold">{p._sales15Qty}</span>
                    <AppPopover
                      triggerContent={
                        <span className="tw:inline-flex tw:items-center tw:gap-1 tw:cursor-pointer">
                          <span className="tw:text-gray-500">30d</span>
                          <span className="tw:font-semibold">
                            {p._sales30Qty}
                          </span>
                          <span className="tw:inline-flex tw:items-center tw:gap-0.5 tw:text-[10px] tw:text-slate-400">
                            More
                            <ChevronRight size={10} />
                          </span>
                        </span>
                      }
                    >
                      <DealSummaryPopover
                        salesAnalytics={p.salesAnalytics as any}
                      />
                    </AppPopover>
                  </div>
                </div>
              )}
              {type !== "expiryRisk" && (
                <div className="tw:flex tw:justify-between tw:items-center">
                  <span className="tw:text-xs tw:text-gray-500">
                    Sales Value
                  </span>
                  <span className="tw:text-xs tw:font-semibold">
                    <Amount value={p._sales30Value} />
                  </span>
                </div>
              )}
              {type !== "reserve" && type !== "expiryRisk" && (
                <div className="tw:flex tw:justify-between tw:items-center">
                  <span className="tw:text-xs tw:text-gray-500">
                    Last Order
                  </span>
                  {p.lastOrderDate ? (
                    <span className="tw:flex tw:items-center tw:gap-2 tw:text-xs">
                      <DateFormat
                        value={p.lastOrderDate}
                        formatStr="dd MMM yyyy"
                        className="tw:font-semibold tw:text-slate-700"
                      />
                      <span className="tw:font-semibold">
                        <Amount value={p._lastOrderValue} />
                      </span>
                    </span>
                  ) : (
                    <span className="tw:text-xs tw:text-gray-400">-</span>
                  )}
                </div>
              )}
              <div className="tw:flex tw:justify-between tw:items-center">
                <span className="tw:text-xs tw:text-gray-500">
                  {type === "reserve" ? "Reserve Qty Used" : "Stock Qty"}
                </span>
                {type === "reserve" ? (
                  <span className="tw:text-sm tw:font-medium tw:text-amber-700">
                    {p._reserveQtyLabel}
                  </span>
                ) : (
                  <span className="tw:text-sm tw:font-medium">
                    <DisplayQty qty={p._stockQty} isLooseQty={p._isLooseQty} />
                  </span>
                )}
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

            <div className="tw:border-t tw:border-gray-100" />

            <div className="tw:px-4 tw:py-3">
              <AppButton
                size="small"
                color="primary"
                noShadow
                className="tw:w-full"
                onClick={() =>
                  callback({
                    action: "buyNow",
                    data: { dealId: p.dealId },
                  })
                }
              >
                Buy Now
              </AppButton>
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
