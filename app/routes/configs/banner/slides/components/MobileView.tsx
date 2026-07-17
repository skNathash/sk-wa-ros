import { Edit } from "lucide-react";
import React from "react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import KeyValue from "~/components/core/key-value/KeyValue";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import EmptySlides from "./EmptySlides";

interface MobileViewProps {
  data: any[];
  loading?: boolean;
  callback?: (args: { action: string; data?: any }) => void;
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore?: () => void;
  totalCount?: number;
  loadedCount?: number;
  onAddSlide?: () => void;
}

const MobileView: React.FC<MobileViewProps> = ({
  data = [],
  loading = false,
  callback,
  showLoadMore = true,
  loadingMore = false,
  loadMore,
  totalCount = 0,
  loadedCount = 0,
  onAddSlide,
}) => {
  if (loading) {
    return (
      <div className="tw:p-4">
        <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
          <AppSpinner />
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <EmptySlides onAddSlide={onAddSlide} />;
  }

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
        {data.map((item, idx) => (
          <AppCard key={item._id + "-" + idx}>
            {/* Header: Title + Status */}
            <div className="tw:flex tw:items-start tw:justify-between tw:gap-2 tw:mb-3">
              <div className="tw:flex-1 tw:min-w-0">
                <div className="tw:font-semibold tw:text-slate-900 tw:text-sm tw:line-clamp-2">
                  {item?.title || "--"}
                </div>
              </div>
              <AppBadge
                variant={item.isActive ? "success" : "danger"}
                className="tw:text-[10px] tw:px-1.5 tw:py-0.5 tw:shrink-0"
              >
                {item.isActive ? "Active" : "Inactive"}
              </AppBadge>
            </div>

            {/* Details */}
            <div className="tw:grid tw:grid-cols-2 tw:gap-x-4 tw:gap-y-2 tw:py-2 tw:border-t tw:border-slate-100">
              <KeyValue label="Platform" size="sm">
                {item?.platformType || "--"}
              </KeyValue>
              <KeyValue label="Page Location" size="sm">
                {item?.pageLocation || "--"}
              </KeyValue>
              <KeyValue label="Created" size="sm">
                <DateFormat value={item.createdAt} formatStr="dd MMM yyyy" />
              </KeyValue>
              <KeyValue label="Updated" size="sm">
                {item.modifiedAt ? (
                  <DateFormat
                    value={item.modifiedAt}
                    formatStr="dd MMM yyyy"
                  />
                ) : (
                  <span className="tw:text-gray-400">--</span>
                )}
              </KeyValue>
            </div>

            {/* Action */}
            <div className="tw:flex tw:justify-end tw:pt-2 tw:border-t tw:border-slate-100">
              <AppButton
                size="small"
                fill="outline"
                color="primary"
                onClick={() => callback?.({ action: "edit", data: item })}
                className="tw:text-xs tw:px-3 tw:py-1"
              >
                <Edit size={14} />
                Edit
              </AppButton>
            </div>
          </AppCard>
        ))}
      </div>

      {showLoadMore && (
        <div className="tw:text-center tw:mt-3">
          <LoadMoreButton
            loadMore={() => loadMore && loadMore()}
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
