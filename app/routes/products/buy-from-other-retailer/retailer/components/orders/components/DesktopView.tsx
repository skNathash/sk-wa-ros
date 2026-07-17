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
import type { SortValue, TableHeaderItem } from "~/types/CommonTypes";
import { useTranslation } from "react-i18next";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import PrintReceipt from "~/shared/orders/print-receipt/PrintReceipt";

interface OrderData {
  _id: string;
  orderId: string;
  orderRefNo: string;
  status: string;
  createdAt?: string;
  orderedDate?: string | Date;
  totalAmount?: number;
  orderAmount?: number;
  items?: any[];
  itemsCount?: number;
  paymentMethod?: string;
  orderType?: string;
  _typeColor?: string;
  _statusColor?: string;
  _statusLbl?: string;
  invoices?: any[];
  [key: string]: any;
}

interface DesktopViewProps {
  loading?: boolean;
  data: OrderData[];
  callback?: (args: { action: string; data: any }) => void;
  sortKey?: string;
  sortValue?: SortValue;
  onSort?: (data: { key: string; value: SortValue }) => void;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  hasMoreData: boolean;
}

const getHeaders = (t: any): TableHeaderItem[] => [
  { label: t("sNo"), key: "sno", width: "5%" },
  { label: t("orderId"), key: "orderRefNo", width: "15%", enableSort: true },
  { label: t("seller"), key: "seller", width: "12%" },
  { label: t("type"), key: "orderType", width: "8%", enableSort: true },
  { label: t("date"), key: "orderedDate", width: "15%", enableSort: true },
  { label: t("items"), key: "itemsCount", width: "8%" },
  { label: t("total"), key: "orderAmount", width: "12%", enableSort: true },
  { label: t("payment"), key: "paymentMethod", width: "10%", enableSort: true },
  { label: t("status"), key: "status", width: "12%", enableSort: true },
  { label: t("action"), key: "action", width: "10%" },
];

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
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  hasMoreData,
}) => {
  const { t } = useTranslation(["common"]);
  const headers = getHeaders(t);

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
      minWidth="1100px"
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
        ) : data.length > 0 ? (
          data.map((row, idx) => (
            <AppTable.Row key={row.orderId || row._id || idx}>
              <AppTable.Cell>{idx + 1}</AppTable.Cell>
              <AppTable.Cell>
                <AppLink asLink href={`/dashboard/orders/view/${row.orderId}`}>
                  {row.orderRefNo}
                </AppLink>
              </AppTable.Cell>
              <AppTable.Cell>
                {row.sellerInfo?.franchiseId ? (
                  <AppLink
                    asLink
                    href={`/dashboard/network/view/b2b/${row.sellerInfo.franchiseId}`}
                    className="tw:text-blue-600"
                  >
                    {row.sellerInfo?.name ||
                      row.sellerInfo?.franchiseName ||
                      "-"}
                  </AppLink>
                ) : (
                  <>
                    {row.sellerInfo?.name ||
                      row.sellerInfo?.franchiseName ||
                      "-"}
                  </>
                )}
              </AppTable.Cell>
              <AppTable.Cell>
                {row._typeColor ? (
                  <AppBadge variant={row._typeColor as unknown as any}>
                    {row.orderType}
                  </AppBadge>
                ) : (
                  row.orderType || "-"
                )}
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
              <AppTable.Cell>
                {row.items?.length || row.itemsCount || 0} {t("items")}
              </AppTable.Cell>
              <AppTable.Cell>
                <Amount
                  value={row.totalAmount ?? row.orderAmount ?? 0}
                  decimalPlaces={2}
                />
              </AppTable.Cell>
              <AppTable.Cell className="tw:uppercase">
                {row.paymentMethod || row.paymentType || "-"}
              </AppTable.Cell>
              <AppTable.Cell>
                {row._statusColor ? (
                  <AppBadge
                    variant={(row._statusColor as unknown as any) || "default"}
                  >
                    {row._statusLbl || row.status}
                  </AppBadge>
                ) : (
                  <div className="tw:text-sm tw:font-semibold">
                    {row.status}
                  </div>
                )}
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
                        onlyIcon={true}
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
        ) : (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length}>
              <NoData />
            </AppTable.Cell>
          </AppTable.Row>
        )}
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
