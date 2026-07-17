import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import GstPayableInfo from "./GstPayableInfo";

interface MobileViewProps {
  data: Array<any>;
  loading?: boolean;
  loadingMore?: boolean;
  showLoadMore?: boolean;
  loadMore: () => void;
  loadedCount?: number;
  totalCount?: number;
  callback?: (payload: { action: string; data: any }) => void;
}

const MobileView: React.FC<MobileViewProps> = ({
  data,
  loading = false,
  loadingMore = false,
  showLoadMore = false,
  loadMore,
  loadedCount = 0,
  totalCount = 0,
  callback,
}) => {
  if (loading) {
    return (
      <div className="tw:p-4 tw:flex tw:items-center tw:justify-center">
        <AppSpinner />
      </div>
    );
  }

  if (!loading && data.length === 0) {
    return (
      <div className="tw:text-center tw:py-8">
        <NoData />
      </div>
    );
  }

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:lg:grid-cols-3 tw:gap-3 tw:py-2">
        {data.map((item) => (
          <div
            key={item._id}
            className="tw:bg-white tw:rounded-lg tw:border tw:border-gray-200 tw:shadow-sm hover:tw:shadow-md tw:transition-shadow"
          >
            {/* Header Section */}
            <div className="tw:p-3 tw:border-b tw:border-gray-100">
              <div className="tw:flex tw:justify-between tw:items-start tw:gap-2">
                <div className="tw:flex-1 tw:min-w-0">
                  <div className="tw:font-semibold tw:text-sm tw:text-gray-900 tw:line-clamp-2 tw:mb-1 tw:leading-tight">
                    <AppLink
                      href={`/dashboard/inventory/products/view/${item._id}`}
                      asLink
                    >
                      {item.name}
                    </AppLink>
                  </div>
                  <div className="tw:flex tw:items-center tw:gap-3">
                    <div className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center tw:gap-1">
                      <span className="tw:font-medium">HSN:</span>
                      <span>{item.hsnCode || "-"}</span>
                    </div>
                    {item.refId && (
                      <div className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center tw:gap-1">
                        <span className="tw:font-medium">ID:</span>
                        <span>{item.refId}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="tw:shrink-0">
                  {item.gstRate != null ? (
                    <div className="tw:text-right">
                      <div className="tw:text-xs tw:text-gray-500 tw:font-medium tw:mb-0.5">
                        GST Rate
                      </div>
                      <AppBadge
                        variant="primary"
                        className="tw:bg-blue-600 tw:text-white tw:font-bold"
                      >
                        {`${item.gstRate || "0"}%`}
                      </AppBadge>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Category Section */}
            <div className="tw:px-3 tw:py-2 tw:bg-gray-50 tw:border-b tw:border-gray-100">
              <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-x-2 tw:gap-y-1 tw:text-xs">
                <span
                  className="tw:text-blue-600 hover:tw:text-blue-700 tw:cursor-pointer tw:font-medium tw:transition-colors"
                  onClick={() =>
                    callback &&
                    callback({
                      action: "menu",
                      data: { id: item.menuId, name: item.menuName },
                    })
                  }
                >
                  {item.menuName}
                </span>
                <span className="tw:text-gray-400">/</span>
                <span
                  className="tw:text-blue-600 hover:tw:text-blue-700 tw:cursor-pointer tw:font-medium tw:transition-colors"
                  onClick={() =>
                    callback &&
                    callback({
                      action: "category",
                      data: { id: item.categoryId, name: item.categoryName },
                    })
                  }
                >
                  {item.categoryName}
                </span>
                {item.brandName && (
                  <>
                    <span className="tw:text-gray-400">•</span>
                    <span
                      className="tw:cursor-pointer"
                      onClick={() =>
                        callback &&
                        callback({
                          action: "brand",
                          data: { id: item.brandId, name: item.brandName },
                        })
                      }
                    >
                      <AppBadge variant="light">{item.brandName}</AppBadge>
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Financial Data Section */}
            <div className="tw:p-3 tw:space-y-2">
              <div className="tw:grid tw:grid-cols-2 tw:gap-3">
                <div className="tw:bg-green-50 tw:rounded tw:p-2">
                  <div className="tw:text-[10px] tw:font-medium tw:text-green-700 tw:uppercase tw:tracking-wide tw:mb-0.5">
                    GST Collected
                  </div>
                  <div className="tw:font-bold tw:text-sm tw:text-green-700">
                    <Amount value={item.gstCollected || 0} />
                  </div>
                </div>
                <div className="tw:bg-orange-50 tw:rounded tw:p-2">
                  <div className="tw:text-[10px] tw:font-medium tw:text-orange-700 tw:uppercase tw:tracking-wide tw:mb-0.5">
                    GST Inward
                  </div>
                  <div className="tw:font-bold tw:text-sm tw:text-orange-700">
                    <Amount value={item.gstInward || 0} />
                  </div>
                </div>
              </div>
              <div
                className={`tw:rounded tw:p-2 tw:border tw:flex tw:items-center tw:justify-between ${
                  (item.netGstPayable || 0) > 0
                    ? "tw:bg-green-50 tw:border-green-100"
                    : (item.netGstPayable || 0) < 0
                      ? "tw:bg-red-50 tw:border-red-100"
                      : "tw:bg-blue-50 tw:border-blue-100"
                }`}
              >
                <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide">
                  Net GST Payable
                </div>

                <div className="tw:flex tw:items-center tw:gap-2">
                  <div
                    className={`tw:font-bold tw:text-base ${
                      (item.netGstPayable || 0) > 0
                        ? "tw:text-green-700"
                        : (item.netGstPayable || 0) < 0
                          ? "tw:text-red-700"
                          : "tw:text-blue-700"
                    }`}
                  >
                    <Amount value={item.netGstPayable || 0} />
                  </div>

                  <GstPayableInfo netGst={item.netGstPayable || 0} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showLoadMore && data.length > 0 && (
        <div className="tw:mt-4 tw:mb-4 tw:flex tw:justify-center">
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
