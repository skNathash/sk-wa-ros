import { Calendar, Copy, Plus, Trash2 } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";

interface MobileViewProps {
  loading: boolean;
  data: Array<Record<string, any>>;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount?: number;
  loadedCount: number;
  hasMoreData: boolean;
  callback: (a: { action: string; data?: any }) => void;
  status: string;
}

const MobileView: React.FC<MobileViewProps> = ({
  loading,
  data,
  loadMore,
  loadingMore,
  totalCount = 0,
  loadedCount = 0,
  hasMoreData = false,
  callback,
  status,
}) => {
  const { t } = useTranslation(["common"]);

  if (loading) {
    return (
      <div className="tw:grid tw:grid-cols-1 md:tw:grid-cols-2 lg:tw:grid-cols-3 tw:gap-4">
        {[...Array(6)].map((_, idx) => (
          <div key={idx} className="tw:animate-pulse">
            <div className="tw:bg-gray-200 tw:h-48 tw:rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="tw:text-center tw:py-8 tw:text-gray-500">
        {t("noDataFound")}
      </div>
    );
  }

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:lg:grid-cols-3 tw:gap-3">
        {data.map((item, idx) => (
          <div
            key={item._id || idx}
            className="tw:p-3 tw:border tw:border-gray-200 tw:rounded-lg tw:bg-white tw:flex tw:flex-col tw:shadow-sm hover:tw:shadow-md tw:transition-shadow"
          >
            <div className="tw:flex-1 tw:mb-2.5">
              <div className="tw:mb-2">
                <div className="tw:text-[10px] tw:text-gray-500 tw:mb-0.5 tw:uppercase tw:tracking-wide">
                  Barcode
                </div>
                <div className="tw:flex tw:items-start tw:justify-between tw:gap-2">
                  <div className="tw:font-mono tw:text-sm tw:text-gray-900 tw:font-medium tw:break-all tw:pr-2">
                    <code className="tw:!font-mono">
                      {item.barcode || "--"}
                    </code>
                  </div>
                  <div className="tw:flex-shrink-0">
                    <button
                      className="tw:cursor-pointer tw:inline-block tw:mt-1"
                      onClick={() =>
                        callback({ action: "copyBarcode", data: item })
                      }
                    >
                      <Copy size={14} className="tw:text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="tw:mb-2 tw:flex tw:items-start tw:justify-between tw:gap-2">
                <div className="tw:flex-1">
                  <div className="tw:text-[10px] tw:text-gray-500 tw:mb-0.5 tw:uppercase tw:tracking-wide">
                    Created On
                  </div>
                  <div className="tw:text-xs tw:text-gray-700 tw:flex tw:items-center tw:gap-1.5">
                    <Calendar
                      size={12}
                      className="tw:text-gray-400 tw:flex-shrink-0"
                    />
                    <DateFormat
                      value={item.createdAt}
                      formatStr="dd MMM yyyy, hh:mm a"
                    />
                  </div>
                </div>
                <div className="tw:flex-shrink-0">
                  <AppBadge
                    variant={item?.statusColor || "danger"}
                    className="tw:text-[10px] tw:px-1.5 tw:py-0.5"
                  >
                    {item.status || "Invalid"}
                  </AppBadge>
                </div>
              </div>
            </div>

            {status === "PENDING" && (
              <div className="tw:mt-auto tw:pt-2 tw:border-t tw:border-gray-100">
                <div className="tw:grid tw:grid-cols-2 tw:gap-2">
                  {item?.showCreate ? (
                    <AppButton
                      onClick={() =>
                        callback({ action: "createProduct", data: item })
                      }
                      size="small"
                      color="primary"
                      fill="solid"
                      className="tw:w-full tw:flex tw:items-center tw:justify-center tw:text-xs tw:py-1.5"
                    >
                      <Plus size={14} />
                      <span>Create Product</span>
                    </AppButton>
                  ) : (
                    <div />
                  )}

                  {(item as any).showRemove ? (
                    <AppButton
                      onClick={() => callback({ action: "remove", data: item })}
                      size="small"
                      color="danger"
                      fill="outline"
                      className="tw:w-full tw:text-xs tw:py-1.5"
                    >
                      <Trash2 size={14} />
                      Remove
                    </AppButton>
                  ) : (
                    <div />
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {hasMoreData && !loading && data.length > 0 && (
        <div className="tw:flex tw:justify-center tw:mt-4">
          <AppButton
            onClick={loadMore}
            disabled={loadingMore}
            size="small"
            color="light"
            fill="outline"
          >
            {loadingMore
              ? "Loading..."
              : `Load More (${loadedCount}/${totalCount})`}
          </AppButton>
        </div>
      )}
    </>
  );
};

export default MobileView;
