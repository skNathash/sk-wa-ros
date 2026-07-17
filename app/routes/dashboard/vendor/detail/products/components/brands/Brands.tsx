import { useCallback, useRef, useState } from "react";

import { useEffect } from "react";
import type { PaginationState, SortProps } from "~/types/CommonTypes";
import { getData, prepareParams } from "./helper";
import AppButton from "~/components/core/button/AppButton";
import { ExternalLink } from "lucide-react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppCard from "~/components/core/card/AppCard";
import Filter from "./Filter";
import NoData from "~/components/core/no-data/NoData";

type Props = {
  vendorId: string;
  callback?: (params: { action: string; data?: any }) => void;
};

const Brands = ({ vendorId, callback }: Props) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const filterRef = useRef<Record<string, any>>({});

  const sortRef = useRef<SortProps>({
    key: "name",
    value: "asc",
  });

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  useEffect(() => {
    if (!vendorId) return;
    applyFilter();
  }, [vendorId]);

  const applyFilter = useCallback(async () => {
    setLoading(true);
    setData([]);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
    };

    const params = prepareParams(
      filterRef.current,
      paginationRef.current,
      sortRef.current
    );
    const data = await getData(vendorId, params);
    setData(data);
    setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    setLoading(false);
  }, []);

  const clearFilters = useCallback(() => {
    filterRef.current = {};
    applyFilter();
  }, [applyFilter]);

  const refresh = useCallback(() => {
    applyFilter();
  }, [applyFilter]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current
      );
      const data = await getData(vendorId, params);
      setData((prev) => [...prev, ...data]);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  const handleFilterCallback = useCallback(
    (args: { formData: any; action: string }) => {
      filterRef.current = args.formData;
      applyFilter();
    },
    [applyFilter]
  );

  return (
    <>
      <Filter callback={handleFilterCallback} vendorId={vendorId} />

      {loading ? (
        <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
          <AppSpinner />
        </div>
      ) : null}
      {!loading && data.length === 0 ? (
        <NoData />
      ) : (
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
          {data.map((item) => {
            const totalProducts =
              item.totalProducts ??
              item.productCount ??
              item.activeDealCount ??
              0;

            return (
              <AppCard key={item.brandId} className="tw:mb-0">
                <div className="tw:flex tw:justify-between tw:items-center">
                  <div className="tw:flex tw:items-center tw:gap-3">
                    {item.brandImage ? (
                      <img
                        src={item.brandImage}
                        alt={item.brandName}
                        className="tw:w-12 tw:h-12 tw:rounded-lg tw:object-cover tw:border tw:border-gray-200"
                      />
                    ) : (
                      <div className="tw:w-12 tw:h-12 tw:rounded-lg tw:bg-gray-100 tw:border tw:border-gray-200" />
                    )}

                    <div>
                      <div className="tw:text-base tw:font-medium tw:hover:text-blue-500 tw:transition-all tw:duration-300">
                        {item.brandName}
                      </div>
                      <div className="tw:text-xs tw:text-gray-500">
                        {totalProducts} Products
                      </div>
                    </div>
                  </div>

                  <div className="tw:flex tw:items-center">
                    <AppButton
                      fill="outline"
                      color="light"
                      size="small"
                      className="tw:hover:text-blue-500 tw:transition-all tw:duration-300"
                      onClick={() =>
                        callback?.({ action: "view-brands", data: item })
                      }
                    >
                      <ExternalLink />
                      View Details
                    </AppButton>
                  </div>
                </div>
              </AppCard>
            );
          })}
        </div>
      )}
    </>
  );
};

export default Brands;
