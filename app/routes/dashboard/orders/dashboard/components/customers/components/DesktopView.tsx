import React from "react";
import {
  AppTable,
  TableHeader,
  TableSkeletonLoader,
} from "~/components/core/table";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppBadge from "~/components/core/badge/AppBadge";
import Amount from "~/components/core/amount/Amount";
import { ChevronRight } from "lucide-react";
import LastOrderPopover from "../../LastOrderPopover";
import type { SortValue, TableHeaderItem } from "~/types/CommonTypes";

const headers: TableHeaderItem[] = [
  { label: "S.No", key: "sno", width: "5%" },
  { label: "Name", key: "customerName", width: "30%", enableSort: true },
  { label: "Type", key: "type", width: "10%", isCentered: true },
  {
    label: "Last Order",
    key: "lastOrder.createdAt",
    width: "18%",
    enableSort: true,
  },
  { label: "Total Orders", key: "totalOrders", width: "12%", isCentered: true },
  { label: "Sales Value", key: "orderValue", width: "15%", isCentered: true },
  {
    label: "Total Unique Products",
    key: "totalUniqueProducts",
    width: "13%",
    isCentered: true,
  },
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
            {data.map((row, idx) => (
              <AppTable.Row key={row.customerId}>
                <AppTable.Cell>{idx + 1}</AppTable.Cell>
                <AppTable.Cell>
                  <div className="tw:font-medium tw:text-gray-900">
                    <AppLink asLink href={row.userLink} showLinkColor>
                      {row.customerName}
                    </AppLink>
                  </div>
                  {row.addressStr && (
                    <div className="tw:text-gray-600">{row.addressStr}</div>
                  )}
                </AppTable.Cell>

                <AppTable.Cell className="tw:text-center">
                  <AppBadge variant={row.typeColor}>{row.orderType}</AppBadge>
                </AppTable.Cell>

                <AppTable.Cell className="tw:text-center">
                  {row.lastOrder ? (
                    <LastOrderPopover
                      triggerContent={
                        <div className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center tw:gap-1 tw:cursor-pointer">
                          <DateFormat value={row.lastOrder.createdAt} />
                          <ChevronRight
                            size={14}
                            className="tw:text-slate-400"
                          />
                        </div>
                      }
                      date={row.lastOrder.createdAt}
                      orderId={row.lastOrder.orderRefNo}
                      value={row.lastOrder.orderAmount}
                      status={row.lastOrder.status}
                      orderObjId={row.lastOrder.orderId}
                    />
                  ) : (
                    "-"
                  )}
                </AppTable.Cell>

                <AppTable.Cell className="tw:text-center">
                  {row.totalOrders || 0}
                </AppTable.Cell>

                <AppTable.Cell className="tw:text-center">
                  <Amount value={row.grandTotalValue || 0} decimalPlaces={0} />
                </AppTable.Cell>

                <AppTable.Cell className="tw:text-center">
                  {row.totalUniqueProducts || 0}
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
