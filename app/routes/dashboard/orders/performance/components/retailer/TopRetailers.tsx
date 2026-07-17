import { useCallback, useEffect, useRef, useState } from "react";
import type { PaginationState } from "~/types/CommonTypes";
import { defaultFilter, prepareParams, getData, getCount } from "./helper";
import AppCard from "~/components/core/card/AppCard";
import KeyValue from "~/components/core/key-value/KeyValue";
import Amount from "~/components/core/amount/Amount";
import AppProgress from "~/components/core/progress/AppProgress";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import AppButton from "~/components/core/button/AppButton";

const TopRetailers = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const filterRef = useRef<any>({
    ...defaultFilter,
  });

  const applyFilter = useCallback(async () => {
    setLoading(true);
    setData([]);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    try {
      const params = prepareParams(filterRef.current, paginationRef.current, {
        key: "date",
        value: "desc",
      });
      const result = await getData(params);
      setData(result || []);
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage
      );
    } catch (e) {
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more handler
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(filterRef.current, paginationRef.current, {
        key: "date",
        value: "desc",
      });
      const result = await getData(params);
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage
      );
    } catch (e) {
      // handle error
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  // Initial load
  useEffect(() => {
    applyFilter();
  }, []);

  return (
    <>
      <AppCard
        title="Top Retailers"
        icon="users"
        noPadding
        headerClassName="tw:p-4 tw:border-b tw:border-gray-200"
      >
        <AppScrollArea className="tw:h-[500px]">
          {data.map((item, index) => (
            <div
              key={item._id}
              className="tw:border-b tw:border-gray-200 tw:p-4"
            >
              <div className="tw:flex tw:gap-4 tw:mb-4">
                <span className="tw:bg-gray-100 tw:text-gray-800 tw:rounded-full tw:p-2 tw:text-xs tw:w-6 tw:h-6 tw:flex tw:items-center tw:justify-center">
                  {index + 1}
                </span>
                <div>
                  <div className="tw:text-sm tw:font-medium">{item.name}</div>
                  <span className="tw:text-xs tw:text-gray-500">
                    ID: {item._id}
                  </span>
                </div>
              </div>

              <div className="tw:grid tw:grid-cols-2 tw:gap-4 tw:mb-2">
                <KeyValue label="Total Spent" size="sm">
                  <Amount
                    value={1000}
                    decimalPlaces={2}
                    className="tw:font-medium"
                  />
                </KeyValue>

                <KeyValue label="Orders" size="sm">
                  <span className="tw:font-medium">10</span>
                </KeyValue>
              </div>

              <div className="tw:flex tw:justify-between tw:gap-2 tw:text-xs tw:text-gray-500 tw:mb-1">
                <span>Coins</span>
                <span>50</span>
              </div>
              <AppProgress value={50} color="success" className="tw:mb-2" />
            </div>
          ))}

          {hasMoreData && !loading && (
            <div className="tw:text-center tw:p-4">
              <AppButton
                onClick={loadMore}
                disabled={loadingMore}
                size="small"
                color="light"
                fill="outline"
              >
                {loadingMore ? "Loading..." : "Load More"}
              </AppButton>
            </div>
          )}
        </AppScrollArea>
      </AppCard>
    </>
  );
};

export default TopRetailers;
