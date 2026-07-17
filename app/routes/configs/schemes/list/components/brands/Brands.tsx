import { useCallback, useEffect, useRef, useState } from "react";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import { Skeleton } from "~/components/ui/skeleton";
import type { PaginationState } from "~/types/CommonTypes";
import { prepareParams, getData, getCount } from "./helper";
import { useSearchParams } from "react-router";
import Item from "./Item";
import AppCard from "~/components/core/card/AppCard";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";

const defaultPagination: PaginationState = {
  activePage: 1,
  rowsPerPage: 10,
  startSlNo: 1,
  endSlNo: 10,
  totalRecords: 0,
};

const Brands = () => {
  const [searchParams] = useSearchParams();

  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "running";
  const alpha = searchParams.get("alpha") || "";

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingTotalRecords, setLoadingTotalRecords] = useState(false);

  const paginationRef = useRef<PaginationState>({ ...defaultPagination });

  const applyFilter = useCallback(async () => {
    paginationRef.current = { ...defaultPagination };
    setLoading(true);
    setItems([]);
    try {
      const params = prepareParams(
        { search, status, alpha },
        paginationRef.current,
      );
      const res = await getData(params);
      const data = res?.data || [];

      setLoadingTotalRecords(true);
      const count = await getCount(params);
      paginationRef.current.totalRecords = count;
      setLoadingTotalRecords(false);

      setItems(data);
      paginationRef.current.endSlNo = data.length;
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoading(false);
      setLoadingTotalRecords(false);
    }
  }, [search, status, alpha]);

  useEffect(() => {
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
        { search, status, alpha },
        paginationRef.current,
      );
      const res = await getData(params);
      const data = res?.data || [];
      setItems((prev) => {
        const newData = [...prev, ...data];
        paginationRef.current.endSlNo = newData.length;
        return newData;
      });
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, search, status, alpha]);

  return (
    <div className="tw:mt-4">
      <div className="tw:mb-4">
        <PaginationSummary
          paginationConfig={paginationRef.current}
          loadingTotalRecords={loadingTotalRecords}
          loadedCount={items.length}
          fwSize="sm"
        />
      </div>
      {loading ? (
        <div className="tw:grid tw:grid-cols-2 tw:sm:grid-cols-3 tw:md:grid-cols-6 tw:gap-3">
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
      ) : (
        <>
          <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-6 tw:gap-3">
            {items.map((it, idx) => (
              <Item key={`${it._id}-${idx}`} data={it} status={status} />
            ))}
          </div>

          {!loading && items.length === 0 ? <NoData /> : null}

          {hasMoreData && items.length && !loading ? (
            <div className="tw:flex tw:justify-center tw:mt-4">
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

export default Brands;
