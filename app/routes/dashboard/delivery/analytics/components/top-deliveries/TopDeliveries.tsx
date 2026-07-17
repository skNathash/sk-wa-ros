import React, { useState, useEffect, useRef, useCallback } from "react";
import type { PaginationState } from "~/types/CommonTypes";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import Item from "./Item";
import { getData } from "./helper";

interface TopDeliveriesProps {
  type: "own" | "courier";
}

const TopDeliveries: React.FC<TopDeliveriesProps> = ({ type }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  // Refs
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 5,
    startSlNo: 1,
    endSlNo: 5,
    totalRecords: 0,
  });
  const filterRef = useRef<any>({ type });

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
      const result = await getData({
        page: paginationRef.current.activePage,
        count: paginationRef.current.rowsPerPage,
        type: filterRef.current.type,
      });
      setData(result || []);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage
      );
    } catch (error) {
      console.error("Error fetching top deliveries:", error);
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
      const result = await getData({
        page: paginationRef.current.activePage,
        count: paginationRef.current.rowsPerPage,
        type: filterRef.current.type,
      });
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage
      );
    } catch (error) {
      console.error("Error loading more deliveries:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  // Initial load
  useEffect(() => {
    filterRef.current.type = type;
    applyFilter();
  }, [type, applyFilter]);

  const getTitle = () => {
    return type === "own" ? "Top Delivery Persons" : "Top Couriers";
  };

  const getSubtitle = () => {
    return type === "own"
      ? "Best performing in-house delivery team"
      : "Most reliable external courier partners";
  };

  return (
    <AppCard title={getTitle()} subtitle={getSubtitle()}>
      <Item loading={loading} data={data} />
      {hasMoreData && !loading && (
        <div className="tw:text-center tw:mt-4">
          <AppButton
            onClick={loadMore}
            disabled={loadingMore}
            isLoading={loadingMore}
            color="light"
            fill="outline"
            size="small"
          >
            Load More
          </AppButton>
        </div>
      )}
    </AppCard>
  );
};

export default TopDeliveries;
