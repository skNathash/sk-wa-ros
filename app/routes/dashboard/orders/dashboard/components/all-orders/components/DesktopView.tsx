import React from "react";
import {
  AppTable,
  TableHeader,
  TableSkeletonLoader,
} from "~/components/core/table";
import AppBadge from "~/components/core/badge/AppBadge";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppLink from "~/components/core/link/AppLink";
import type { SortValue, TableHeaderItem } from "~/types/CommonTypes";

const headers: TableHeaderItem[] = [
  { label: "Order ID", key: "orderId", width: "13%" },
  { label: "Ordered On", key: "orderedDate", width: "15%", enableSort: true },
  { label: "Customer", key: "customer", width: "16%" },
  { label: "Type", key: "type", width: "8%" },
  // Wide enough for the longest status badge ("Approval Pending") on one line —
  // the table is fixed-layout, so a narrow column clips the pill.
  { label: "Status", key: "status", width: "15%" },
  { label: "Items", key: "items", width: "8%", isCentered: true },
  {
    label: "Sales Value",
    key: "totalValue",
    width: "11%",
    isCentered: true,
    enableSort: true,
  },
  { label: "Created By", key: "createdBy", width: "14%" },
];

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

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
    <AppTable
      container
      responsive
      fixedLayout
      containerStyle={containerStyle}
      stickyHeader
      condensed
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
          <TableSkeletonLoader cols={headers.length} rows={8} />
        ) : (
          <>
            {data.map((row, index) => (
              <AppTable.Row key={row._id + index}>
                <AppTable.Cell>
                  <AppLink
                    asLink
                    href={`/dashboard/orders/view/${row._id}`}
                    showLinkColor
                    className="tw:font-medium"
                  >
                    {row.orderRefId}
                  </AppLink>
                </AppTable.Cell>
                <AppTable.Cell>
                  <DateFormat value={row.orderedDate} />
                </AppTable.Cell>
                <AppTable.Cell>
                  {row.userLink ? (
                    <AppLink
                      asLink
                      href={row.userLink}
                      showLinkColor
                      className="tw:font-medium"
                    >
                      {row.orderedBy?.name || "--"}
                    </AppLink>
                  ) : (
                    <div className="tw:text-gray-700">
                      {row.orderedBy?.name || "--"}
                    </div>
                  )}
                </AppTable.Cell>
                <AppTable.Cell>
                  <AppBadge variant={row.typeColor}>{row.orderType}</AppBadge>
                </AppTable.Cell>
                <AppTable.Cell>
                  <AppBadge variant={row.statusColor}>
                    {row.displayStatus}
                  </AppBadge>
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-center">
                  {row.products?.length} items
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-center">
                  <Amount value={row.totalValue} />
                </AppTable.Cell>
                <AppTable.Cell>
                  <span className="tw:text-xs tw:text-gray-600">
                    {row.createdBy?.name || "-"}
                  </span>
                </AppTable.Cell>
              </AppTable.Row>
            ))}

            {showLoadMore && !loading && (
              <AppTable.Row>
                <AppTable.Cell colSpan={headers.length}>
                  <LoadMoreButton
                    loadMore={loadMore}
                    loading={loadingMore}
                    totalCount={totalCount}
                    loadedCount={loadedCount}
                  />
                </AppTable.Cell>
              </AppTable.Row>
            )}
          </>
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
