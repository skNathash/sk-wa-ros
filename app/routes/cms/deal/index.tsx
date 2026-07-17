import { useRef, useState, useCallback, useEffect } from "react";
import AppCard from "~/components/core/card/AppCard";
import type { PaginationState } from "~/types/CommonTypes";
import { getData, getCount, prepareParams } from "./helper";
import Filter from "./components/Filter";
import Item from "./components/Item";
import Summary from "./components/Summary";
import { summaryData } from "./helper";

const DealIndex = () => {
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
  const filterRef = useRef<any>({});

  // Apply filter (initial load or filter change)
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
        key: "",
        value: "asc",
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
        key: "",
        value: "asc",
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
  }, [applyFilter]);

  // Filter change handler
  const onFilterChange = useCallback(
    (data: any) => {
      filterRef.current = {
        ...filterRef.current,
        ...data.formData,
      };
      applyFilter();
    },
    [applyFilter]
  );

  return (
    <>
      <Summary data={summaryData} />
      <AppCard
        title="Deal Management with Analytics"
        subtitle="Manage deals and track their performance with order analytics"
        icon="package"
      >
        <Filter callback={onFilterChange} />
        {loading && <div>Loading...</div>}
        {!loading && data.length === 0 && <div>No deals found.</div>}
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
          {data.map((item) => (
            <Item key={item._id} data={item} />
          ))}
        </div>
        {hasMoreData && !loading && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </AppCard>
    </>
  );
};

export default DealIndex;
