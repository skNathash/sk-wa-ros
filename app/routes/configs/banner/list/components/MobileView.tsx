import { CircleCheck, CircleX, Eye, ImageOff } from "lucide-react";
import React from "react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import ImgRender from "~/components/core/img/ImgRender";
import KeyValue from "~/components/core/key-value/KeyValue";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import Rbac from "~/components/core/rbac/Rbac";
import AppSpinner from "~/components/core/Spinner/AppSpinner";

const rbacRoles = {
  update: ["BANNER.BANNER-UPDATE"],
};

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
        {data.map((item, idx) => (
          <AppCard
            key={item._id + "-" + idx}
            className={
              item?.status === "Submitted"
                ? "tw:border-blue-300 tw:bg-blue-50"
                : ""
            }
          >
            {/* Banner Image */}
            <div
              className="tw:w-full tw:h-32 tw:rounded-md tw:overflow-hidden tw:bg-slate-100 tw:flex tw:items-center tw:justify-center tw:mb-3 tw:cursor-pointer"
              onClick={() => {
                if (item?.bannerImage?.assetId) {
                  callback?.({ action: "preview-image", data: item });
                }
              }}
            >
              {item?.bannerImage?.assetId ? (
                <ImgRender
                  assetId={item.bannerImage.assetId}
                  className="tw:w-full tw:h-full tw:object-cover"
                  alt={item?.title}
                />
              ) : (
                <ImageOff className="tw:w-8 tw:h-8 tw:text-slate-400" />
              )}
            </div>

            {/* Header: Title + Status */}
            <div className="tw:flex tw:items-start tw:justify-between tw:gap-2 tw:mb-3">
              <div className="tw:flex-1 tw:min-w-0">
                <div className="tw:font-semibold tw:text-slate-900 tw:text-sm tw:line-clamp-2">
                  {item?.title || "--"}
                </div>
                <div className="tw:text-xs tw:text-slate-400 tw:mt-0.5">
                  {item?.bannerId || "--"}
                </div>
              </div>
              <div className="tw:flex tw:items-center tw:gap-1.5 tw:shrink-0">
                <span
                  className={`tw:inline-flex tw:items-center tw:gap-1 tw:text-[10px] tw:font-medium tw:px-1.5 tw:py-0.5 tw:rounded-full ${
                    item?.isActive
                      ? "tw:bg-emerald-50 tw:text-emerald-600"
                      : "tw:bg-red-50 tw:text-red-600"
                  }`}
                >
                  <span
                    className={`tw:w-1.5 tw:h-1.5 tw:rounded-full ${
                      item?.isActive ? "tw:bg-emerald-500" : "tw:bg-red-500"
                    }`}
                  />
                  {item?.isActive ? "Active" : "Inactive"}
                </span>
                <AppBadge
                  variant={item?._statusColor || "info"}
                  className="tw:text-[10px] tw:px-1.5 tw:py-0.5"
                >
                  {item?.status || "--"}
                </AppBadge>
              </div>
            </div>

            {/* Details */}
            <div className="tw:grid tw:grid-cols-2 tw:gap-x-4 tw:gap-y-2 tw:py-2 tw:border-t tw:border-slate-100">
              <KeyValue label="Type" size="xs">
                <span>{item?.type || "--"}</span>
              </KeyValue>
              <KeyValue label="Placeholder" size="xs">
                <span>{item?.placeholderInfo?.name || "--"}</span>
              </KeyValue>
              <KeyValue label="Priority" size="xs">
                {item?.priority ?? "--"}
              </KeyValue>
              <KeyValue label="Valid From" size="xs">
                {item?.validFrom ? (
                  <DateFormat value={item.validFrom} formatStr="dd MMM yyyy" />
                ) : (
                  <span className="tw:text-gray-400">--</span>
                )}
              </KeyValue>
              <KeyValue label="Valid To" size="xs">
                {item?.validTo ? (
                  <DateFormat value={item.validTo} formatStr="dd MMM yyyy" />
                ) : (
                  <span className="tw:text-gray-400">--</span>
                )}
              </KeyValue>
              <KeyValue label="Created By" size="xs">
                {item?.createdBy?.name || "--"}
              </KeyValue>
              <KeyValue label="Created At" size="xs">
                <DateFormat value={item.createdAt} formatStr="dd MMM yyyy" />
              </KeyValue>
            </div>

            {/* Action */}
            <div className="tw:flex tw:justify-end tw:gap-2 tw:pt-2 tw:border-t tw:border-slate-100">
              {item?.status !== "Expired" && (
                <Rbac roles={rbacRoles.update}>
                  <AppButton
                    size="small"
                    fill="outline"
                    color={item?.isActive ? "danger" : "success"}
                    onClick={() =>
                      callback?.({ action: "toggle-status", data: item })
                    }
                    className="tw:text-xs tw:px-3 tw:py-1"
                  >
                    {item?.isActive ? (
                      <CircleX size={14} />
                    ) : (
                      <CircleCheck size={14} />
                    )}
                    {item?.isActive ? "Mark Inactive" : "Mark Active"}
                  </AppButton>
                </Rbac>
              )}
              <AppButton
                size="small"
                fill="outline"
                color="primary"
                onClick={() => callback?.({ action: "view", data: item })}
                className="tw:text-xs tw:px-3 tw:py-1"
              >
                <Eye size={14} />
                View
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
