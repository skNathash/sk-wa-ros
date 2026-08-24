import { Download, Eye, Printer } from "lucide-react";
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
import useTheme from "~/hooks/useTheme";
import type { SortValue, TableHeaderItem } from "~/types/CommonTypes";
import { useTranslation } from "react-i18next";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import PrintReceipt from "~/shared/orders/print-receipt/PrintReceipt";
import ReserveBadge from "~/shared/inventory/components/ReserveBadge";

interface SaleData {
  orderId: string;
  orderRefNo: string;
  orderType: string;
  customerInfo: {
    customerId: string;
    customerType: string;
    name: string;
    mobile: string;
    // optional guest flags used in UI to detect walk-in customers
    isGuestCustomer?: boolean;
  };
  orderedDate: string | Date;
  itemsCount: number;
  orderAmount: number;
  taxAmount: number;
  paymentMethod: string;
  status: string;
  routeInfo?: {
    deliveryDate?: string | Date;
    description?: string;
    plannedDeliveryDay?: string;
    routeCode?: string;
    routeId?: string;
  };
  [key: string]: any;
}

interface DesktopViewProps {
  loading?: boolean;
  data: SaleData[];
  callback?: (args: { action: string; data: any }) => void;
  sortKey: string;
  sortValue: SortValue;
  onSort: (data: { key: string; value: SortValue }) => void;
  activeTab?: string;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  hasMoreData: boolean;
}

const getHeaders = (activeTab?: string, t?: any): TableHeaderItem[] => {
  const baseHeaders: TableHeaderItem[] = [
    { label: t("sNo"), key: "sno", width: "4%" },
    { label: t("orderId"), key: "orderRefNo", width: "14%", enableSort: true },
  ];

  // Add Customer or Purchased From column based on tab
  if (activeTab === "my-orders") {
    baseHeaders.push({
      label: t("purchasedFrom"),
      key: "sellerInfo.franchiseName",
      width: "15%",
      enableSort: true,
    });
  } else {
    baseHeaders.push({
      label: t("customer"),
      key: "customerInfo.name",
      width: "15%",
      enableSort: true,
    });
  }

  // Add remaining columns
  baseHeaders.push(
    { label: t("date"), key: "orderedDate", width: "9%", enableSort: true },
    // show route column only when not in b2c orders tab
    ...(activeTab === "b2c-orders"
      ? []
      : [
          {
            label: t("route"),
            key: "routeInfo.description",
            width: "12%",
            enableSort: false,
          },
        ]),
    { label: t("total"), key: "orderAmount", width: "8%", enableSort: true },
    {
      label: t("payment"),
      key: "paymentMethod",
      width: "10%",
      enableSort: true,
    },
    { label: t("status"), key: "status", width: "14%", enableSort: true },
    { label: t("createdBy"), key: "createdBy.name", width: "10%" },
    { label: t("action"), key: "action", width: "8%" },
  );

  return baseHeaders;
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
  activeTab,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  hasMoreData,
}) => {
  const { t } = useTranslation(["common"]);
  const isTheme2 = useTheme() === "theme-2";
  const headers = getHeaders(activeTab, t);

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
      // theme-2 packs the list pane tighter, so the rows go condensed there.
      condensed={isTheme2}
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
        ) : data.length > 0 ? (
          data.map((row, idx) => (
            <AppTable.Row key={row.orderId || idx}>
              <AppTable.Cell>{idx + 1}</AppTable.Cell>
              <AppTable.Cell>
                <AppLink asLink href={`/dashboard/orders/view/${row.orderId}`}>
                  {row.orderRefNo}
                </AppLink>

                <div className="tw:mt-1 tw:flex tw:gap-1 tw:flex-wrap">
                  <AppBadge variant={row._subTypeColor || "secondary"}>
                    {row.orderSubType}
                  </AppBadge>
                  {row._isReserveOrder && <ReserveBadge template={2} />}
                  {row.assistedOrder === true && (
                    <AppBadge variant="primary">Assisted</AppBadge>
                  )}
                  {row.quickCheckout === true && (
                    <AppBadge variant="warning">Quick Checkout</AppBadge>
                  )}
                </div>
              </AppTable.Cell>
              {/* Customer or Purchased From column */}
              {activeTab === "my-orders" ? (
                <AppTable.Cell>
                  {row.sellerInfo?.franchiseName || "-"}
                </AppTable.Cell>
              ) : (
                <AppTable.Cell>
                  {row.customerInfo?.isGuestCustomer ? (
                    <AppBadge variant="secondary">
                      {t("walkin-customer")}
                    </AppBadge>
                  ) : (
                    <div className="tw:flex tw:flex-col">
                      <AppLink
                        asLink
                        href={`/dashboard/network/view/${
                          row.orderType === "B2B" ? "b2b" : "b2c"
                        }/${row.customerInfo?.customerId}`}
                        className="tw:font-semibold"
                      >
                        {row.customerInfo?.name}
                      </AppLink>
                      {activeTab !== "my-orders" && (
                        <div className="tw:mt-1 tw:flex tw:gap-1 tw:flex-wrap">
                          <AppBadge
                            variant={row._typeColor || "default"}
                            className="tw:text-[10px] tw:px-1.5 tw:py-0"
                          >
                            {row.orderType}
                          </AppBadge>
                          {activeTab === "b2c-orders" && row.pickupType && (
                            <AppBadge
                              variant={row.pickupTypeColor}
                              className="tw:text-[10px] tw:px-1.5 tw:py-0"
                            >
                              {row.pickupType}
                            </AppBadge>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </AppTable.Cell>
              )}
              <AppTable.Cell>
                <DateFormat value={row.orderedDate} formatStr="dd MMM yyyy" />
                <div className="tw:text-xs tw:text-gray-500">
                  <DateFormat value={row.orderedDate} formatStr="hh:mm a" />
                </div>
              </AppTable.Cell>
              {/* Route column: only render when not in b2c orders tab */}
              {activeTab !== "b2c-orders" && (
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
              )}
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
                <div className="tw:flex tw:flex-col tw:gap-1 tw:items-start">
                  <AppBadge variant={row._paymentMethodColor || "secondary"}>
                    {row.paymentMethod}
                  </AppBadge>
                  <AppBadge
                    variant={row._paymentStatusColor || "default"}
                    className="tw:text-[9px]"
                  >
                    {row._paymentStatusLbl || "-"}
                  </AppBadge>
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                <AppBadge variant={row._statusColor || "default"}>
                  {row._statusLbl}
                </AppBadge>
              </AppTable.Cell>
              <AppTable.Cell>
                <span className="tw:text-xs tw:text-gray-600">
                  {row.createdBy?.name || "-"}
                </span>
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
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
                </div>
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
