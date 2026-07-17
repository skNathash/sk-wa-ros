import { ChevronRight } from "lucide-react";
import EntityThumb from "~/components/core/img/EntityThumb";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import { Skeleton } from "~/components/ui/skeleton";

export type CategoryItem = {
  _id: string;
  name: string;
  _displayImg?: string;
  _displayName?: string;
  dealsCount?: number;
};

type Props = {
  items: CategoryItem[];
  loading: boolean;
  loadingMore: boolean;
  hasMoreData: boolean;
  totalRecords: number;
  selectedId?: string;
  onSelect: (item: CategoryItem) => void;
  loadMore: () => void;
};

const CategoryListPanel = ({
  items,
  loading,
  loadingMore,
  hasMoreData,
  totalRecords,
  selectedId,
  onSelect,
  loadMore,
}: Props) => {
  return (
    <div className="tw:bg-white tw:rounded-xl tw:border tw:border-gray-200 tw:shadow-sm tw:flex tw:flex-col tw:h-full tw:overflow-hidden">
      <div className="tw:px-4 tw:py-3 tw:flex tw:items-center tw:justify-between tw:border-b tw:border-gray-100">
        <h3 className="tw:text-xs tw:font-semibold tw:text-slate-500 tw:uppercase tw:tracking-wider">
          Categories
        </h3>
        {!loading && items.length ? (
          <span className="tw:text-xs tw:font-medium tw:text-gray-400">
            {items.length}
            {totalRecords ? ` of ${totalRecords}` : ""}
          </span>
        ) : null}
      </div>

      <AppScrollArea className="tw:flex-1 tw:min-h-0">
        {loading ? (
          <div className="tw:p-2 tw:space-y-1">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
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
                  onClick={() => onSelect(it)}
                  title={it._displayName || it.name}
                  className={`tw:group tw:relative tw:flex tw:items-center tw:gap-3 tw:px-2 tw:py-2 tw:w-full tw:text-left tw:rounded-lg tw:cursor-pointer tw:transition-colors ${
                    isSelected ? "tw:bg-primary/10" : "hover:tw:bg-gray-50"
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
                        ? "tw:bg-white tw:border-primary/30"
                        : "tw:bg-gray-50 tw:border-gray-100"
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
                        : "tw:text-gray-300 group-hover:tw:text-gray-400"
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
                  totalCount={totalRecords}
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

export default CategoryListPanel;
