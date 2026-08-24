import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import EntityThumb from "~/components/core/img/EntityThumb";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import { Skeleton } from "~/components/ui/skeleton";
import type { BrandItem } from "./BrandList";

type Props = {
  items: BrandItem[];
  loading: boolean;
  loadingMore: boolean;
  hasMoreData: boolean;
  totalRecords: number;
  rowsPerPage: number;
  distance: string;
  loadMore: () => void;
};

const BrandGrid = ({
  items,
  loading,
  loadingMore,
  hasMoreData,
  totalRecords,
  rowsPerPage,
  distance,
  loadMore,
}: Props) => {
  if (loading) {
    return (
      <div className="tw:grid tw:grid-cols-2 tw:sm:grid-cols-3 tw:gap-3">
        {Array.from({ length: rowsPerPage }).map((_, idx) => (
          <AppCard key={`s-${idx}`} className="tw:mb-3">
            <div>
              <Skeleton className="tw:h-28 tw:w-full tw:mb-2" />
              <Skeleton className="tw:h-3 tw:w-full" />
            </div>
          </AppCard>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <NoData />;
  }

  return (
    <>
      <div className="tw:grid tw:grid-cols-2 tw:sm:grid-cols-3 tw:gap-3">
        {items.map((it, idx) => (
          <AppCard
            key={`${it._id}-${idx}`}
            className="tw:overflow-hidden"
            noPadding
          >
            <div className="tw:flex tw:flex-col">
              <div className="tw:relative">
                <EntityThumb
                  assetId={it._displayImg}
                  name={it._displayName || it.name}
                  size="300"
                  fit="cover"
                  boxClassName="tw:w-full tw:h-28 tw:bg-gray-100"
                  initialClassName="tw:text-3xl"
                />
              </div>

              <div className="tw:p-3 tw:pt-3">
                <div className="tw:h-14 tw:flex tw:items-center">
                  <div className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:line-clamp-2">
                    {it._displayName || it.name}
                  </div>
                </div>
                {it.dealsCount != null ? (
                  <div className="tw:text-xs tw:text-gray-500 tw:mt-0.5 tw:line-clamp-2">
                    {it.dealsCount} deals
                  </div>
                ) : null}
                <div className="tw:mt-3 tw:flex tw:justify-center">
                  <AppLink
                    href={`/products/buy-from-other-retailer/products/list?brandId=${it._id}&brandName=${encodeURIComponent(it.name)}&distance=${distance}`}
                    asLink={true}
                    noUnderline
                    className="tw:w-full"
                  >
                    <AppButton size="small" className="tw:w-full">
                      View
                    </AppButton>
                  </AppLink>
                </div>
              </div>
            </div>
          </AppCard>
        ))}
      </div>

      {hasMoreData && items.length ? (
        <div className="tw:flex tw:justify-center tw:mt-2">
          <LoadMoreButton
            loadMore={loadMore}
            loading={loadingMore}
            totalCount={totalRecords}
            loadedCount={items.length}
          />
        </div>
      ) : null}
    </>
  );
};

export default BrandGrid;
