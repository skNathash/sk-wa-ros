import { ArrowRight } from "lucide-react";
import EntityThumb from "~/components/core/img/EntityThumb";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import { Skeleton } from "~/components/ui/skeleton";
import type { CategoryItem } from "./CategoryListPanel";

type Props = {
  items: CategoryItem[];
  loading: boolean;
  loadingMore: boolean;
  hasMoreData: boolean;
  totalRecords: number;
  rowsPerPage: number;
  distance: string;
  loadMore: () => void;
};

/** Pastel tile tints cycled per card (shown behind the category image/initial). */
const TILE_TINTS = [
  "tw:bg-emerald-50",
  "tw:bg-rose-50",
  "tw:bg-sky-50",
  "tw:bg-slate-100",
  "tw:bg-violet-50",
  "tw:bg-amber-50",
];

/**
 * Theme-2 "Browse by category" view — replaces the desktop 3-column
 * menu/category/product layout with a card grid (see CategoryGrid for the
 * mobile variant). Each card links to the network product list filtered by
 * that category. Product count and the Browse action share one flex row.
 */
const CategoryBrowseGrid = ({
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
      <div className="tw:grid tw:grid-cols-2 tw:sm:grid-cols-3 tw:lg:grid-cols-6 tw:gap-2 tw:md:gap-4">
        {Array.from({ length: rowsPerPage }).map((_, idx) => (
          <div
            key={`s-${idx}`}
            className="tw:overflow-hidden tw:rounded-2xl tw:border tw:border-slate-100 tw:bg-white tw:shadow-sm"
          >
            <Skeleton className="tw:aspect-[16/10] tw:w-full" />
            <div className="tw:p-3 tw:md:p-4">
              <Skeleton className="tw:h-4 tw:w-3/4" />
              <Skeleton className="tw:mt-3 tw:h-3 tw:w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <NoData />;
  }

  return (
    <>
      <div className="tw:grid tw:grid-cols-2 tw:sm:grid-cols-3 tw:lg:grid-cols-5 tw:gap-2 tw:md:gap-4">
        {items.map((it, idx) => {
          const name = it._displayName || it.name;
          return (
            <AppLink
              key={`${it._id}-${idx}`}
              href={`/products/buy-from-other-retailer/products/list?categoryId=${it._id}&categoryName=${encodeURIComponent(it.name)}&distance=${distance}`}
              asLink={true}
              noUnderline
              className="tw:group tw:block tw:overflow-hidden tw:rounded-2xl tw:border tw:border-slate-100 tw:bg-white tw:shadow-sm tw:transition-shadow tw:hover:shadow-md"
            >
              {/* Tinted hero — floating white tile with the category image/initial. */}
              <div
                className={`tw:flex tw:items-center tw:justify-center tw:aspect-[16/10] ${TILE_TINTS[idx % TILE_TINTS.length]}`}
              >
                <EntityThumb
                  assetId={it._displayImg}
                  name={name}
                  size="300"
                  fit="cover"
                  boxClassName="tw:h-16 tw:w-16 tw:md:h-20 tw:md:w-20 tw:rounded-2xl tw:bg-white tw:shadow-sm"
                  initialClassName="tw:text-2xl tw:md:text-3xl tw:font-bold"
                />
              </div>

              <div className="tw:p-3 tw:md:p-4">
                <div className="tw:text-sm tw:md:text-base tw:font-semibold tw:text-slate-900 tw:line-clamp-1">
                  {name}
                </div>

                {/* Product count + Browse action on the same row. */}
                <div className="tw:mt-1 tw:flex tw:items-center tw:justify-between tw:gap-2">
                  <span className="tw:text-xs tw:text-slate-500">
                    {it.dealsCount != null ? `${it.dealsCount} products` : " "}
                  </span>
                  <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:font-medium tw:text-primary">
                    Browse
                    <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            </AppLink>
          );
        })}
      </div>

      {hasMoreData && items.length ? (
        <div className="tw:mt-4 tw:flex tw:justify-center">
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

export default CategoryBrowseGrid;
