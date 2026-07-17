import { CircleCheck, CircleX, Eye, ImageOff } from "lucide-react";
import React, { useMemo } from "react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import ImgRender from "~/components/core/img/ImgRender";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import Rbac from "~/components/core/rbac/Rbac";
import { TableSkeletonLoader } from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import type { TableHeaderItem } from "~/types/CommonTypes";

const rbacRoles = {
  update: ["BANNER.BANNER-UPDATE"],
};

export interface DesktopViewProps {
  loading?: boolean;
  data: any[];
  callback: (args: { action: string; data?: any }) => void;
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore?: (event?: any) => void;
  totalCount?: number;
  loadedCount?: number;
}

const containerStyle = { maxHeight: "calc(100vh - 220px)" };

const DesktopView: React.FC<DesktopViewProps> = ({
  loading = false,
  data = [],
  callback,
  showLoadMore = false,
  loadingMore = false,
  loadMore = () => {},
  totalCount = 0,
  loadedCount = 0,
}) => {
  const headers = useMemo(() => {
    const headers: TableHeaderItem[] = [
      { label: "#", key: "sl", width: "3%" },
      { label: "Banner", key: "banner", enableSort: false, width: "22%" },
      { label: "Type", key: "type", enableSort: false, width: "8%", isCentered: true },
      { label: "Placement", key: "placement", enableSort: false, width: "12%" },
      { label: "Priority", key: "priority", enableSort: false, width: "6%", isCentered: true },
      { label: "Validity", key: "validity", enableSort: false, width: "10%" },
      { label: "Status", enableSort: false, width: "10%", isCentered: true },
      { label: "Created By", key: "createdBy", enableSort: false, width: "11%" },
      { label: "Action", enableSort: false, width: "10%", isCentered: true },
    ];
    return headers;
  }, []);

  if (!loading && (!data || data.length === 0)) {
    return (
      <div className="tw:p-4">
        <NoData />
      </div>
    );
  }

  return (
    <AppTable
      container
      minWidth="900px"
      containerStyle={containerStyle}
      stickyHeader
    >
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} rows={8} />
        ) : (
          data.map((item, idx) => (
            <AppTable.Row
              key={item._id || idx}
              onClick={() => callback?.({ action: "rowClick", data: item })}
              className={`tw:cursor-pointer ${item?.status === "Submitted" ? "tw:bg-blue-50" : ""}`}
            >
              <AppTable.Cell>{idx + 1}</AppTable.Cell>
              <AppTable.Cell className="tw:py-3!">
                <div className="tw:flex tw:items-start tw:gap-3">
                  <div
                    className="tw:w-20 tw:h-14 tw:rounded-md tw:overflow-hidden tw:bg-slate-100 tw:flex tw:items-center tw:justify-center tw:shrink-0 tw:cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
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
                      <ImageOff className="tw:w-5 tw:h-5 tw:text-slate-400" />
                    )}
                  </div>
                  <div className="tw:min-w-0">
                    <div className="tw:font-medium tw:text-slate-900 tw:text-sm tw:truncate">
                      {item?.title || "--"}
                    </div>
                    <div className="tw:text-xs tw:text-slate-400 tw:mt-0.5">
                      {item?.bannerId || "--"}
                    </div>
                  </div>
                </div>
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <AppBadge variant={item?.type === "B2B" ? "warning" : item?.type === "B2C" ? "info" : "secondary"}>
                  {item?.type || "--"}
                </AppBadge>
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:text-sm tw:text-slate-800">
                  {item?.placeholderInfo?.name || "--"}
                </div>
                <div className="tw:text-xs tw:text-slate-400 tw:mt-0.5">
                  {item?.placeholderInfo?.code || "--"}
                </div>
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <span className="tw:inline-flex tw:items-center tw:justify-center tw:w-6 tw:h-6 tw:rounded-full tw:bg-slate-100 tw:text-sm tw:font-medium tw:text-slate-700">
                  {item?.priority ?? "--"}
                </span>
              </AppTable.Cell>
              <AppTable.Cell>
                {item?.validFrom ? (
                  <div className="tw:text-xs">
                    <div className="tw:text-slate-600">
                      <DateFormat value={item.validFrom} formatStr="dd MMM yyyy" />
                    </div>
                    <div className="tw:text-slate-400 tw:my-0.5">to</div>
                    <div className="tw:text-slate-600">
                      {item?.validTo ? (
                        <DateFormat value={item.validTo} formatStr="dd MMM yyyy" />
                      ) : (
                        "No end date"
                      )}
                    </div>
                  </div>
                ) : (
                  <span className="tw:text-slate-400">--</span>
                )}
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <div className="tw:flex tw:flex-col tw:items-center tw:gap-1">
                  <AppBadge variant={item?._statusColor || "info"}>
                    {item?.status || "--"}
                  </AppBadge>
                  {item?.status !== "Expired" && (
                    <span
                      className={`tw:inline-flex tw:items-center tw:gap-1.5 tw:text-xs tw:font-medium ${
                        item?.isActive
                          ? "tw:text-emerald-600"
                          : "tw:text-red-600"
                      }`}
                    >
                      <span
                        className={`tw:w-2 tw:h-2 tw:rounded-full ${
                          item?.isActive ? "tw:bg-emerald-500" : "tw:bg-red-500"
                        }`}
                      />
                      {item?.isActive ? "Active" : "Inactive"}
                    </span>
                  )}
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:text-sm tw:text-slate-800">
                  {item?.createdBy?.name || "--"}
                </div>
                <div className="tw:text-xs tw:text-slate-400 tw:mt-0.5">
                  <DateFormat value={item.createdAt} formatStr="dd MMM yyyy" />
                </div>
                <div className="tw:text-xs tw:text-slate-400 tw:mt-0.5">
                  <DateFormat value={item.createdAt} formatStr="hh:mm a" />
                </div>
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <div className="tw:inline-flex tw:flex-col tw:items-stretch tw:gap-1 tw:w-32">
                  <AppButton
                    fill="outline"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      callback?.({ action: "view", data: item });
                    }}
                    className="tw:h-8 tw:px-3 tw:w-full"
                  >
                    <Eye size={14} />
                    View
                  </AppButton>
                  {item?.status !== "Expired" && (
                    <Rbac roles={rbacRoles.update}>
                      <AppButton
                        fill="outline"
                        size="small"
                        color={item?.isActive ? "danger" : "success"}
                        onClick={(e) => {
                          e.stopPropagation();
                          callback?.({ action: "toggle-status", data: item });
                        }}
                        className="tw:h-8 tw:px-3 tw:w-full tw:whitespace-nowrap"
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
                </div>
              </AppTable.Cell>
            </AppTable.Row>
          ))
        )}

        {showLoadMore && !loading && data.length > 0 && (
          <AppTable.Row noHover>
            <AppTable.Cell
              className="tw:text-center tw:py-4"
              colSpan={headers.length}
            >
              <LoadMoreButton
                loadMore={loadMore}
                loading={loadingMore}
                totalCount={totalCount}
                loadedCount={loadedCount}
                noMargin
              />
            </AppTable.Cell>
          </AppTable.Row>
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
