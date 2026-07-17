import { ChevronRight } from "lucide-react";
import React from "react";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import { Skeleton } from "~/components/ui/skeleton";
import type { PaginationState } from "~/types/CommonTypes";
import EntityThumb from "~/components/core/img/EntityThumb";
import { getBrandCategoryIds, getCount, getData, prepareParams } from "./helper";

export type CategoryItem = {
  _id: string;
  name: string;
  _displayImg?: string;
  _displayName?: string;
  dealsCount?: number;
};

type Props = {
  brandId?: string;
  brandName?: string;
  selectedId?: string;
  onSelect: (item: CategoryItem | null) => void;
};

const CategoryList = ({ brandId, brandName, selectedId, onSelect }: Props) => {
  const [items, setItems] = React.useState<CategoryItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [hasMoreData, setHasMoreData] = React.useState(true);

  const categoryIdsRef = React.useRef<string[]>([]);

  const paginationRef = React.useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 20,
    startSlNo: 1,
    endSlNo: 20,
    totalRecords: 0,
  });

  const buildParams = React.useCallback(
    (page: number) =>
      prepareParams(
        { categoryIds: categoryIdsRef.current },
        { ...paginationRef.current, activePage: page },
      ),
    [],
  );

  const applyFilter = React.useCallback(async () => {
    if (!brandId) {
      setItems([]);
      return;
    }
    paginationRef.current = { ...paginationRef.current, activePage: 1 };
    setLoading(true);
    setItems([]);
    try {
      categoryIdsRef.current = await getBrandCategoryIds(brandId);
      if (!categoryIdsRef.current.length) {
        paginationRef.current.totalRecords = 0;
        setItems([]);
        setHasMoreData(false);
        return;
      }
      const params = buildParams(1);
      const [data, count] = await Promise.all([
        getData(params),
        getCount(params),
      ]);
      paginationRef.current.totalRecords = count;
      setItems(data);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoading(false);
    }
  }, [brandId, buildParams]);

  const loadMore = React.useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const data = await getData(buildParams(paginationRef.current.activePage));
      setItems((prev) => [...prev, ...data]);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, buildParams]);

  React.useEffect(() => {
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId]);

  return (
    <div className="tw:bg-white tw:rounded-xl tw:border tw:border-gray-200 tw:shadow-sm tw:flex tw:flex-col tw:h-full tw:overflow-hidden">
      <div className="tw:px-4 tw:py-3 tw:flex tw:items-center tw:justify-between tw:gap-2 tw:border-b tw:border-gray-100">
        <h3 className="tw:text-xs tw:font-semibold tw:text-slate-500 tw:uppercase tw:tracking-wider tw:line-clamp-1">
          {brandName ? `${brandName} Categories` : "Categories"}
        </h3>
        {brandId && !loading && items.length ? (
          <span className="tw:shrink-0 tw:rounded-full tw:bg-gray-100 tw:px-2 tw:py-0.5 tw:text-xs tw:font-medium tw:text-gray-500">
            {items.length}
            {paginationRef.current.totalRecords
              ? ` of ${paginationRef.current.totalRecords}`
              : ""}
          </span>
        ) : null}
      </div>

      <AppScrollArea className="tw:flex-1 tw:min-h-0">
        {!brandId ? (
          <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:h-full tw:gap-1 tw:px-4 tw:py-10 tw:text-center">
            <span className="tw:text-sm tw:font-medium tw:text-gray-500">
              No brand selected
            </span>
            <span className="tw:text-xs tw:text-gray-400">
              Pick a brand to see its categories
            </span>
          </div>
        ) : loading ? (
          <div className="tw:p-2 tw:space-y-1">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="tw:flex tw:items-center tw:gap-3 tw:px-2 tw:py-2"
              >
                <Skeleton className="tw:h-10 tw:w-10 tw:rounded-lg" />
                <div className="tw:flex-1 tw:space-y-1.5">
                  <Skeleton className="tw:h-3 tw:w-2/5" />
                  <Skeleton className="tw:h-2 tw:w-1/5" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <NoData />
        ) : (
          <div className="tw:p-2 tw:space-y-1">
            {items.map((it) => {
              const isSelected = it._id === selectedId;
              return (
                <button
                  key={it._id}
                  type="button"
                  onClick={() => onSelect(isSelected ? null : it)}
                  title={it._displayName || it.name}
                  className={`tw:group tw:relative tw:flex tw:items-center tw:gap-3 tw:px-2.5 tw:py-2 tw:w-full tw:text-left tw:rounded-lg tw:cursor-pointer tw:transition-colors ${
                    isSelected
                      ? "tw:bg-primary/8 tw:ring-1 tw:ring-primary/20"
                      : "tw:hover:bg-gray-50"
                  }`}
                >
                  {isSelected ? (
                    <span className="tw:absolute tw:left-0 tw:top-1.5 tw:bottom-1.5 tw:w-1 tw:rounded-r-full tw:bg-primary" />
                  ) : null}
                  <EntityThumb
                    assetId={it._displayImg}
                    name={it._displayName || it.name}
                    width={100}
                    boxClassName={`tw:h-10 tw:w-10 tw:shrink-0 tw:rounded-lg tw:border ${
                      isSelected
                        ? "tw:border-primary/30"
                        : "tw:border-gray-100"
                    }`}
                  />
                  <div className="tw:flex-1 tw:min-w-0">
                    <span
                      className={`tw:block tw:text-sm tw:font-medium tw:line-clamp-1 ${
                        isSelected ? "tw:text-primary" : "tw:text-gray-800"
                      }`}
                    >
                      {it._displayName || it.name}
                    </span>
                    {it.dealsCount != null ? (
                      <span
                        className={`tw:text-xs ${
                          isSelected ? "tw:text-primary/70" : "tw:text-gray-400"
                        }`}
                      >
                        {it.dealsCount} deals
                      </span>
                    ) : null}
                  </div>
                  <ChevronRight
                    className={`tw:w-4 tw:h-4 tw:shrink-0 tw:transition-colors ${
                      isSelected
                        ? "tw:text-primary"
                        : "tw:text-gray-300 tw:group-hover:text-gray-400"
                    }`}
                  />
                </button>
              );
            })}

            {hasMoreData && items.length && !loading ? (
              <div className="tw:flex tw:justify-center tw:p-2">
                <LoadMoreButton
                  loadMore={loadMore}
                  loading={loadingMore}
                  totalCount={paginationRef.current.totalRecords}
                  loadedCount={items.length}
                />
              </div>
            ) : null}
          </div>
        )}
      </AppScrollArea>
    </div>
  );
};

export default CategoryList;
