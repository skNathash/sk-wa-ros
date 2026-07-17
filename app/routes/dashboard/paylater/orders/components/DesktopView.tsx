import { Download, Eye } from "lucide-react";
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
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import PrintReceipt from "~/shared/orders/print-receipt/PrintReceipt";
import type {
  SortProps,
  SortValue,
  TableHeaderItem,
  VariantColor,
} from "~/types/CommonTypes";
import { useTranslation } from "react-i18next";

interface SaleData {
  orderId: string;
  orderRefNo: string;
  orderType: string;
  customerInfo?: {
    customerId?: string;
    customerType?: string;
    name?: string;
    mobile?: string;
    isGuestCustomer?: boolean;
  };
  orderedDate: string | Date;
  itemsCount?: number;
  orderAmount?: number;
  paymentMethod?: string;
  status?: string;
  invoices?: any[];
  _statusColor?: string;
  _typeColor?: string;
  [key: string]: any;
}

interface DesktopViewProps {
  loading?: boolean;
  data: SaleData[];
  callback?: (args: { action: string; data: any }) => void;
  sortKey: string;
  sortValue: SortValue;
  onSort: (data: { key: string; value: SortValue }) => void;
  showLoadMore: boolean;
  loadedCount: number;
  loadingMore: boolean;
  loadMore: () => void;
  totalCount: number;
}

const headers: TableHeaderItem[] = [
  { label: "S.No", key: "sno", width: "5%", langKey: "sNo" },
  {
    label: "Order ID",
    key: "orderRefNo",
    width: "12%",
    enableSort: true,
    langKey: "orderId",
  },
  {
    label: "Type",
    key: "orderType",
    width: "5%",
    enableSort: true,
    langKey: "type",
  },
  {
    label: "Customer",
    key: "customerInfo.name",
    width: "15%",
    enableSort: true,
    langKey: "customer",
  },
  {
    label: "Date",
    key: "orderedDate",
    width: "12%",
    enableSort: true,
    langKey: "date",
  },
  {
    label: "Items",
    key: "itemsCount",
    width: "8%",
    enableSort: false,
    langKey: "totalItems",
  },
  {
    label: "Total",
    key: "orderAmount",
    width: "10%",
    enableSort: true,
    langKey: "total",
  },
  {
    label: "Status",
    key: "status",
    width: "12%",
    enableSort: true,
    langKey: "status",
  },
  { label: "Action", key: "action", width: "10%", langKey: "action" },
];

const containerStyle = { maxHeight: "calc(100vh - 200px)" };

const DesktopView: React.FC<DesktopViewProps> = ({
  loading,
  data,
  callback,
  sortKey,
  sortValue,
  onSort,
  showLoadMore = false,
  loadedCount,
  loadingMore = false,
  loadMore,
  totalCount = 0,
}) => {
  const { t } = useTranslation(["common"]);

  if (!loading && (!data || data.length === 0)) {
    return <NoData />;
  }

  return (
    <AppTable
      size="sm"
      stickyHeader
      fixedLayout
      container
      containerStyle={containerStyle}
      minWidth="100px"
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
          <TableSkeletonLoader cols={headers.length} rows={20} />
        ) : (
          data.map((row, idx) => (
            <AppTable.Row key={row.orderId || idx}>
              <AppTable.Cell>{idx + 1}</AppTable.Cell>
              <AppTable.Cell>
                <AppLink asLink href={`/dashboard/orders/view/${row.orderId}`}>
                  {row.orderRefNo}
                </AppLink>
              </AppTable.Cell>
              <AppTable.Cell>
                <AppBadge
                  variant={(row._typeColor as VariantColor) || "default"}
                >
                  {row.orderType}
                </AppBadge>
              </AppTable.Cell>
              <AppTable.Cell>
                {row.customerInfo?.isGuestCustomer ? (
                  <AppBadge variant="default">{t("walkin-customer")}</AppBadge>
                ) : (
                  <AppLink
                    asLink
                    href={`/dashboard/network/view/${
                      row.orderType === "B2B" ? "b2b" : "b2c"
                    }/${row.customerInfo?.customerId}`}
                    className="tw:font-semibold"
                  >
                    {row.customerInfo?.name}
                  </AppLink>
                )}
              </AppTable.Cell>
              <AppTable.Cell>
                <DateFormat value={row.orderedDate} formatStr="dd MMM yyyy" />
                <div className="tw:text-xs tw:text-gray-500">
                  <DateFormat value={row.orderedDate} formatStr="hh:mm a" />
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                {row.itemsCount} {t("items")}
              </AppTable.Cell>
              <AppTable.Cell>
                <Amount
                  value={row._payableAmt || 0}
                  decimalPlaces={2}
                  className="tw:text-red-500 tw:font-semibold"
                />
              </AppTable.Cell>
              <AppTable.Cell>
                <AppBadge
                  variant={(row._statusColor as VariantColor) || "default"}
                >
                  {row._statusLbl}
                </AppBadge>
              </AppTable.Cell>
              <AppTable.Cell>
                <AppButton
                  color="light"
                  fill="outline"
                  size="small"
                  className="tw:mr-2"
                  onClick={() =>
                    callback && callback({ action: "view-order", data: row })
                  }
                >
                  <Eye />
                </AppButton>

                {row.invoices && row.invoices.length > 0 && (
                  <>
                    {row.orderType === "B2C" ? (
                      <PrintReceipt
                        orderId={row.orderId}
                        size="small"
                        color="light"
                        variant="outline"
                        className="tw:inline-flex"
                        onlyIcon
                      />
                    ) : (
                      <AppButton
                        color="light"
                        fill="outline"
                        size="small"
                        onClick={() =>
                          callback &&
                          callback({ action: "download-invoice", data: row })
                        }
                      >
                        <Download />
                      </AppButton>
                    )}
                  </>
                )}
              </AppTable.Cell>
            </AppTable.Row>
          ))
        )}
        {showLoadMore && !loading && (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length}>
              <LoadMoreButton
                loadMore={loadMore}
                loading={!!loadingMore}
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
