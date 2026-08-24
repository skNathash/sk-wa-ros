import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import { TableSkeletonLoader } from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import type { SortValue, TableHeaderItem } from "~/types/CommonTypes";

interface OrderData {
  _id: string;
  orderId: string;
  orderRefNo: string;
  status: string;
  createdAt?: string;
  orderedDate?: string | Date;
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
  /** Order currently open in the detail pane — gets the active row accent. */
  activeOrderId?: string;
}

const getHeaders = (t: any): TableHeaderItem[] => [
  {
    label: `${t("order")} · ${t("date")}`,
    key: "orderRefNo",
    width: "32%",
    enableSort: true,
  },
  { label: t("status"), key: "status", width: "24%", enableSort: true },
  { label: t("items"), key: "itemsCount", width: "14%" },
  {
    label: `${t("total")} · ${t("payment")}`,
    key: "orderAmount",
    width: "24%",
    enableSort: true,
  },
  { label: "", key: "action", width: "6%" },
];

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

/**
 * Order list as a four-column register: each cell pairs a headline value with
 * the detail that qualifies it (ref no over date, status over its date, count
 * over units, total over payment state). The whole row opens the order.
 */
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
  activeOrderId,
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
      minWidth="720px"
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
          data.map((row, idx) => {
            const isActive =
              !!activeOrderId && (row.orderId || row._id) === activeOrderId;

            return (
              <AppTable.Row
                key={row.orderId || row._id || idx}
                onClick={() =>
                  callback && callback({ action: "view-order", data: row })
                }
                className={clsx(
                  "tw:cursor-pointer",
                  isActive &&
                    "tw:bg-primary/5 tw:shadow-[inset_3px_0_0_0_var(--color-primary)]",
                )}
              >
                <AppTable.Cell>
                  <div className="tw:text-sm tw:font-bold tw:text-slate-900 tw:tabular-nums">
                    {row.orderRefNo}
                  </div>
                  <div className="tw:mt-0.5 tw:text-[11px] tw:text-slate-500">
                    <DateFormat
                      value={row.createdAt || row.orderedDate || null}
                      formatStr="dd MMM yyyy"
                    />
                  </div>
                </AppTable.Cell>

                <AppTable.Cell>
                  <AppBadge variant={row._statusColor} size="sm">
                    {row._statusLbl || row.status}
                  </AppBadge>
                  {row._statusNoteDate ? (
                    <div className="tw:mt-1 tw:text-[11px] tw:text-slate-500">
                      {row._statusNote}{" "}
                      <DateFormat
                        value={row._statusNoteDate}
                        formatStr="dd MMM yyyy"
                      />
                    </div>
                  ) : null}
                </AppTable.Cell>

                <AppTable.Cell>
                  <div className="tw:flex tw:items-center tw:gap-1.5">
                    <span className="tw:text-sm tw:font-bold tw:text-slate-900 tw:tabular-nums">
                      {row._itemsCount}
                    </span>
                    {row._hasDue ? (
                      <span className="tw:h-1.5 tw:w-1.5 tw:rounded-full tw:bg-amber-500" />
                    ) : null}
                  </div>
                  {row._units > 0 ? (
                    <div className="tw:mt-0.5 tw:text-[11px] tw:text-slate-500 tw:tabular-nums">
                      {row._units}u
                    </div>
                  ) : null}
                </AppTable.Cell>

                <AppTable.Cell>
                  <Amount
                    value={row._total}
                    decimalPlaces={0}
                    className="tw:block tw:text-sm tw:font-bold tw:text-slate-900"
                  />
                  <div
                    className={clsx(
                      "tw:mt-0.5 tw:flex tw:items-center tw:gap-1 tw:text-[11px]",
                      row._hasDue ? "tw:text-amber-600" : "tw:text-green-600",
                    )}
                  >
                    {!row._hasDue ? (
                      <span className="tw:h-1.5 tw:w-1.5 tw:shrink-0 tw:rounded-full tw:bg-green-500" />
                    ) : null}
                    <span className="tw:truncate">{row._paymentLine}</span>
                  </div>
                  {row._hasDue && row._paidAmount > 0 ? (
                    <div className="tw:text-[11px] tw:font-semibold tw:text-amber-600">
                      <Amount value={row._dueAmount} decimalPlaces={0} /> left
                    </div>
                  ) : null}
                </AppTable.Cell>

                <AppTable.Cell className="tw:text-right">
                  <ChevronRight size={16} className="tw:text-slate-400" />
                </AppTable.Cell>
              </AppTable.Row>
            );
          })
        ) : (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length}>
              <NoData />
            </AppTable.Cell>
          </AppTable.Row>
        )}
        {hasMoreData && !loading && data.length > 0 && (
          <AppTable.Row noHover>
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
