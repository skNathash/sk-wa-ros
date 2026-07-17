import { Download, Eye } from "lucide-react";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import {
  TableSkeletonLoader,
  type TableHeaderItem,
} from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import type { SortValue } from "~/types/CommonTypes";
import { useTranslation } from "react-i18next";

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
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore: () => void;
  totalCount?: number;
  loadedCount: number;
}

const headers: TableHeaderItem[] = [
  { langKey: "sNo", key: "sno", width: "5%" },
  { langKey: "orderId", key: "orderRefNo", width: "13%", enableSort: true },
  { langKey: "type", key: "orderType", width: "8%", enableSort: true },
  { langKey: "date", key: "orderedDate", width: "12%", enableSort: true },
  {
    langKey: "route",
    key: "routeInfo.description",
    width: "15%",
    enableSort: false,
  },
  { langKey: "total", key: "orderAmount", width: "10%", enableSort: true },
  { langKey: "payment", key: "paymentMethod", width: "8%", enableSort: true },
  { langKey: "status", key: "status", width: "11%", enableSort: true },
  { langKey: "action", key: "action", width: "10%" },
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
  showLoadMore = false,
  loadingMore = false,
  loadMore,
  totalCount = 0,
  loadedCount,
}) => {
  const { t } = useTranslation(["common"]);

  return (
    <AppTable
      size="sm"
      stickyHeader
      fixedLayout
      condensed
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

                <div className="tw:mt-1">
                  <AppBadge variant={row._subTypeColor || "secondary"}>
                    {row.orderSubType}
                  </AppBadge>
                </div>
              </AppTable.Cell>
              <AppTable.Cell>{row.orderType}</AppTable.Cell>
              <AppTable.Cell>
                <DateFormat value={row.orderedDate} formatStr="dd MMM yyyy" />
                <div className="tw:text-xs tw:text-gray-500">
                  <DateFormat value={row.orderedDate} formatStr="hh:mm a" />
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:flex tw:flex-col tw:gap-1">
                  <div className="tw:flex tw:flex-col">
                    <span className="tw:text-[10px] tw:text-gray-400 tw:font-medium tw:uppercase">
                      {t("route")}
                    </span>
                    <span className="tw:text-sm tw:font-medium tw:text-gray-700">
                      {row.routeInfo?.description ||
                        row.routeInfo?.routeCode ||
                        "-"}
                    </span>
                  </div>
                  {row.routeInfo?.deliveryDate && (
                    <div className="tw:flex tw:flex-col">
                      <span className="tw:text-[10px] tw:text-gray-400 tw:font-medium tw:uppercase">
                        {t("deliveryDate")}
                      </span>
                      <span className="tw:text-xs tw:text-gray-500">
                        <DateFormat
                          value={row.routeInfo.deliveryDate}
                          formatStr="dd MMM yyyy"
                        />
                      </span>
                    </div>
                  )}
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:flex tw:flex-col">
                  <Amount
                    value={row.orderAmount}
                    decimalPlaces={2}
                    className="tw:font-semibold"
                  />
                  <span className="tw:text-xs tw:text-gray-500">
                    {row.itemsCount} {t("items")}
                  </span>
                </div>
              </AppTable.Cell>
              <AppTable.Cell className="tw:uppercase">
                <AppBadge variant={row._paymentMethodColor || "secondary"}>
                  {row.paymentMethod}
                </AppBadge>
              </AppTable.Cell>
              <AppTable.Cell>
                <AppBadge variant={row._statusColor || "default"}>
                  {row._statusLbl || row.status}
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

export default DesktopView;
