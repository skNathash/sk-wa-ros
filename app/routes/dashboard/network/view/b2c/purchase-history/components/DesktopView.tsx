import { Eye } from "lucide-react";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import { TableSkeletonLoader } from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import type { SortValue, TableHeaderItem } from "~/types/CommonTypes";

interface SaleData {
  orderId: string;
  orderRefNo: string;
  orderType: string;
  customerInfo: {
    customerId: string;
    customerType: string;
    name: string;
    mobile: string;
  };
  orderedDate: string | Date;
  itemsCount: number;
  orderAmount: number;
  taxAmount: number;
  paymentMethod: string;
  status: string;
  [key: string]: any;
}

interface DesktopViewProps {
  loading?: boolean;
  data: SaleData[];
  callback?: (args: { action: string; data: any }) => void;
  sortKey: string;
  sortValue: SortValue;
  onSort: (data: { key: string; value: SortValue }) => void;
}

const getHeaders = (): TableHeaderItem[] => {
  return [
    { label: "S.No", key: "sno", width: "5%" },
    { label: "Order ID", key: "orderRefNo", width: "15%", enableSort: true },
    { label: "Type", key: "orderType", width: "10%", enableSort: true },
    { label: "Date", key: "orderedDate", width: "10%", enableSort: true },
    { label: "Status", key: "status", width: "15%", enableSort: true },
    { label: "Items", key: "itemsCount", width: "15%", enableSort: true },
    { label: "Amount", key: "orderAmount", width: "15%", enableSort: true },
    { label: "Action", key: "action", width: "10%" },
  ];
};

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

const DesktopView: React.FC<DesktopViewProps> = ({
  loading,
  data,
  callback,
  sortKey,
  sortValue,
  onSort,
}) => {
  const headers = getHeaders();

  if (!loading && data.length === 0) {
    return <NoData />;
  }

  return (
    <AppTable
      size="sm"
      stickyHeader
      fixedLayout
      container
      containerStyle={containerStyle}
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
          <TableSkeletonLoader cols={headers.length} rows={30} />
        ) : data && data.length > 0 ? (
          data.map((row, idx) => (
            <AppTable.Row key={row.orderId || idx}>
              <AppTable.Cell>{idx + 1}</AppTable.Cell>
              <AppTable.Cell>
                <AppLink asLink href={`/dashboard/orders/view/${row.orderId}`}>
                  {row.orderRefNo}
                </AppLink>
              </AppTable.Cell>
              <AppTable.Cell>{row.orderType}</AppTable.Cell>
              <AppTable.Cell>
                <DateFormat value={row.orderedDate} formatStr="dd MMM yyyy" />
                <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
                  <DateFormat value={row.orderedDate} formatStr="hh:mm a" />
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                <AppBadge variant={row._statusColor || "default"}>
                  {row.status}
                </AppBadge>
              </AppTable.Cell>
              <AppTable.Cell>{row.itemsCount} items</AppTable.Cell>
              <AppTable.Cell>
                <Amount
                  value={row.orderAmount}
                  decimalPlaces={2}
                  className="tw:font-medium"
                />
              </AppTable.Cell>
              <AppTable.Cell>
                <AppButton
                  color="light"
                  fill="outline"
                  size="small"
                  onClick={() =>
                    callback && callback({ action: "view-order", data: row })
                  }
                >
                  <Eye />
                </AppButton>
              </AppTable.Cell>
            </AppTable.Row>
          ))
        ) : (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length}>
              <NoData />
            </AppTable.Cell>
          </AppTable.Row>
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
