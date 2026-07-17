import React from "react";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import Amount from "~/components/core/amount/Amount";
import type { RateRow } from "../helper";

interface Props {
  data: RateRow[];
  loading?: boolean;
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore: () => void;
  totalCount?: number;
  loadedCount: number;
}

const MobileView: React.FC<Props> = ({
  data,
  loading = false,
  showLoadMore = false,
  loadingMore = false,
  loadMore,
  totalCount = 0,
  loadedCount,
}) => {
  if (loading) {
    return (
      <div className="tw:p-8 tw:text-center">
        <div className="tw:inline-block tw:w-12 tw:h-12 tw:border-4 tw:border-gray-200 tw:border-t-blue-600 tw:rounded-full tw:animate-spin"></div>
        <p className="tw:text-gray-600 tw:text-sm tw:mt-4">Loading...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="tw:text-center tw:py-12">
        <NoData />
      </div>
    );
  }

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-3 tw:py-3">
        {data.map((item) => (
          <div
            key={item.gstRate}
            className="tw:bg-white tw:p-4 tw:rounded-lg tw:border tw:border-gray-200 tw:shadow-sm tw:hover:shadow-md tw:transition-shadow tw:duration-200"
          >
            <div className="tw:flex tw:items-baseline tw:justify-between tw:mb-3">
              <span className="tw:text-xs tw:font-semibold tw:text-gray-500 tw:uppercase tw:tracking-wide">
                GST Rate
              </span>
              <span className="tw:text-xl tw:font-bold tw:text-gray-900">
                {item.gstRate || "0"}%
              </span>
            </div>

            <div className="tw:grid tw:grid-cols-2 tw:gap-x-4 tw:gap-y-3 tw:text-sm">
              <div>
                <p className="tw:text-xs tw:font-semibold tw:text-gray-500 tw:uppercase tw:tracking-wide">
                  GST Collected
                </p>
                <p className="tw:text-base tw:font-semibold tw:text-emerald-600 tw:leading-tight">
                  <Amount value={item.gstCollected} />
                </p>
              </div>

              <div>
                <p className="tw:text-xs tw:font-semibold tw:text-gray-500 tw:uppercase tw:tracking-wide">
                  GST Inward
                </p>
                <p className="tw:text-base tw:font-semibold tw:text-amber-600 tw:leading-tight">
                  <Amount value={item.gstInward} />
                </p>
              </div>

              <div className="tw:col-span-2 tw:flex tw:items-center tw:justify-between tw:bg-blue-50 tw:border tw:border-blue-100 tw:rounded-md tw:px-3 tw:py-2">
                <p className="tw:text-xs tw:font-semibold tw:text-blue-700 tw:uppercase tw:tracking-wide">
                  Net GST Payable
                </p>
                <p className="tw:text-lg tw:font-bold tw:text-blue-700 tw:leading-tight">
                  <Amount value={item.netGstPayable} />
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showLoadMore && data.length > 0 && (
        <div className="tw:py-3 tw:flex tw:justify-center">
          <LoadMoreButton
            loadMore={loadMore}
            loading={loadingMore}
            totalCount={totalCount}
            loadedCount={loadedCount}
          />
        </div>
      )}
    </>
  );
};

export default MobileView;
