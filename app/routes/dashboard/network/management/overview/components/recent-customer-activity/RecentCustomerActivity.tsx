import { useCallback, useEffect, useRef, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import type { PaginationState } from "~/types/CommonTypes";
import { getData, getCount, prepareParams } from "./helper";
import AppLink from "~/components/core/link/AppLink";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import AppButton from "~/components/core/button/AppButton";

const RecentCustomerActivity = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const filterRef = useRef<Record<string, any>>({});
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    endSlNo: 10,
    rowsPerPage: 10,
    startSlNo: 1,
    totalRecords: 0,
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
      const params = prepareParams(filterRef.current, paginationRef.current);
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
      const params = prepareParams(filterRef.current, paginationRef.current);
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
    <AppCard
      title="Recent B2C Activity"
      icon="users"
      iconClassName="tw:text-orange-500"
    >
      <AppScrollArea className="tw:h-[400px]">
        {data.map((item) => (
          <div
            className="tw:bg-gray-50 tw:p-4 tw:rounded-lg tw:flex tw:justify-between tw:mb-4"
            key={item._id}
          >
            <div>
              <div>
                <AppLink>{item.customerInfo.name}</AppLink>
              </div>
              <div className="tw:text-sm tw:text-gray-500">{item._id}</div>
            </div>
            <div className="tw:text-right">
              <Amount
                value={item._totalPrice}
                className="tw:text-green-500 tw:font-semibold"
              />
              <div className="tw:text-sm tw:text-gray-500">
                <DateFormat value={item.createdAt} />
              </div>
            </div>
          </div>
        ))}

        {hasMoreData && !loading && (
          <div className="tw:text-center tw:mt-4">
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
  );
};

export default RecentCustomerActivity;
