import { SearchIcon } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import { AppInput } from "~/components/core/form";
import EntityThumb from "~/components/core/img/EntityThumb";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import { Skeleton } from "~/components/ui/skeleton";
import { DEFAULT_BROWSE_DISTANCE } from "~/constants";
import type { PaginationState } from "~/types/CommonTypes";
import { getCount, getData, prepareParams } from "./helper";

type Props = {
  brandId: string;
  brandName?: string;
  distance?: number | string;
};

const Categories = ({
  brandId,
  brandName = "",
  distance = DEFAULT_BROWSE_DISTANCE,
}: Props) => {
  const { register, getValues, setValue } = useForm({
    defaultValues: { search: "" },
  });

  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [hasMoreData, setHasMoreData] = React.useState(true);

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
        { brandId, search: getValues().search, distance },
        { ...paginationRef.current, activePage: page },
      ),
    [brandId, distance, getValues],
  );

  const applyFilter = React.useCallback(async () => {
    paginationRef.current = { ...paginationRef.current, activePage: 1 };
    setLoading(true);
    setItems([]);
    try {
      const params = buildParams(1);
      const [data, count] = await Promise.all([
        getData(params),
        getCount(params),
      ]);
      paginationRef.current.totalRecords = count;
      setItems(data);
      setHasMoreData(data.length > 0 && data.length < count);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  const loadMore = React.useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const data = await getData(buildParams(paginationRef.current.activePage));
      setItems((prev) => {
        const next = [...prev, ...data];
        setHasMoreData(
          data.length > 0 && next.length < paginationRef.current.totalRecords,
        );
        return next;
      });
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, buildParams]);

  React.useEffect(() => {
    setValue("search", "");
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId, distance]);

  const handleSearch = useDebouncedCallback(() => {
    applyFilter();
  }, 500);

  return (
    <div>
      <div className="tw:mb-3">
        <AppInput
          name="search"
          placeholder="Search category"
          register={register}
          className="tw:w-full"
          onChange={() => handleSearch()}
          leftIcon={<SearchIcon className="tw:text-gray-500" />}
        />
      </div>

      <PaginationSummary
        paginationConfig={paginationRef.current}
        loadingTotalRecords={loading}
        loadedCount={items.length}
        fwSize="sm"
        className="tw:mb-4"
      />

      {loading ? (
        <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-7 tw:gap-3">
          {Array.from({ length: paginationRef.current.rowsPerPage }).map(
            (_, idx) => (
              <AppCard key={`s-${idx}`} className="tw:mb-3">
                <div>
                  <Skeleton className="tw:h-28 tw:w-full tw:mb-2" />
                  <Skeleton className="tw:h-3 tw:w-full" />
                </div>
              </AppCard>
            ),
          )}
        </div>
      ) : items.length === 0 ? (
        <NoData />
      ) : (
        <>
          <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-7 tw:gap-3">
            {items.map((it, idx) => (
              <AppCard
                key={`${it._id}-${idx}`}
                className="tw:overflow-hidden"
                noPadding
              >
                <div className="tw:flex tw:flex-col">
                  <EntityThumb
                    assetId={it._displayImg}
                    name={it._displayName || it.name}
                    size="300"
                    fit="cover"
                    boxClassName="tw:w-full tw:h-28 tw:bg-gray-100"
                    initialClassName="tw:text-3xl"
                  />

                  <div className="tw:p-3">
                    <div className="tw:h-14 tw:flex tw:items-center">
                      <div className="tw:text-sm tw:md:text-base tw:font-semibold tw:text-gray-900 tw:line-clamp-2">
                        {it._displayName || it.name}
                      </div>
                    </div>
                    <div className="tw:text-xs tw:text-gray-500 tw:mt-0.5 tw:line-clamp-2">
                      {it.dealsCount} deals
                    </div>
                    <div className="tw:mt-3 tw:flex tw:justify-center">
                      <AppLink
                        href={`/products/buy-from-other-retailer/products/list?brandId=${brandId}&brandName=${encodeURIComponent(
                          brandName,
                        )}&categoryId=${it._id}&categoryName=${encodeURIComponent(
                          it.name,
                        )}&distance=${distance}`}
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

          {hasMoreData && items.length && !loading ? (
            <div className="tw:flex tw:justify-center tw:mt-2">
              <LoadMoreButton
                loadMore={loadMore}
                loading={loadingMore}
                totalCount={paginationRef.current.totalRecords}
                loadedCount={items.length}
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};

export default Categories;
