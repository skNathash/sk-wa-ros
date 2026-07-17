import { useCallback, useEffect, useRef, useState } from "react";
import AppCard from "~/components/core/card/AppCard";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import type { PaginationState, SortProps } from "~/types/CommonTypes";
import { getCount, getData, prepareParams } from "./helper";
import Item from "./Item";

const defaultSort: SortProps = { key: "createdAt", value: "desc" };

type RecentExpensesProps = {
  refreshSignal?: number;
};

const RecentExpenses = ({ refreshSignal = 0 }: RecentExpensesProps) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMoreData, setHasMoreData] = useState<boolean>(true);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const apply = useCallback(async () => {
    setLoading(true);
    setData([]);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    try {
      const params = prepareParams({}, paginationRef.current, defaultSort);
      const [count, list] = await Promise.all([
        getCount(params),
        getData(params),
      ]);

      paginationRef.current.totalRecords = count;
      setData(list);
      setHasMoreData(list.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams({}, paginationRef.current, defaultSort);
      const list = await getData(params);
      setData((prev) => [...prev, ...list]);
      setHasMoreData(list.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMoreData, loadingMore]);

  useEffect(() => {
    apply();
  }, [apply, refreshSignal]);

  return (
    <AppCard
      title="Recent Expenses"
      subtitle="Latest expense entries"
      icon="clock"
    >
      <AppScrollArea className="tw:md:h-[calc(100vh-300px)] tw:pe-2">
        <div className="tw:grid tw:grid-cols-1 tw:gap-4">
          {loading ? (
            <div className="tw:col-span-1">
              <div className="tw:space-y-4">
                {[...Array(5)].map((_, idx) => (
                  <div key={idx} className="tw:animate-pulse">
                    <div className="tw:bg-gray-200 tw:h-20 tw:rounded-lg"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : !data || data.length === 0 ? (
            <div className="tw:col-span-1 tw:text-center tw:py-8 tw:text-gray-500">
              No data found
            </div>
          ) : (
            data.map((row, idx) => <Item key={idx} data={row} />)
          )}
        </div>
      </AppScrollArea>
      <div className="tw:mt-2 tw:flex tw:justify-center">
        <LoadMoreButton
          loadMore={loadMore}
          loading={loadingMore}
          totalCount={paginationRef.current.totalRecords}
          loadedCount={data.length}
        />
      </div>
    </AppCard>
  );
};

export default RecentExpenses;
