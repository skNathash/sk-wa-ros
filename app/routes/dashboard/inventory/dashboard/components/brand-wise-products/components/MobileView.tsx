import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import { Skeleton } from "~/components/ui/skeleton";
import type { BrandValue } from "../../../helper";

type Props = {
  data: BrandValue[];
  loading: boolean;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  showLoadMore: boolean;
  onCountClick: (
    item: BrandValue,
    tab: "fast_moving" | "slow_moving" | "non_moving",
  ) => void;
};

const MobileView = ({
  data,
  loading,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  showLoadMore,
  onCountClick,
}: Props) => {
  if (loading) {
    return (
      <div className="tw:grid tw:grid-cols-1 tw:lg:grid-cols-3 tw:gap-3">
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
      <div className="tw:grid tw:grid-cols-1 tw:lg:grid-cols-3 tw:gap-3">
        {data.map((item, idx) => (
          <AppCard key={idx} noPadding>
            <div className="tw:p-3">
              <div className="tw:font-semibold tw:text-sm tw:mb-1">
                {item.brandName}
              </div>
              {item.brandRefId && (
                <div className="tw:text-xs tw:text-gray-400 tw:mb-1">
                  {item.brandRefId}
                </div>
              )}
              <div className="tw:grid tw:grid-cols-3 tw:gap-2">
                <div>
                  <span className="tw:text-[10px] tw:text-gray-500">Value</span>
                  <div className="tw:text-sm tw:font-semibold">
                    <Amount value={item.value} />
                  </div>
                </div>
                <div>
                  <span className="tw:text-[10px] tw:text-gray-500">Total Products</span>
                  <div className="tw:text-sm">{item.totalProducts || 0}</div>
                </div>
                <div>
                  <span className="tw:text-[10px] tw:text-gray-500">Fast Moving</span>
                  <button
                    type="button"
                    className="tw:block tw:text-sm tw:text-primary tw:font-medium tw:hover:underline tw:cursor-pointer"
                    onClick={() => onCountClick(item, "fast_moving")}
                  >
                    {item.fastCount || 0}
                  </button>
                </div>
                <div>
                  <span className="tw:text-[10px] tw:text-gray-500">Slow Moving</span>
                  <button
                    type="button"
                    className="tw:block tw:text-sm tw:text-primary tw:font-medium tw:hover:underline tw:cursor-pointer"
                    onClick={() => onCountClick(item, "slow_moving")}
                  >
                    {item.slowCount || 0}
                  </button>
                </div>
                <div>
                  <span className="tw:text-[10px] tw:text-gray-500">
                    Non Moving
                  </span>
                  <button
                    type="button"
                    className="tw:block tw:text-sm tw:text-primary tw:font-medium tw:hover:underline tw:cursor-pointer"
                    onClick={() => onCountClick(item, "non_moving")}
                  >
                    {item.nonMovingCount || 0}
                  </button>
                </div>
              </div>
            </div>
          </AppCard>
        ))}
      </div>
      {showLoadMore && (
        <div className="tw:mt-4">
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
