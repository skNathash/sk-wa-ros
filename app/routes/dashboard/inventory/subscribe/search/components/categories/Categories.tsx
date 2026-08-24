import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import AppButton from "~/components/core/button/AppButton";
import ImgRender from "~/components/core/img/ImgRender";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import type { PaginationState } from "~/types/CommonTypes";
import { getCount, getData, prepareParams } from "./helper";

const defaultPaginationRef: PaginationState = {
  activePage: 1,
  rowsPerPage: 20,
  totalRecords: 0,
  startSlNo: 1,
  endSlNo: 20,
};

type CategoriesProps = {
  onView: (category: { id: string; _id: string; name: string }) => void;
};

/**
 * "View by category" listing — the same shelf the brand view gives, grouped on
 * the catalog head instead of the brand. Picking a tile drops back into the
 * product list filtered to that category.
 */
const Categories: React.FC<CategoriesProps> = ({ onView }) => {
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const alpha = searchParams.get("alpha") || "";

  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setLoadingMore] = useState(false);
  const filterRef = useRef<Record<string, any>>({});
  const paginationRef = useRef<PaginationState>({ ...defaultPaginationRef });

  const applyFilter = async () => {
    setIsLoading(true);
    setItems([]);
    paginationRef.current = { ...paginationRef.current, activePage: 1 };
    const params = prepareParams(filterRef.current, paginationRef.current);
    const count = await getCount(params);
    paginationRef.current = { ...paginationRef.current, totalRecords: count };
    const result = await getData(params);
    setItems(result.data);
    setHasMore(result.data.length < count);
    setIsLoading(false);
  };

  const loadMore = async () => {
    setLoadingMore(true);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: paginationRef.current.activePage + 1,
    };
    const params = prepareParams(filterRef.current, paginationRef.current);
    const result = await getData(params);
    setItems((prev) => [...prev, ...result.data]);
    setHasMore(result.data.length >= paginationRef.current.rowsPerPage);
    setLoadingMore(false);
  };

  useEffect(() => {
    filterRef.current = { search, alpha };
    applyFilter();
  }, [search, alpha]);

  return (
    <div className="tw:w-full">
      <div className="tw:mb-2">
        <PaginationSummary
          paginationConfig={paginationRef.current}
          loadingTotalRecords={isLoading}
          fwSize="sm"
          loadedCount={items.length}
        />
      </div>
      {isLoading && (
        <div className="tw:flex tw:justify-center tw:items-center tw:py-6">
          <AppSpinner />
        </div>
      )}

      {!isLoading && !items.length && <NoData />}

      {!isLoading && items.length > 0 && (
        <div className="tw:grid tw:grid-cols-2 tw:sm:grid-cols-3 tw:md:grid-cols-5 tw:lg:grid-cols-7 tw:gap-3">
          {items.map((item) => {
            const name = item._displayName || item.name;
            return (
              <div
                key={item._id || item.id}
                className="tw:border tw:border-gray-200 tw:rounded-md tw:bg-white tw:flex tw:flex-col tw:overflow-hidden"
              >
                <div className="tw:w-full tw:aspect-square tw:flex tw:items-center tw:justify-center tw:bg-gray-50">
                  {item._displayImg ? (
                    <ImgRender
                      assetId={item._displayImg}
                      className="tw:w-full tw:h-full tw:object-cover"
                    />
                  ) : (
                    <span className="tw:text-xs tw:text-gray-400">
                      No image
                    </span>
                  )}
                </div>
                <div className="tw:p-3 tw:flex tw:flex-col tw:flex-1">
                  <div className="tw:text-sm tw:font-semibold tw:mb-3 tw:line-clamp-2 tw:flex-1">
                    {name}
                  </div>
                  <AppButton
                    size="small"
                    color="primary"
                    onClick={() =>
                      onView({
                        id: item._id,
                        _id: item._id,
                        name,
                      })
                    }
                  >
                    View Deals
                  </AppButton>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {hasMore && !isLoading && (
        <div className="tw:flex tw:justify-center tw:items-center">
          <LoadMoreButton
            loadMore={loadMore}
            loading={isLoadingMore}
            totalCount={paginationRef.current.totalRecords}
            loadedCount={items.length}
          />
        </div>
      )}
    </div>
  );
};

export default Categories;
