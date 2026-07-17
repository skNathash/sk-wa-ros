import { Calendar, User } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import { TableSkeletonLoader } from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";

interface DesktopViewProps {
  loading?: boolean;
  data: any[];
  callback: (data: any) => void;
  tab?: string;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  hasMoreData: boolean;
}

// Headers for all tabs except handedover
const baseHeaders = [
  {
    label: "ID",
    langKey: "id",
    key: "settlementId",
    enableSort: false,
    width: "14%",
  },
  {
    label: "Order Details",
    langKey: "orderDetails",
    key: "orderDetails",
    enableSort: false,
    width: "14%",
  },
  {
    label: "Delivery Agent",
    langKey: "deliveryAgent",
    key: "collectionInfo",
    enableSort: false,
    width: "25%",
  },
  {
    label: "Amount",
    langKey: "amount",
    key: "amount",
    enableSort: false,
    width: "15%",
  },
  {
    label: "Status",
    langKey: "status",
    key: "status",
    enableSort: false,
    width: "15%",
  },
];

// For handedover tab, show Collected On instead of Action
const handedoverHeaders = [
  {
    label: "ID",
    langKey: "id",
    key: "settlementId",
    enableSort: false,
    width: "14%",
  },
  {
    label: "Order Details",
    langKey: "orderDetails",
    key: "orderDetails",
    enableSort: false,
    width: "14%",
  },
  {
    label: "Delivery Agent",
    langKey: "deliveryAgent",
    key: "collectionInfo",
    enableSort: false,
    width: "20%",
  },
  {
    label: "Amount",
    langKey: "amount",
    key: "amount",
    enableSort: false,
    width: "13%",
  },
  {
    label: "Status",
    langKey: "status",
    key: "status",
    enableSort: false,
    width: "13%",
  },
  {
    label: "Collected On",
    langKey: "collectedOn",
    key: "collectedOn",
    enableSort: false,
    width: "13%",
  },
];

const headers = (tab: string | undefined) =>
  tab === "handedover"
    ? handedoverHeaders
    : [
        ...baseHeaders,
        {
          label: "Action",
          langKey: "action",
          key: "action",
          enableSort: false,
          width: "10%",
        },
      ];

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

const DesktopView: React.FC<DesktopViewProps> = ({
  loading,
  data,
  callback,
  tab,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  hasMoreData,
}) => {
  const { t } = useTranslation("common");

  if (!loading && !data?.length) {
    return <NoData />;
  }

  return (
    <AppTable
      size="sm"
      stickyHeader
      fixedLayout
      container
      minWidth="1000px"
      containerStyle={containerStyle}
    >
      <AppTable.Header>
        <TableHeader headers={headers(tab)} />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers(tab).length} rows={20} />
        ) : data && data.length > 0 ? (
          data.map((row, idx) => (
            <AppTable.Row key={row._id || idx}>
              {/* ID */}
              <AppTable.Cell>{row.settlementId}</AppTable.Cell>

              {/* Order Details */}
              <AppTable.Cell>
                <div className="tw:mb-1">
                  <AppLink
                    href={`/dashboard/orders/view/${row.orderId}`}
                    asLink
                    showLinkColor
                  >
                    {row.orderRefId}
                  </AppLink>
                </div>
              </AppTable.Cell>

              {/* Collection Info (shipmentUserInfo) always shown */}
              <AppTable.Cell>
                <div className="tw:flex tw:flex-col tw:gap-1">
                  <span className="tw:text-gray-800 tw:flex tw:items-center tw:gap-1">
                    <User size={12} className="tw:text-gray-500" />{" "}
                    <AppLink
                      href={`/dashboard/employee/view/${row.shipmentUserInfo?.id}`}
                      asLink
                      showLinkColor
                    >
                      {row.shipmentUserInfo?.name || "-"}
                    </AppLink>
                  </span>
                  <span className="tw:text-xs tw:text-gray-800 tw:flex tw:items-center tw:gap-1">
                    <Calendar size={12} className="tw:text-gray-500" />
                    {row.createdAt ? <DateFormat value={row.createdAt} /> : "-"}
                  </span>
                </div>
              </AppTable.Cell>

              {/* Amount */}
              <AppTable.Cell>
                <Amount
                  value={row.totalAmount}
                  decimalPlaces={2}
                  className="tw:ml-1 tw:text-slate-500 tw:font-medium"
                />
              </AppTable.Cell>

              {/* Status */}
              <AppTable.Cell>
                <AppBadge
                  variant={
                    row.status === "Settled"
                      ? "success"
                      : row.status === "SettlementInitiated"
                        ? "warning"
                        : "default"
                  }
                >
                  {row.status}
                </AppBadge>
              </AppTable.Cell>

              {/* Collected On for handedover tab */}
              {tab === "handedover" && (
                <AppTable.Cell>
                  {row.settledOn ? (
                    <div>
                      <DateFormat
                        value={row.settledOn}
                        formatStr="dd MMM yyyy"
                      />
                      <div className="tw:text-xs tw:text-gray-500">
                        <DateFormat value={row.settledOn} formatStr="hh:mm a" />
                      </div>
                    </div>
                  ) : (
                    "-"
                  )}
                </AppTable.Cell>
              )}

              {/* Action - only for non-handedover tabs */}
              {tab !== "handedover" && (
                <AppTable.Cell>
                  {row.status === "SettlementInitiated" && (
                    <AppButton
                      type="button"
                      onClick={() =>
                        callback({ action: "handover", data: row })
                      }
                      size="small"
                    >
                      {t("handover")}
                    </AppButton>
                  )}
                </AppTable.Cell>
              )}
            </AppTable.Row>
          ))
        ) : (
          <AppTable.Row>
            <AppTable.Cell
              colSpan={headers(tab).length}
              className="tw:text-center"
            >
              {t("noDataFound")}
            </AppTable.Cell>
          </AppTable.Row>
        )}
        {hasMoreData && !loading && data.length > 0 && (
          <AppTable.Row>
            <AppTable.Cell
              colSpan={headers(tab).length}
              className="tw:text-center"
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
