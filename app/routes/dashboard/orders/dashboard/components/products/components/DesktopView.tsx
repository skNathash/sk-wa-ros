import { ChevronRight } from "lucide-react";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import {
  AppTable,
  TableHeader,
  TableSkeletonLoader,
} from "~/components/core/table";
import LastOrderPopover from "../../LastOrderPopover";
import clsx from "clsx";
import type { SortValue, TableHeaderItem } from "~/types/CommonTypes";

const headers: TableHeaderItem[] = [
  { label: "#", key: "index", width: "3%", isCentered: true },
  { label: "Name", key: "productName", width: "20%", enableSort: true },
  {
    label: "Units Sold",
    key: "totalUnits",
    width: "7%",
    isCentered: true,
    enableSort: true,
  },
  { label: "Sales Value", key: "orderValue", width: "8%", isCentered: true },
  {
    label: "Current Stock",
    key: "currentStock",
    width: "8%",
    isCentered: true,
  },
  { label: "Status", key: "status", width: "7%" },
  {
    label: "Last Order",
    key: "lastOrder.createdAt",
    width: "16%",
    enableSort: true,
  },
];

interface DesktopViewProps {
  data: any[];
  loading: boolean;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  showLoadMore: boolean;
  sortKey?: string;
  sortValue?: SortValue;
  onSort?: (data: { key: string; value: SortValue }) => void;
}

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

const DesktopView: React.FC<DesktopViewProps> = ({
  data,
  loading,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  showLoadMore,
  sortKey,
  sortValue,
  onSort,
}) => {
  if (!loading && data.length === 0) {
    return <NoData />;
  }

  return (
    <div>
      <AppTable
        container
        responsive
        stickyHeader
        condensed
        containerStyle={containerStyle}
      >
        <AppTable.Header>
          <TableHeader
            headers={headers}
            sortKey={sortKey}
            sortValue={sortValue}
            onSort={onSort}
          />
        </AppTable.Header>

        <AppTable.Body>
          {loading ? (
            <TableSkeletonLoader cols={headers.length} rows={10} />
          ) : data.length === 0 ? (
            <AppTable.Row>
              <AppTable.Cell colSpan={headers.length}>
                <NoData />
              </AppTable.Cell>
            </AppTable.Row>
          ) : (
            data.map((row, index) => (
              <AppTable.Row key={row.orderId + index}>
                <AppTable.Cell>{index + 1}</AppTable.Cell>
                <AppTable.Cell>
                  <AppLink
                    asLink
                    href={`/dashboard/inventory/products/view/${row.productId}`}
                    showLinkColor
                    className="tw:font-medium"
                  >
                    {row.productName}
                  </AppLink>
                  {row.productRefId && (
                    <div className="tw:text-gray-500 tw:mt-1">
                      ID:{row.productRefId}
                    </div>
                  )}
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-center">
                  {row.totalUnits || 0}
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-center">
                  <Amount value={row.totalValue || 0} />
                </AppTable.Cell>
                <AppTable.Cell
                  className={clsx("tw:text-center", {
                    "tw:text-red-500": row.currentStock <= 0,
                    "tw:text-green-600": row.currentStock > 0,
                  })}
                >
                  {row.currentStock || 0} units
                </AppTable.Cell>
                <AppTable.Cell>
                  <AppBadge variant={row.statusColor || "secondary"}>
                    {row.displayStatus}
                  </AppBadge>
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-center">
                  {row.lastOrder ? (
                    <LastOrderPopover
                      triggerContent={
                        <div className="tw:text-xs tw:flex tw:items-center tw:gap-1 tw:text-gray-600 tw:cursor-pointer">
                          <DateFormat value={row.lastOrder.createdAt} />
                          <ChevronRight size={14} />
                        </div>
                      }
                      date={row.lastOrder.createdAt}
                      orderId={row.lastOrder.orderRefNo}
                      value={row.lastOrder.orderAmount}
                      status={row.lastOrder.status}
                      orderObjId={row.lastOrder.orderId}
                    />
                  ) : (
                    <span className="tw:text-gray-400">-</span>
                  )}
                </AppTable.Cell>
              </AppTable.Row>
            ))
          )}

          {showLoadMore && !loading && data.length > 0 && (
            <AppTable.Row>
              <AppTable.Cell
                colSpan={headers.length}
                className="tw:text-center tw:py-4"
              >
                <LoadMoreButton
                  loadMore={loadMore}
                  loading={loadingMore}
                  totalCount={totalCount}
                  loadedCount={loadedCount}
                />
              </AppTable.Cell>
            </AppTable.Row>
          )}
        </AppTable.Body>
      </AppTable>
    </div>
  );
};

export default DesktopView;
