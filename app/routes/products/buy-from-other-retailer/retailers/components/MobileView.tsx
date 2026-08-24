import React from "react";
import { Star, Navigation } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import AppLink from "~/components/core/link/AppLink";
import Amount from "~/components/core/amount/Amount";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import { Skeleton } from "~/components/ui/skeleton";

interface MobileViewProps {
  data: any[];
  callback: (action: { action: string; data: any }) => void;
  loading: boolean;
  showLoadMore: boolean;
  loadedCount: number;
  loadingMore: boolean;
  loadMore: () => void;
  totalCount: number;
}

const MobileView: React.FC<MobileViewProps> = ({
  data,
  callback,
  loading = false,
  showLoadMore = false,
  loadedCount = 0,
  loadingMore = false,
  loadMore,
  totalCount = 0,
}) => {
  if (loading && (!data || data.length === 0)) {
    return (
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <AppCard
            key={idx}
            noPadding
            className="tw:mb-0 tw:border-l-4 tw:border-l-primary"
          >
            <div className="tw:p-2">
              <div className="tw:flex tw:gap-2.5">
                <Skeleton className="tw:w-9 tw:h-9 tw:rounded-full tw:shrink-0" />
                <div className="tw:flex-1 tw:min-w-0">
                  <div className="tw:flex tw:items-start tw:justify-between tw:gap-2">
                    <div className="tw:min-w-0 tw:flex-1">
                      <Skeleton className="tw:h-3.5 tw:w-2/3" />
                      <Skeleton className="tw:h-2.5 tw:w-4/5 tw:mt-1.5" />
                    </div>
                    <div className="tw:shrink-0 tw:flex tw:flex-col tw:items-end tw:gap-1">
                      <Skeleton className="tw:h-3.5 tw:w-10" />
                      <Skeleton className="tw:h-2.5 tw:w-6" />
                    </div>
                  </div>
                  <div className="tw:mt-2">
                    <Skeleton className="tw:h-1.5 tw:w-full tw:rounded-full" />
                    <div className="tw:flex tw:items-center tw:justify-between tw:mt-1.5">
                      <Skeleton className="tw:h-2.5 tw:w-16" />
                      <Skeleton className="tw:h-2.5 tw:w-6" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AppCard>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0)
    return (
      <div className="tw:w-full tw:text-center tw:py-6">
        <div className="tw:text-lg tw:font-semibold tw:text-gray-800">
          No retailers found
        </div>
        <div className="tw:text-sm tw:text-gray-500 tw:mt-1">
          Try adjusting filters or search to broaden results
        </div>
      </div>
    );

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-3">
        {data.map((item, idx) => {
          const paylater = item.paylaterInfo;

          return (
          <AppCard
            key={idx}
            noPadding
            className="tw:mb-0 tw:border-l-4 tw:border-l-primary"
          >
            <div className="tw:p-2">
              <div className="tw:flex tw:gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    callback({ action: "viewImages", data: item })
                  }
                  className="tw:shrink-0 tw:rounded-full tw:focus:outline-none"
                >
                  {item.shopImg ? (
                    <ImgRender
                      assetId={item.shopImg}
                      className="tw:w-9 tw:h-9 tw:rounded-full tw:object-cover"
                    />
                  ) : (
                    <div className="tw:w-9 tw:h-9 tw:rounded-full tw:bg-teal-500 tw:flex tw:items-center tw:justify-center tw:text-white tw:font-bold tw:text-xs">
                      {(item.name || "A").charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>

                <div className="tw:flex-1 tw:min-w-0">
                  <div className="tw:flex tw:items-start tw:justify-between tw:gap-2">
                    <div className="tw:min-w-0">
                      <AppLink
                        href={`/products/buy-from-other-retailer/retailer/${item._id}`}
                        asLink
                        className="tw:block tw:font-bold tw:text-sm tw:leading-tight tw:line-clamp-1 tw:text-slate-900"
                      >
                        {item.name}
                      </AppLink>
                      <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-x-1 tw:gap-y-0.5 tw:mt-0.5 tw:text-[11px] tw:text-gray-500">
                        <span className="tw:truncate">
                          {item.city || item.town || item.district || "-"}
                        </span>
                        <span>•</span>
                        <span>{item.displayType?.name || "Prepaid"}</span>
                        {item.distanceToFranchiseKm != null && (
                          <>
                            <span>•</span>
                            <span className="tw:flex tw:items-center tw:gap-0.5 tw:whitespace-nowrap tw:shrink-0">
                              <Navigation
                                size={9}
                                className="tw:text-gray-500"
                              />
                              {item.distanceToFranchiseKm.toFixed(1)}km
                            </span>
                          </>
                        )}
                        {item.ratingsSummary?.avgRating != null && (
                          <>
                            <span>•</span>
                            <span className="tw:flex tw:items-center tw:gap-0.5">
                              <Star
                                size={9}
                                className="tw:fill-amber-400 tw:text-amber-400"
                              />
                              {item.ratingsSummary.avgRating.toFixed(1)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {paylater && (
                      <div className="tw:shrink-0 tw:text-right">
                        <Amount
                          value={paylater.totalPayableAmount || 0}
                          decimalPlaces={0}
                          className="tw:text-sm tw:font-bold tw:text-gray-900 tw:leading-tight"
                        />
                        <span className="tw:block tw:text-[10px] tw:text-gray-500">
                          owe
                        </span>
                      </div>
                    )}
                  </div>

                  {paylater && (
                    <div className="tw:mt-2">
                      <div className="tw:h-1.5 tw:w-full tw:overflow-hidden tw:rounded-full tw:bg-[#e5dfd6]">
                        <div
                          className="tw:h-full tw:rounded-full tw:bg-[#c8a87d]"
                          style={{ width: `${paylater.usedPct}%` }}
                        />
                      </div>
                      <div className="tw:flex tw:items-center tw:justify-between tw:mt-1 tw:text-[10px] tw:text-gray-500">
                        <span className="tw:flex tw:items-center tw:gap-0.5">
                          <Amount
                            value={paylater.totalAmountUsed || 0}
                            decimalPlaces={0}
                          />
                          {" / "}
                          <Amount
                            value={paylater.creditLimit || 0}
                            decimalPlaces={0}
                          />
                        </span>
                        <span>{paylater.usedPct}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </AppCard>
          );
        })}
      </div>

      {showLoadMore && (
        <div className="tw:mt-4 tw:flex tw:justify-center">
          <LoadMoreButton
            loadMore={loadMore}
            loading={loadingMore}
            totalCount={totalCount || 0}
            loadedCount={loadedCount || 0}
          />
        </div>
      )}
    </>
  );
};

export default MobileView;
