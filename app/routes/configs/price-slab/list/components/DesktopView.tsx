import { Edit, Eye } from "lucide-react";
import React, { useMemo } from "react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import { TableSkeletonLoader } from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import type {
  SortProps,
  SortValue,
  TableHeaderItem,
} from "~/types/CommonTypes";
import SlabDetails from "../SlabDetails";
import DateFormat from "~/components/core/date/DateFormat";
import SlabGrid from "./SlabGrid";
import AppLink from "~/components/core/link/AppLink";
import type { PriceSlabType } from "../helper";

export interface DesktopViewProps {
  type: PriceSlabType;
  loading?: boolean;
  data: any[];
  callback: (args: { action: string; data?: any }) => void;
  sortKey?: string;
  onSort?: (sort: SortProps) => void;
  sortValue?: SortValue;
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore?: (event?: any) => void;
  totalCount?: number;
  loadedCount?: number;
}

const containerStyle = { maxHeight: "calc(100vh - 220px)" };

const DesktopView: React.FC<DesktopViewProps> = ({
  type = "global",
  loading = false,
  data = [],
  callback,
  sortKey = "",
  onSort = () => {},
  sortValue = "asc",
  showLoadMore = false,
  loadingMore = false,
  loadMore = () => {},
  totalCount = 0,
  loadedCount = 0,
}) => {
  const headers = useMemo(() => {
    let headers: TableHeaderItem[] = [
      { label: "#", key: "sl", width: "4%" },
      { label: "Name", key: "name", enableSort: false, width: "30%" },
      { label: "Slabs", key: "slabs", enableSort: false, width: "28%" },
      {
        label: "Status",
        enableSort: false,
        width: "14%",
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
        width: "14%",
        isCentered: true,
      },
    ];

    if (type === "product") {
      headers[1].label = "Product Name";
    }
    if (type === "brand") {
      headers[1].label = "Brand Name";
    }
    if (type === "menu") {
      headers[1].label = "Menu Name";
    }
    if (type === "category") {
      headers[1].label = "Category Name";
    }

    return headers;
  }, [type]);

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
        <TableHeader
          headers={headers}
          sortKey={sortKey}
          onSort={onSort}
          sortValue={sortValue}
        />
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
                {item?.configType === "Deal" ? (
                  <AppLink
                    asLink
                    href={`/dashboard/inventory/products/view/${item.referenceInfo?.id}`}
                    showLinkColor
                    className="tw:font-medium"
                  >
                    {item?.referenceInfo?.name || "--"}
                  </AppLink>
                ) : (
                  <div className="tw:font-medium tw:text-slate-900">
                    {item?.referenceInfo?.name || "--"}
                  </div>
                )}
                {item?.referenceInfo?.description && (
                  <div className="tw:text-[11px] tw:text-slate-500 tw:mt-0.5">
                    {item?.referenceInfo?.description}
                  </div>
                )}
                {item?.referenceInfo?.refId && (
                  <div className="tw:text-[11px] tw:text-slate-500 tw:mt-0.5">
                    ID: {item?.referenceInfo?.refId}
                  </div>
                )}
              </AppTable.Cell>
              <AppTable.Cell>
                <SlabGrid slabs={item.slab || []} />
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
                <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-2">
                  <AppButton
                    fill="outline"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      callback?.({ action: "edit", data: item });
                    }}
                    className="tw:h-8 tw:px-3 tw:w-full"
                  >
                    <Edit size={14} />
                    Edit
                  </AppButton>

                  <AppButton
                    fill="outline"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      callback?.({ action: "logs", data: item });
                    }}
                    color="light"
                    className="tw:h-8 tw:px-3 tw:w-full"
                  >
                    <Eye size={14} />
                    View Logs
                  </AppButton>
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
