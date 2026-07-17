import { useCallback, useEffect, useRef, useState } from "react";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import AppLink from "~/components/core/link/AppLink";
import ImgRender from "~/components/core/img/ImgRender";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import { Skeleton } from "~/components/ui/skeleton";
import type { PaginationState } from "~/types/CommonTypes";
import { prepareParams, getData, getCount } from "./helper";
import { useForm } from "react-hook-form";
import { debounce } from "lodash";
import { AppInput } from "~/components/core/form";
import { SearchIcon } from "lucide-react";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import Alpha from "~/components/core/alpha/Alpha";
import { useSearchParams } from "react-router";

const defaultPagination: PaginationState = {
  activePage: 1,
  rowsPerPage: 10,
  startSlNo: 1,
  endSlNo: 10,
  totalRecords: 0,
};

const Brands = () => {
  const { register, getValues, setValue } = useForm({
    defaultValues: {
      search: "",
      alpha: "",
    },
  });

  const [searchParams, setSearchParams] = useSearchParams();

  const alpha = searchParams.get("alpha") || "";

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const paginationRef = useRef<PaginationState>({ ...defaultPagination });

  const applyFilter = useCallback(async () => {
    paginationRef.current = { ...defaultPagination };
    setLoading(true);
    setItems([]);
    try {
      const params = prepareParams(getValues(), paginationRef.current);
      const res = await getData(params);
      const data = res?.data || [];

      const count = await getCount(params);
      paginationRef.current.totalRecords = count;

      setItems(data);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoading(false);
    }
  }, [getValues]);

  useEffect(() => {
    const search = searchParams.get("search") || "";
    const alpha = searchParams.get("alpha") || "";
    setValue("search", search);
    setValue("alpha", alpha);

    paginationRef.current = { ...defaultPagination };
    applyFilter();
  }, [searchParams]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(getValues(), paginationRef.current);
      const res = await getData(params);
      const data = res?.data || [];
      setItems((prev) => [...prev, ...data]);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, getValues]);

  const handleFilterChange = (params: Record<string, any> = {}) => {
    const formData = getValues();
    setSearchParams(
      {
        ...formData,
        ...params,
      },
      { replace: true }
    );
  };

  const handleSearch = debounce(() => {
    const vals = getValues();
    // If user starts typing, clear any selected alpha
    if (vals.alpha) {
      setValue("alpha", "");
      handleFilterChange({ alpha: "" });
      return;
    }

    handleFilterChange();
  }, 500);

  const handleAlphaChange = (alpha: string) => {
    const vals = getValues();
    // Clear search input when alpha is selected
    if (alpha && vals.search) {
      setValue("search", "");
      handleFilterChange({ alpha, search: "" });
      return;
    }

    handleFilterChange({ alpha });
  };

  return (
    <>
      <div className="tw:mb-2">
        <AppInput
          name="search"
          placeholder="Search"
          register={register}
          className="tw:w-full tw:mb-2"
          onChange={handleSearch}
          leftIcon={<SearchIcon className="tw:text-gray-500" />}
        />
        <Alpha
          selected={alpha}
          callback={handleAlphaChange}
          className="tw:w-full"
        />
      </div>

      <PaginationSummary
        paginationConfig={paginationRef.current}
        loadingTotalRecords={loading}
        loadedCount={items.length}
        fwSize="sm"
        className="tw:mb-4"
      />

      <div>
        {loading ? (
          <div className="tw:grid tw:grid-cols-2 tw:sm:grid-cols-3 tw:md:grid-cols-8 tw:gap-3">
            {Array.from({ length: paginationRef.current.rowsPerPage }).map(
              (_, idx) => (
                <AppCard key={`s-${idx}`} className="tw:mb-3">
                  <div>
                    <Skeleton className="tw:h-28 tw:w-full tw:mb-2" />
                    <Skeleton className="tw:h-3 tw:w-full" />
                  </div>
                </AppCard>
              )
            )}
          </div>
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
                    <div className="tw:relative">
                      <div className="tw:w-full tw:h-28 tw:bg-gray-100 tw:overflow-hidden">
                        {it._displayImg ? (
                          <ImgRender
                            assetId={it._displayImg}
                            alt={it.name}
                            className="tw:w-full tw:h-full tw:object-cover tw:block"
                            size="300"
                          />
                        ) : null}
                      </div>
                    </div>

                    <div className="tw:p-3 tw:pt-3">
                      <div className="tw:h-14 tw:flex tw:items-center">
                        <div className="tw:text-sm tw:md:text-base tw:font-semibold tw:text-gray-900 tw:line-clamp-2">
                          {it._displayName}
                        </div>
                      </div>
                      <div className="tw:text-xs tw:text-gray-500 tw:mt-0.5 tw:line-clamp-2">
                        {it.dealsCount} deals
                      </div>
                      <div className="tw:mt-3 tw:flex tw:justify-center">
                        <AppLink
                          href={`/dashboard/inventory/products/list?tab=products&brandId=${
                            it._id
                          }&brandName=${encodeURIComponent(it.name)}`}
                          asLink={true}
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

            {!loading && items.length === 0 ? <NoData /> : null}

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
    </>
  );
};

export default Brands;
