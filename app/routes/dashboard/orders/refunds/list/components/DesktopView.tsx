import { Eye } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import { TableSkeletonLoader } from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import type { TableHeaderItem } from "~/types/CommonTypes";

interface Props {
  loading?: boolean;
  data: any[];
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  hasMoreData: boolean;
}

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

const DesktopView: React.FC<Props> = ({
  loading,
  data,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  hasMoreData,
}) => {
  const { t } = useTranslation(["common"]);

  const headers: TableHeaderItem[] = [
    { label: "#", key: "sno", width: "4%" },
    {
      label: t("refundRef", "Refund Ref"),
      key: "refundSettlementId",
      width: "12%",
    },
    { label: t("orderId"), key: "orderRefNo", width: "15%" },
    { label: t("customer"), key: "customerInfo.name", width: "20%" },
    { label: t("orderType", "Type"), key: "orderType", width: "9%" },
    { label: t("date"), key: "createdAt", width: "11%" },
    { label: t("amount"), key: "amount", width: "12%", isRightAligned: true },
    { label: t("status"), key: "status", width: "10%" },
    { label: "", key: "action", width: "5%", isCentered: true },
  ];

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
    >
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} rows={20} />
        ) : (
          data.map((row, idx) => (
            <AppTable.Row key={row._id || row.refundSettlementId || idx}>
              <AppTable.Cell className="tw:text-slate-400 tw:tabular-nums">
                {idx + 1}
              </AppTable.Cell>
              <AppTable.Cell
                className="tw:truncate tw:tabular-nums tw:font-medium"
              >
                {row._id ? (
                  <AppLink
                    asLink
                    href={`/dashboard/orders/refunds/view/${row._id}`}
                  >
                    {row.refundSettlementId || "-"}
                  </AppLink>
                ) : (
                  row.refundSettlementId || "-"
                )}
              </AppTable.Cell>
              <AppTable.Cell
                className="tw:truncate tw:tabular-nums"
              >
                {row.orderId ? (
                  <AppLink
                    asLink
                    href={`/dashboard/orders/view/${row.orderId}`}
                  >
                    {row.orderRefNo || row.orderId}
                  </AppLink>
                ) : (
                  <span className="tw:text-slate-400">—</span>
                )}
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:flex tw:flex-col tw:gap-0.5 tw:min-w-0">
                  {row.customerInfo?.name ? (
                    row._customerLink ? (
                      <AppLink
                        asLink
                        href={row._customerLink}
                        className="tw:font-medium tw:text-slate-900 tw:truncate tw:hover:underline"
                        title={row.customerInfo.name}
                      >
                        {row.customerInfo.name}
                      </AppLink>
                    ) : (
                      <span
                        className="tw:font-medium tw:text-slate-900 tw:truncate"
                        title={row.customerInfo.name}
                      >
                        {row.customerInfo.name}
                      </span>
                    )
                  ) : (
                    <span className="tw:text-slate-400">—</span>
                  )}
                  {row.customerInfo?.mobile && (
                    <span className="tw:text-xs tw:text-slate-500 tw:tabular-nums tw:truncate">
                      {row.customerInfo.mobile}
                    </span>
                  )}
                </div>
              </AppTable.Cell>
              <AppTable.Cell className="tw:whitespace-nowrap">
                {row.orderType ? (
                  <AppBadge variant={row._typeColor || "secondary"}>
                    {row.orderType}
                  </AppBadge>
                ) : (
                  <span className="tw:text-slate-400">—</span>
                )}
              </AppTable.Cell>
              <AppTable.Cell className="tw:whitespace-nowrap tw:tabular-nums tw:text-slate-600">
                <DateFormat value={row.createdAt} formatStr="dd MMM yyyy" />
              </AppTable.Cell>
              <AppTable.Cell className="tw:whitespace-nowrap tw:tabular-nums tw:text-right tw:font-semibold tw:text-rose-600">
                <Amount value={row.refundAmount} decimalPlaces={2} />
              </AppTable.Cell>
              <AppTable.Cell className="tw:whitespace-nowrap">
                <AppBadge variant={row._statusColor || "secondary"}>
                  {row.displayStatus || row.status || "-"}
                </AppBadge>
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                {row._id && (
                  <AppLink
                    asLink
                    href={`/dashboard/orders/refunds/view/${row._id}`}
                    className="tw:inline-flex tw:items-center tw:justify-center tw:rounded-md tw:p-1.5 tw:text-slate-500 tw:hover:bg-slate-100 tw:hover:text-slate-700"
                    title="View refund"
                  >
                    <Eye size={16} />
                  </AppLink>
                )}
              </AppTable.Cell>
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
