import React from "react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import { TableSkeletonLoader } from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import type { TableHeaderItem } from "~/types/CommonTypes";

interface StatementRow {
  _id?: string;
  date?: string | Date;
  userInfo?: { name?: string; mobile?: string };
  description?: string;
  sourceReference?: string;
  rawAmount?: number;
  rawBalance?: number;
  [key: string]: any;
}

interface DesktopViewProps {
  loading?: boolean;
  data: StatementRow[];
  callback?: (payload: { action: string; data: any }) => void;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  hasMoreData: boolean;
}

const headers: TableHeaderItem[] = [
  {
    label: "Date",
    key: "date",
    enableSort: false,
    width: "12%",
    langKey: "orderDate",
  },
  {
    label: "Description",
    key: "description",
    enableSort: false,
    width: "28%",
    langKey: "description",
  },
  {
    label: "Order ID",
    key: "orderId",
    enableSort: false,
    width: "12%",
    langKey: "orderId",
  },
  {
    label: "Amount",
    key: "amount",
    enableSort: false,
    width: "8%",
    langKey: "amountDebit",
  },
  {
    label: "Available Limit",
    key: "balance",
    enableSort: false,
    width: "8%",
    langKey: "availableLimit",
  },
];

const DesktopView: React.FC<DesktopViewProps> = ({
  loading,
  data,
  callback,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  hasMoreData,
}) => {
  if (!data || data.length === 0) {
    return <NoData />;
  }

  return (
    <AppTable size="sm" stickyHeader fixedLayout container minWidth="100px">
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <AppTable.Row>
            <TableSkeletonLoader cols={headers.length} />
          </AppTable.Row>
        ) : null}
        {data.map((row, idx) => (
          <AppTable.Row key={idx}>
            <AppTable.Cell>
              <DateFormat value={row.date ?? ""} formatStr="dd MMM yyyy" />
              <div className="tw:text-xs tw:text-slate-500">
                <DateFormat value={row.date ?? ""} formatStr="hh:mm a" />
              </div>
            </AppTable.Cell>

            <AppTable.Cell>
              <div className="tw:text-sm tw:md:text-xs tw:text-slate-600">
                {row.description || "-"}
              </div>
            </AppTable.Cell>

            <AppTable.Cell>
              <div className="tw:text-sm tw:text-gray-600">
                <AppLink
                  asLink
                  href={`/dashboard/orders/view/${row.orderDetails?.orderId}`}
                >
                  {row.sourceReference || "-"}
                </AppLink>
              </div>
            </AppTable.Cell>

            <AppTable.Cell>
              <Amount
                value={row.rawAmount ?? 0}
                decimalPlaces={2}
                className="tw:text-red-500 tw:font-semibold"
              />
            </AppTable.Cell>

            <AppTable.Cell>
              <Amount
                value={row.rawBalance ?? 0}
                decimalPlaces={2}
                className="tw:text-green-500 tw:font-semibold"
              />
            </AppTable.Cell>
          </AppTable.Row>
        ))}

        {hasMoreData && !loading && data.length > 0 && (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length} className="tw:text-center">
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

export default DesktopView;
