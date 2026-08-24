import { Phone } from "lucide-react";
import React from "react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";

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

// Widths add up to 100% so the fixed layout has nothing left to redistribute.
const headers = [
  { label: "Date", key: "date", enableSort: false, width: "12%" },
  { label: "Customer", key: "customer", enableSort: false, width: "22%" },
  { label: "Description", key: "description", enableSort: false, width: "26%" },
  { label: "Order ID", key: "orderId", enableSort: false, width: "14%" },
  { label: "Amount", key: "amount", enableSort: false, width: "13%" },
  { label: "Available Limit", key: "balance", enableSort: false, width: "13%" },
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
  if (loading) {
    return (
      <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
        <AppSpinner />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <NoData />;
  }

  return (
    <AppTable size="sm" stickyHeader fixedLayout container minWidth="900px">
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {data.map((row, idx) => (
          <AppTable.Row key={idx}>
            <AppTable.Cell>
              <DateFormat value={row.date ?? ""} formatStr="dd MMM yyyy" />
              <div className="tw:text-xs tw:text-slate-500">
                <DateFormat value={row.date ?? ""} formatStr="hh:mm a" />
              </div>
            </AppTable.Cell>

            <AppTable.Cell>
              <div className="tw:flex tw:items-center tw:gap-1">
                <AppBadge
                  variant={row.user?.type === "B2C" ? "primary" : "secondary"}
                >
                  {row.user?.type || "-"}
                </AppBadge>
                <div className="tw:font-medium">
                  <AppLink asLink href={row.user?.redirectionLink ?? "#"}>
                    {row.user?.name || "-"}
                  </AppLink>
                </div>
              </div>
              {row.user?.mobile && (
                <div className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center tw:gap-1 tw:mt-1">
                  <Phone size={12} className="tw:text-gray-500" />
                  <AppLink asLink href={`tel:${row.user?.mobile}`}>
                    {row.user?.mobile}
                  </AppLink>
                </div>
              )}
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
