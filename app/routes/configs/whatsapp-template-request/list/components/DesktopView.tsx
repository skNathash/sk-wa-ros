import { Eye, ImageOff, MessageSquare } from "lucide-react";
import React, { useMemo } from "react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import ImgRender from "~/components/core/img/ImgRender";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import { TableSkeletonLoader } from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import type { TableHeaderItem } from "~/types/CommonTypes";
import { getLinkedTemplateName, isTemplateLinked } from "../helper";

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
      { label: "Request", key: "request", enableSort: false, width: "28%" },
      { label: "Images", key: "images", enableSort: false, width: "18%" },
      {
        label: "Status",
        enableSort: false,
        width: "12%",
        isCentered: true,
      },
      { label: "Requested By", key: "requestedBy", enableSort: false, width: "16%" },
      { label: "Created On", key: "createdAt", enableSort: false, width: "13%" },
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
          data.map((item, idx) => {
            const images: string[] = Array.isArray(item?.images)
              ? item.images
              : [];
            return (
              <AppTable.Row
                key={item._id || idx}
                onClick={() => callback?.({ action: "rowClick", data: item })}
                className="tw:cursor-pointer"
              >
                <AppTable.Cell>{idx + 1}</AppTable.Cell>
                <AppTable.Cell className="tw:py-3!">
                  <div className="tw:min-w-0">
                    {item?.referenceId && (
                      <div className="tw:text-[11px] tw:font-medium tw:text-slate-400 tw:mb-0.5">
                        #{item.referenceId}
                      </div>
                    )}
                    <div className="tw:text-sm tw:text-slate-800 tw:line-clamp-3">
                      {item?.remarks || "--"}
                    </div>
                    {isTemplateLinked(item) && (
                      <div className="tw:mt-1 tw:inline-flex tw:items-center tw:gap-1 tw:text-[11px] tw:font-medium tw:text-green-600 tw:bg-green-50 tw:rounded tw:px-1.5 tw:py-0.5">
                        <MessageSquare size={11} />
                        {getLinkedTemplateName(item) || "Template linked"}
                      </div>
                    )}
                  </div>
                </AppTable.Cell>
                <AppTable.Cell>
                  {images.length ? (
                    <div className="tw:flex tw:items-center tw:gap-1.5">
                      {images.slice(0, 3).map((assetId, i) => (
                        <div
                          key={assetId || i}
                          className="tw:w-10 tw:h-10 tw:rounded-md tw:overflow-hidden tw:bg-slate-100 tw:shrink-0 tw:cursor-pointer"
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
                      {images.length > 3 && (
                        <span className="tw:text-xs tw:text-slate-500">
                          +{images.length - 3}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-slate-400">
                      <ImageOff className="tw:w-4 tw:h-4" />
                      <span className="tw:text-xs">No images</span>
                    </div>
                  )}
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-center">
                  <AppBadge variant={item?._statusColor || "info"}>
                    {item?.status || "--"}
                  </AppBadge>
                </AppTable.Cell>
                <AppTable.Cell>
                  <div className="tw:text-sm tw:text-slate-800">
                    {item?.createdBy?.name || item?.seller?.name || "--"}
                  </div>
                  <div className="tw:text-xs tw:text-slate-400 tw:mt-0.5">
                    {item?.createdBy?.mobile || item?.seller?.mobile || ""}
                  </div>
                </AppTable.Cell>
                <AppTable.Cell>
                  <div className="tw:text-xs tw:text-slate-600">
                    <DateFormat value={item.createdAt} formatStr="dd MMM yyyy" />
                  </div>
                  <div className="tw:text-xs tw:text-slate-400 tw:mt-0.5">
                    <DateFormat value={item.createdAt} formatStr="hh:mm a" />
                  </div>
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-center">
                  <AppButton
                    fill="outline"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      callback?.({ action: "view", data: item });
                    }}
                    className="tw:h-8 tw:px-3"
                  >
                    <Eye size={14} />
                    View
                  </AppButton>
                </AppTable.Cell>
              </AppTable.Row>
            );
          })
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
