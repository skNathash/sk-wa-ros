import { Calendar, User } from "lucide-react";
import React, { useMemo } from "react";
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
import useTheme from "~/hooks/useTheme";

interface DesktopViewProps {
  loading?: boolean;
  data: any[];
  callback: (data: any) => void;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  hasMoreData: boolean;
  tab: string;
}

/**
 * One header set for both tabs: the collection date rides under the settlement
 * id and the handed-over date under the status, so the handed-over tab no
 * longer needs a column the pending tab does not have.
 */

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

const DesktopView: React.FC<DesktopViewProps> = ({
  loading,
  data,
  callback,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  hasMoreData,
  tab,
}) => {
  const { t } = useTranslation("common");
  const isTheme2 = useTheme() === "theme-2";

  const headers = useMemo(() => {
    const base = [
      {
        label: "ID",
        langKey: "id",
        key: "settlementId",
        enableSort: false,
        width: "22%",
      },
      {
        label: "Order Details",
        langKey: "orderDetails",
        key: "orderDetails",
        enableSort: false,
        width: "18%",
      },
      {
        label: "Delivery Agent",
        langKey: "deliveryAgent",
        key: "collectionInfo",
        enableSort: false,
        width: "22%",
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
        width: "15%",
      },
    ];

    if (tab !== "handedover") {
      base.push({
        label: "Action",
        langKey: "action",
        key: "action",
        enableSort: false,
        width: "10%",
      });
    }
    return base;
  }, [tab]);

  if (!loading && !data?.length) {
    return <NoData />;
  }

  return (
    <AppTable
      size="sm"
      stickyHeader
      fixedLayout
      container
      minWidth="900px"
      containerStyle={containerStyle}
      // theme-2 packs the list pane tighter, so the rows go condensed there.
      condensed={isTheme2}
    >
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} rows={20} />
        ) : (
          data.map((row, idx) => (
            <AppTable.Row key={row._id || idx}>
              {/* ID + when the cash was collected */}
              <AppTable.Cell>
                {/* The fixed-width column is narrower than a settlement id, so
                    the id breaks onto a second line instead of being clipped
                    by the cell's ellipsis. */}
                <div className="tw:font-medium tw:text-gray-900 tw:wrap-break-word">
                  {row.settlementId}
                </div>
                <span className="tw:mt-0.5 tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-500">
                  <Calendar size={12} />
                  {row.createdAt ? <DateFormat value={row.createdAt} /> : "-"}
                </span>
              </AppTable.Cell>

              {/* Order Details */}
              <AppTable.Cell>
                <AppLink
                  href={`/dashboard/orders/view/${row.orderId}`}
                  asLink
                  showLinkColor
                >
                  {row.orderRefId}
                </AppLink>
              </AppTable.Cell>

              {/* Collection Info (shipmentUserInfo) always shown */}
              <AppTable.Cell>
                <span className="tw:flex tw:items-center tw:gap-1 tw:text-gray-800">
                  <User size={12} className="tw:text-gray-500" />
                  <AppLink
                    href={`/dashboard/employee/view/${row.shipmentUserInfo?.id}`}
                    asLink
                    showLinkColor
                  >
                    {row.shipmentUserInfo?.name || "-"}
                  </AppLink>
                </span>
              </AppTable.Cell>

              {/* Amount */}
              <AppTable.Cell>
                <Amount
                  value={row.totalAmount}
                  decimalPlaces={2}
                  className="tw:text-slate-500 tw:font-medium"
                />
              </AppTable.Cell>

              {/* Status — carrying the handed-over date, so the handed-over tab
                  reads with the same columns as the pending one. */}
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
                {row.settledOn && (
                  <div className="tw:mt-1 tw:text-xs tw:text-gray-500">
                    {t("collectedOn")}:{" "}
                    <DateFormat
                      value={row.settledOn}
                      formatStr="dd MMM yyyy, hh:mm a"
                    />
                  </div>
                )}
              </AppTable.Cell>

              {/* Action */}
              {tab !== "handedover" && (
                <AppTable.Cell>
                  {row.status === "SettlementInitiated" ? (
                    <AppButton
                      type="button"
                      onClick={() =>
                        callback({ action: "handover", data: row })
                      }
                      size="small"
                    >
                      {t("handover")}
                    </AppButton>
                  ) : (
                    <span className="tw:text-gray-400">-</span>
                  )}
                </AppTable.Cell>
              )}
            </AppTable.Row>
          ))
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
