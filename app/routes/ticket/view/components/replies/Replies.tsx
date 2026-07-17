import React, { useCallback, useEffect, useRef, useState } from "react";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";

import { getData, prepareParams } from "./helper";

interface ReplyItem {
  id: string;
  profileImg: string;
  email: string;
  description: string;
  date: string | Date;
}

interface RepliesProps {
  cardTitle?: React.ReactNode;
}

const Replies: React.FC<RepliesProps> = ({ cardTitle }) => {
  const [data, setData] = useState<ReplyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  // Pagination and filter refs
  const paginationRef = useRef({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });
  const filterRef = useRef<any>({});

  // Apply filter (initial load and on filter change)
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
  }, [applyFilter]);

  return (
    <AppCard title={cardTitle || "Replies"}>
      <div className="tw:flex tw:flex-col tw:gap-4">
        {data.map((reply) => (
          <div
            key={reply.id}
            className="tw:flex tw:items-start tw:gap-4 tw:p-3 tw:bg-white tw:rounded-md tw:shadow-sm"
          >
            <img
              src={reply.profileImg}
              alt={reply.email}
              className="tw:w-10 tw:h-10 tw:rounded-full tw:object-cover tw:border tw:border-gray-200"
            />
            <div className="tw:flex-1 tw:min-w-0">
              <div className="tw:flex tw:items-center tw:gap-2">
                <span className="tw:font-medium tw:text-gray-900 tw:truncate">
                  {reply.email}
                </span>
              </div>
              <div className="tw:mt-1 tw:text-gray-700 tw:text-sm tw:break-words">
                {reply.description}
              </div>
              <div className="tw:mt-1 tw:text-xs tw:text-gray-400">
                <DateFormat value={reply.date} />
              </div>
            </div>
          </div>
        ))}
        {hasMoreData && (
          <button
            className="tw:mt-2 tw:py-2 tw:px-4 tw:bg-gray-100 tw:rounded tw:text-sm tw:text-gray-600 hover:tw:bg-gray-200 disabled:tw:opacity-50"
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        )}
        {loading && (
          <div className="tw:text-center tw:text-gray-400 tw:py-4">
            Loading...
          </div>
        )}
      </div>
    </AppCard>
  );
};

export default Replies;
