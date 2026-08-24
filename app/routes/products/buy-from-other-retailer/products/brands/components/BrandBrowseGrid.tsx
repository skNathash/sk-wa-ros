import { ArrowRight } from "lucide-react";
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

/** Pastel tile tints cycled per card (shown behind the brand image/initial). */
const TILE_TINTS = [
  "tw:bg-emerald-50",
  "tw:bg-rose-50",
  "tw:bg-sky-50",
  "tw:bg-slate-100",
  "tw:bg-violet-50",
  "tw:bg-amber-50",
];

/**
 * Theme-2 "Shop by brands" view — replaces the desktop 3-column
 * brand/category/product layout with a card grid (see BrandGrid for the
 * mobile variant). Each card links to the network product list filtered
 * by that brand.
 */
const BrandBrowseGrid = ({
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
      <div className="tw:grid tw:grid-cols-3 tw:lg:grid-cols-4 tw:xl:grid-cols-6 tw:gap-2 tw:md:gap-4">
        {Array.from({ length: rowsPerPage }).map((_, idx) => (
          <div
            key={`s-${idx}`}
            className="tw:rounded-2xl tw:border tw:border-slate-100 tw:bg-white tw:p-2 tw:md:p-4 tw:shadow-sm"
          >
            <Skeleton className="tw:aspect-square tw:w-full tw:rounded-xl" />
            <Skeleton className="tw:mt-2 tw:md:mt-3 tw:h-4 tw:w-3/4 tw:mx-auto" />
            <Skeleton className="tw:mt-2 tw:h-3 tw:w-1/2 tw:mx-auto" />
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
      <div className="tw:grid tw:grid-cols-3 tw:lg:grid-cols-4 tw:xl:grid-cols-6 tw:gap-2 tw:md:gap-4">
        {items.map((it, idx) => {
          const name = it._displayName || it.name;
          return (
            <AppLink
              key={`${it._id}-${idx}`}
              href={`/products/buy-from-other-retailer/products/list?brandId=${it._id}&brandName=${encodeURIComponent(it.name)}&distance=${distance}`}
              asLink={true}
              noUnderline
              className="tw:group tw:block tw:rounded-2xl tw:border tw:border-slate-100 tw:bg-white tw:p-2 tw:md:p-4 tw:shadow-sm tw:transition-shadow tw:hover:shadow-md"
            >
              <EntityThumb
                assetId={it._displayImg}
                name={name}
                size="300"
                fit="cover"
                boxClassName={`tw:aspect-square tw:w-full tw:rounded-xl ${TILE_TINTS[idx % TILE_TINTS.length]}`}
                initialClassName="tw:text-2xl tw:md:text-4xl"
              />

              <div className="tw:mt-2 tw:md:mt-3 tw:text-center">
                <div className="tw:text-xs tw:md:text-sm tw:font-semibold tw:text-slate-900 tw:line-clamp-1">
                  {name}
                </div>
                <div className="tw:mt-0.5 tw:text-[11px] tw:md:text-xs tw:text-slate-500">
                  {it.dealsCount != null ? `${it.dealsCount} deals` : " "}
                </div>
                <span className="tw:mt-1 tw:md:mt-2 tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:md:text-sm tw:font-medium tw:text-primary tw:group-hover:underline">
                  Browse
                  <ArrowRight size={14} />
                </span>
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

export default BrandBrowseGrid;
