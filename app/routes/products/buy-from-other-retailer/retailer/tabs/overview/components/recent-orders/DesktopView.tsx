import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import { TableSkeletonLoader } from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import type { TableHeaderItem } from "~/types/CommonTypes";
import { getOrderItemsCount, getOrderTotal, RECENT_ORDERS_LIMIT } from "./helper";

type DesktopViewProps = {
  data: any[];
  loading?: boolean;
};

const headers: TableHeaderItem[] = [
  { label: "Order", key: "orderRefNo", width: "24%" },
  { label: "Date", key: "orderedDate", width: "20%" },
  { label: "Items", key: "itemsCount", width: "12%" },
  { label: "Total", key: "orderAmount", width: "18%" },
  { label: "Status", key: "status", width: "26%" },
];

/** Read-only table of the newest orders with this retailer. */
const DesktopView = ({ data, loading }: DesktopViewProps) => {
  if (!loading && data.length === 0) {
    return <NoData />;
  }

  return (
    <AppTable size="sm" fixedLayout>
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} rows={RECENT_ORDERS_LIMIT} />
        ) : (
          data.map((row, idx) => (
            <AppTable.Row key={row.orderId || row._id || idx}>
              <AppTable.Cell>
                <AppLink asLink href={`/dashboard/orders/view/${row.orderId}`}>
                  {row.orderRefNo}
                </AppLink>
              </AppTable.Cell>
              <AppTable.Cell>
                <DateFormat
                  value={row.createdAt || row.orderedDate || null}
                  formatStr="dd MMM yyyy"
                />
                <div className="tw:text-xs tw:text-gray-500">
                  <DateFormat
                    value={row.createdAt || row.orderedDate || null}
                    formatStr="hh:mm a"
                  />
                </div>
              </AppTable.Cell>
              <AppTable.Cell>{getOrderItemsCount(row)} items</AppTable.Cell>
              <AppTable.Cell>
                <Amount value={getOrderTotal(row)} decimalPlaces={2} />
              </AppTable.Cell>
              <AppTable.Cell>
                {row._statusColor ? (
                  <AppBadge variant={row._statusColor as any}>
                    {row._statusLbl || row.status}
                  </AppBadge>
                ) : (
                  <span className="tw:text-sm tw:font-semibold">
                    {row.status}
                  </span>
                )}
              </AppTable.Cell>
            </AppTable.Row>
          ))
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
export type { DesktopViewProps };
