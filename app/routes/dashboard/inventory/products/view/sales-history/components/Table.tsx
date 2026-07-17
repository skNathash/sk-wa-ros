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
import type {
  SortProps,
  SortValue,
  TableHeaderItem,
} from "~/types/CommonTypes";

interface TableProps {
  data: Array<Record<string, any>>;
  loading?: boolean;
  emptyText?: string;
  onSort?: (data: SortProps) => void;
  sortKey?: string;
  sortValue?: SortValue;
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore: () => void;
  totalCount?: number;
  loadedCount: number;
}

const headers: TableHeaderItem[] = [
  { key: "orderDate", label: "Order Date", width: "10%" },
  { key: "orderId", label: "Order ID", width: "18%" },
  { key: "customerName", label: "Customer", width: "18%" },
  { key: "quantity", label: "Quantity", width: "10%" },
  { key: "price", label: "Unit Price", width: "10%" },
  {
    key: "itemTotalValue",
    label: "Total Value",
    width: "12%",
  },
  { key: "orderType", label: "Order Type", width: "10%" },
  { key: "status", label: "Status", width: "15%" },
];

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

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
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length} className="tw:text-center">
              {t("loading")}
            </AppTable.Cell>
          </AppTable.Row>
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
                <DateFormat value={row.orderDate} formatStr="dd MMM yyyy" />
                <div className="tw:text-xs tw:text-gray-500">
                  <DateFormat value={row.orderDate} formatStr="hh:mm a" />
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                <AppBadge variant="light">
                  <AppLink
                    asLink
                    href={`/dashboard/orders/view/${row._id}`}
                    className="tw:text-blue-600 tw:font-normal"
                  >
                    {row.orderRefNo}
                  </AppLink>
                </AppBadge>
              </AppTable.Cell>
              <AppTable.Cell className="tw:font-medium">
                {row.customerName ? (
                  <AppLink
                    asLink
                    href={`/dashboard/network/view/b2c/${row.customerId}`}
                  >
                    {row.customerName || "--"}
                  </AppLink>
                ) : (
                  <span className="tw:text-slate-600">Walk-in Customer</span>
                )}
              </AppTable.Cell>
              <AppTable.Cell className="tw:font-medium">
                {row.quantity}
              </AppTable.Cell>
              <AppTable.Cell className="tw:font-medium">
                <Amount value={row.price} />
              </AppTable.Cell>
              <AppTable.Cell className="tw:font-medium tw:text-green-600">
                <Amount value={row.itemTotalValue} />
              </AppTable.Cell>
              <AppTable.Cell>
                <AppBadge variant={row._typeColor || "default"}>
                  {row.orderType || "--"}
                </AppBadge>
              </AppTable.Cell>
              <AppTable.Cell>
                <AppBadge variant={row._statusColor || "default"}>
                  {row._statusLbl || row.status || "--"}
                </AppBadge>
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
