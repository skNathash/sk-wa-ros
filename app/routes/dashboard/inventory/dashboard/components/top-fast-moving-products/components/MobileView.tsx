import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import { Skeleton } from "~/components/ui/skeleton";
import type { FastMovingProduct } from "../../../helper";

type Props = {
  data: FastMovingProduct[];
  loading: boolean;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  showLoadMore: boolean;
  callback: (args: { action: string; data?: any }) => void;
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
          <AppCard key={idx} noPadding>
            {/* Header */}
            <div className="tw:px-4 tw:py-3">
              <div className="tw:flex tw:items-start tw:gap-2">
                <span className="tw:text-xs tw:text-gray-400 tw:mt-0.5">#{idx + 1}</span>
                <div className="tw:flex-1 tw:min-w-0">
                  <AppLink
                    asLink
                    href={`/dashboard/inventory/products/view/${p.dealId}`}
                  >
                    <span className="tw:font-semibold tw:text-sm tw:line-clamp-2">
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
                <span className="tw:text-sm tw:font-medium">{p.totalQty}</span>
              </div>
              <div className="tw:flex tw:justify-between tw:items-center">
                <span className="tw:text-xs tw:text-gray-500">Sales Value</span>
                <span className="tw:text-xs tw:font-semibold">
                  <Amount value={p.revenue} />
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
