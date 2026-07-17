import { useEffect, useRef, useState } from "react";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import ImgRender from "~/components/core/img/ImgRender";
import type {
  BreadcrumbItem,
  PaginationState,
  SortProps,
} from "~/types/CommonTypes";
import Filter from "./components/Filter";
import { getCount, getData, prepareParams } from "./helper";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import NoData from "~/components/core/no-data/NoData";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    redirect: {
      path: "/dashboard",
    },
  },
  {
    label: "Brands",
  },
];

const BrandList = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 30,
    startSlNo: 1,
    endSlNo: 30,
    totalRecords: 0,
  });

  const filterRef = useRef<Record<string, any>>({});
  const sortRef = useRef<SortProps>({
    key: "_id.brandName",
    value: "asc",
  });

  useEffect(() => {
    applyFilter();
  }, []);

  const applyFilter = async () => {
    setLoading(true);
    setData([]);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };

    const params = prepareParams(
      filterRef.current,
      paginationRef.current,
      sortRef.current
    );
    const result = await getData(params);
    setData(result || []);

    const totalRecords = await getCount(params);
    paginationRef.current.totalRecords = totalRecords;

    setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    setLoading(false);
  };

  const loadMore = async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    // advance page
    paginationRef.current = {
      ...paginationRef.current,
      activePage: paginationRef.current.activePage + 1,
    };

    try {
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current
      );
      const result = await getData(params);
      setData((prev) => [...prev, ...result]);
      setHasMoreData(result?.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      // swallow - keep previous data
    } finally {
      setLoadingMore(false);
    }
  };

  const handleFilterChange = (data: any) => {
    filterRef.current = {
      ...filterRef.current,
      ...data.formData,
    };
    applyFilter();
  };

  return (
    <>
      <AppHeader title="Brands" />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} className="tw:mb-4" />
          <AppCard title="Brands">
            <Filter callback={handleFilterChange} />
            {loading ? (
              <div className="tw:flex tw:justify-center tw:mt-4">
                <AppSpinner />
              </div>
            ) : null}

            {!loading && data.length === 0 ? (
              <div className="tw:text-center tw:py-4">
                <NoData />
              </div>
            ) : null}

            <PaginationSummary
              paginationConfig={paginationRef.current}
              loadingTotalRecords={loading}
              loadedCount={data.length}
              fwSize="sm"
              className="tw:mb-4"
            />

            <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
              {data.map((item) => (
                <div className="tw:border tw:rounded-md tw:p-2 tw:flex tw:gap-2 tw:items-center tw:cursor-pointer tw:hover:shadow-md">
                  <div>
                    <ImgRender
                      assetId={item._displayImg}
                      className="tw:w-16 tw:h-16 tw:object-cover tw:rounded"
                    />
                  </div>
                  <div className="tw:flex-1">
                    <div className="tw:text-sm tw:font-semibold tw:mb-1">
                      {item.name}
                    </div>
                    <div className="tw:text-xs tw:text-gray-500 tw:mb-1">
                      ID: {item._id || "--"}
                    </div>
                    <div className="tw:text-xs tw:text-gray-500">
                      {item._raw?.totalDeals || 0} Deals
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {hasMoreData && !loading && (
              <div className="tw:flex tw:justify-center tw:mt-4">
                <AppButton
                  onClick={loadMore}
                  disabled={loadingMore}
                  size="small"
                  color="light"
                  fill="outline"
                >
                  Load More ({data.length}/{paginationRef.current.totalRecords})
                </AppButton>
              </div>
            )}
          </AppCard>
        </div>
      </div>
    </>
  );
};

export default BrandList;
