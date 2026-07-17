import React from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import TableSkeletonLoader from "~/components/core/table/TableSkeletonLoader";
import type { TableHeaderItem } from "~/types/CommonTypes";

interface TableProps {
  data: Array<Record<string, any>>;
  loading?: boolean;
  emptyText?: string;
  onSort?: (data: { key: string; value: "asc" | "desc" | undefined }) => void;
  sortKey?: string;
  sortValue?: "asc" | "desc" | undefined;
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore: () => void;
  totalCount?: number;
  loadedCount: number;
}

const headers: TableHeaderItem[] = [
  { key: "orderDate", label: "Order Date", langKey: "orderDate", width: "10%" },
  { key: "orderId", label: "PO Number", langKey: "poNumber", width: "12%" },
  { key: "vendorName", label: "Vendor", langKey: "vendor", width: "15%" },
  { key: "quantity", label: "Order Qty", langKey: "orderQty", width: "10%" },
  {
    key: "receivedQty",
    label: "Received Qty",
    langKey: "receivedQty",
    width: "10%",
  },
  { key: "unitPrice", label: "Unit Price", langKey: "unitPrice", width: "10%" },
  {
    key: "totalPrice",
    label: "Total Price",
    langKey: "totalPrice",
    width: "10%",
  },
  { key: "status", label: "Status", langKey: "status", width: "12%" },
  {
    key: "receivedDate",
    label: "Delivery Date",
    langKey: "deliveryDate",
    width: "10%",
  },
];

const Table: React.FC<TableProps> = ({
  data,
  loading = false,
  emptyText,
  onSort,
  sortKey,
  sortValue,
  showLoadMore = false,
  loadingMore = false,
  loadMore,
  totalCount = 0,
  loadedCount,
}) => {
  const { t } = useTranslation(["common"]);

  const containerStyle = {
    maxHeight: "calc(100vh - 200px)",
  };

  const defaultEmptyText = emptyText || t("noDataFound");

  if (!loading && data.length === 0) {
    return <NoData />;
  }

  return (
    <AppTable
      size="sm"
      fixedLayout
      container
      containerStyle={containerStyle}
      stickyHeader
      minWidth="1000px"
    >
      <AppTable.Header>
        <TableHeader
          headers={headers}
          onSort={onSort}
          sortKey={sortKey}
          sortValue={sortValue}
        />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} rows={10} />
        ) : data.length === 0 ? (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length} className="tw:text-center">
              {defaultEmptyText}
            </AppTable.Cell>
          </AppTable.Row>
        ) : (
          data.map((row, idx) => (
            <AppTable.Row key={row._id || idx}>
              <AppTable.Cell>
                <DateFormat value={row.createdAt} formatStr="dd MMM yyyy" />
                <div className="tw:text-xs tw:text-gray-500">
                  <DateFormat value={row.createdAt} formatStr="hh:mm a" />
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                <AppBadge variant="light">
                  <AppLink
                    asLink
                    href={`/dashboard/purchase-order/view/${row._id}`}
                  >
                    <code>{row.orderId}</code>
                  </AppLink>
                </AppBadge>
              </AppTable.Cell>
              <AppTable.Cell>
                <AppLink asLink href={`/dashboard/vendor/view/${row.vendorId}`}>
                  {row.vendorName}
                </AppLink>
                <div className="tw:text-xs tw:text-gray-500">
                  ID: {row.vendorId}
                </div>
              </AppTable.Cell>
              <AppTable.Cell className="tw:font-medium">
                {row.quantity}
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-green-600 tw:font-medium">
                {row.receivedQuantity}
              </AppTable.Cell>
              <AppTable.Cell className="tw:font-medium">
                <Amount value={row.purchasePrice} />
              </AppTable.Cell>
              <AppTable.Cell className="tw:font-medium">
                <Amount value={row.purchasePrice * row.quantity} />
              </AppTable.Cell>
              <AppTable.Cell>
                <AppBadge variant={row._statusColor}>
                  {row._statusLbl || row.status || "--"}
                </AppBadge>
              </AppTable.Cell>
              <AppTable.Cell>
                {row.receivedDate ? (
                  <>
                    <DateFormat
                      value={row.receivedDate}
                      formatStr="dd MMM yyyy"
                    />
                    <div className="tw:text-xs tw:text-gray-500">Delivered</div>
                  </>
                ) : (
                  <>
                    <DateFormat
                      value={row.expectedDeliveryDate}
                      formatStr="dd MMM yyyy"
                    />
                    <div className="tw:text-xs tw:text-gray-500">Expected</div>
                  </>
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
  );
};

export default Table;
