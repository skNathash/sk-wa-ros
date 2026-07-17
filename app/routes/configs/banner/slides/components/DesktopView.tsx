import { Edit } from "lucide-react";
import React, { useMemo } from "react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import { TableSkeletonLoader } from "~/components/core/table";
import EmptySlides from "./EmptySlides";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import DateFormat from "~/components/core/date/DateFormat";
import type { TableHeaderItem } from "~/types/CommonTypes";

export interface DesktopViewProps {
  loading?: boolean;
  data: any[];
  callback: (args: { action: string; data?: any }) => void;
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore?: (event?: any) => void;
  totalCount?: number;
  loadedCount?: number;
  onAddSlide?: () => void;
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
  onAddSlide,
}) => {
  const headers = useMemo(() => {
    const headers: TableHeaderItem[] = [
      { label: "#", key: "sl", width: "5%" },
      { label: "Title", key: "title", enableSort: false, width: "20%" },
      { label: "Platform", key: "platformType", enableSort: false, width: "12%" },
      { label: "Page Location", key: "pageLocation", enableSort: false, width: "15%" },
      {
        label: "Status",
        enableSort: false,
        width: "10%",
        isCentered: true,
      },
      {
        label: "Created At",
        key: "createdAt",
        enableSort: false,
        width: "14%",
      },
      {
        label: "Updated At",
        key: "modifiedAt",
        enableSort: false,
        width: "14%",
      },
      {
        label: "Action",
        enableSort: false,
        width: "10%",
        isCentered: true,
      },
    ];
    return headers;
  }, []);

  if (!loading && (!data || data.length === 0)) {
    return <EmptySlides onAddSlide={onAddSlide} />;
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
              className="tw:cursor-pointer"
            >
              <AppTable.Cell>{idx + 1}</AppTable.Cell>
              <AppTable.Cell className="tw:py-3!">
                <div className="tw:font-medium tw:text-slate-900">
                  {item?.title || "--"}
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                <span className="tw:text-slate-600">
                  {item?.platformType || "--"}
                </span>
              </AppTable.Cell>
              <AppTable.Cell>
                <span className="tw:text-slate-600">
                  {item?.pageLocation || "--"}
                </span>
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                {item.isActive ? (
                  <AppBadge variant="success">Active</AppBadge>
                ) : (
                  <AppBadge variant="danger">Inactive</AppBadge>
                )}
              </AppTable.Cell>
              <AppTable.Cell>
                <DateFormat value={item.createdAt} formatStr="dd MMM yyyy" />
                <div className="tw:text-xs tw:text-gray-500">
                  <DateFormat value={item.createdAt} formatStr="hh:mm a" />
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                {item.modifiedAt ? (
                  <>
                    <DateFormat
                      value={item.modifiedAt}
                      formatStr="dd MMM yyyy"
                    />
                    <div className="tw:text-xs tw:text-gray-500">
                      <DateFormat value={item.modifiedAt} formatStr="hh:mm a" />
                    </div>
                  </>
                ) : (
                  <span className="tw:text-gray-500 tw:text-center">--</span>
                )}
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <AppButton
                  fill="outline"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    callback?.({ action: "edit", data: item });
                  }}
                  className="tw:h-8 tw:px-3"
                >
                  <Edit size={14} />
                  Edit
                </AppButton>
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
