import { ImageOff, MessageSquare } from "lucide-react";
import React from "react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import ImgRender from "~/components/core/img/ImgRender";
import KeyValue from "~/components/core/key-value/KeyValue";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { getLinkedTemplateName, isTemplateLinked } from "../helper";

interface MobileViewProps {
  data: any[];
  loading?: boolean;
  callback?: (args: { action: string; data?: any }) => void;
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore?: () => void;
  totalCount?: number;
  loadedCount?: number;
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
    return (
      <div className="tw:p-4">
        <div className="tw:text-center">No data found</div>
      </div>
    );
  }

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
        {data.map((item, idx) => {
          const images: string[] = Array.isArray(item?.images)
            ? item.images
            : [];
          return (
            <div
              key={item._id + "-" + idx}
              onClick={() => callback?.({ action: "view", data: item })}
              className="tw:cursor-pointer tw:h-full"
            >
            <AppCard
              className="tw:h-full tw:mb-0!"
              bodyClassName="tw:flex tw:flex-col tw:h-full"
            >
              {/* Header: Remarks + Status */}
              <div className="tw:flex tw:items-start tw:justify-between tw:gap-2 tw:mb-3">
                <div className="tw:flex-1 tw:min-w-0">
                  {item?.referenceId && (
                    <div className="tw:text-[11px] tw:font-medium tw:text-slate-400 tw:mb-0.5">
                      #{item.referenceId}
                    </div>
                  )}
                  <div className="tw:font-medium tw:text-slate-900 tw:text-sm tw:line-clamp-3">
                    {item?.remarks || "--"}
                  </div>
                  {isTemplateLinked(item) && (
                    <div className="tw:mt-1 tw:inline-flex tw:items-center tw:gap-1 tw:text-[11px] tw:font-medium tw:text-green-600 tw:bg-green-50 tw:rounded tw:px-1.5 tw:py-0.5">
                      <MessageSquare size={11} />
                      {getLinkedTemplateName(item) || "Template linked"}
                    </div>
                  )}
                </div>
                <AppBadge
                  variant={item?._statusColor || "info"}
                  className="tw:text-[10px] tw:px-1.5 tw:py-0.5 tw:shrink-0"
                >
                  {item?.status || "--"}
                </AppBadge>
              </div>

              {/* Images */}
              <div className="tw:py-2 tw:border-t tw:border-slate-100">
                {images.length ? (
                  <div className="tw:flex tw:items-center tw:gap-2 tw:flex-wrap">
                    {images.map((assetId, i) => (
                      <div
                        key={assetId || i}
                        className="tw:w-14 tw:h-14 tw:rounded-md tw:overflow-hidden tw:bg-slate-100 tw:cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          callback?.({ action: "preview-image", data: item });
                        }}
                      >
                        <ImgRender
                          assetId={assetId}
                          className="tw:w-full tw:h-full tw:object-cover"
                          alt="request"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-slate-400">
                    <ImageOff className="tw:w-4 tw:h-4" />
                    <span className="tw:text-xs">No images</span>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="tw:grid tw:grid-cols-2 tw:gap-x-4 tw:gap-y-2 tw:pt-2 tw:mt-auto tw:border-t tw:border-slate-100">
                <KeyValue label="Requested By" size="xs">
                  {item?.createdBy?.name || item?.seller?.name || "--"}
                </KeyValue>
                <KeyValue label="Created On" size="xs">
                  <DateFormat value={item.createdAt} formatStr="dd MMM yyyy" />
                </KeyValue>
              </div>
            </AppCard>
            </div>
          );
        })}
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
