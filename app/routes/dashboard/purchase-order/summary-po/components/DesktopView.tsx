import { Eye } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import VendorTypeBadge from "~/shared/vendor/components/vendor-type-badge/VendorTypeBadge";
import {
  AppTable,
  TableHeader,
  TableSkeletonLoader,
} from "~/components/core/table";
import type { SortProps } from "~/types/CommonTypes";

type Props = {
  data: any[];
  loading: boolean;
  sortKey?: string;
  sortValue?: "asc" | "desc" | undefined;
  sortCb?: (d: SortProps) => void;
  callback: (a: { action: string; data: any }) => void;
  showLoadMore: boolean;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  groupByType?: string;
};

// Single headers array with a clear, readable column order.
const headers = [
  { label: "Order ID", key: "orderId", width: "15%", langKey: "id" },
  { label: "Vendor", key: "vendorInfo.name", width: "20%", langKey: "vendor" },
  { label: "Ordered On", key: "createdAt", width: "12%", langKey: "orderedOn" },
  {
    label: "Ordered Items",
    key: "items",
    width: "14%",
    langKey: "orderedItems",
  },
  // Received: show date and items (with value shown below items). No separate value column.
  {
    label: "Received Date",
    key: "receivedDate",
    width: "12%",
    langKey: "receivedDate",
  },
  {
    label: "Received Items",
    key: "receivedItems",
    width: "12%",
    langKey: "receivedItems",
  },
  { label: "Status", key: "status", width: "12%", langKey: "status" },
  {
    label: "Actions",
    key: "actions",
    width: "8%",
    isCentered: true,
    langKey: "actions",
  },
];

const containerStyle = {
  maxHeight: "calc(100vh - 260px)",
};

const DesktopView: React.FC<Props> = ({
  data,
  loading,
  sortKey,
  sortValue,
  sortCb,
  showLoadMore,
  loadMore,
  loadingMore,
  totalCount,
}) => {
  const { t } = useTranslation(["common"]);

  if (!loading && data.length === 0) {
    return <NoData />;
  }

  return (
    <AppTable
      size="sm"
      fixedLayout
      container
      minWidth="900px"
      stickyHeader
      containerStyle={containerStyle}
    >
      <AppTable.Header>
        <TableHeader
          headers={headers}
          sortKey={sortKey}
          sortValue={sortValue}
          onSort={sortCb}
        />
      </AppTable.Header>

      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} rows={8} />
        ) : null}
        {data.map((row, idx) => (
          <AppTable.Row key={idx}>
            {/* Order ID */}
            <AppTable.Cell>
              <div className="tw:flex tw:items-center tw:gap-2">
                <div className="tw:text-sm">
                  <AppLink asLink href={row.orderLink}>
                    {row?.orderId}
                  </AppLink>
                </div>
              </div>
              {row._sourceType && (
                <div className="tw:mt-1">
                  <AppBadge variant={row._sourceType.color as any}>
                    <span className="tw:text-xs">{row._sourceType.name}</span>
                  </AppBadge>
                </div>
              )}
            </AppTable.Cell>

            {/* Vendor */}
            <AppTable.Cell>
              <div className="tw:mb-1 tw:flex tw:items-center tw:gap-2">
                {row.vendorLink ? (
                  <AppLink asLink href={row.vendorLink}>
                    {row?.vendorInfo?.name ?? ""}
                  </AppLink>
                ) : (
                  <div>{row?.vendorInfo?.name ?? ""}</div>
                )}
              </div>
              <div className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center tw:gap-1">
                ID: {row?.vendorInfo?.refId ?? ""}
                {row._vendorType && (
                  <VendorTypeBadge
                    type={row._vendorType}
                    color={row._vendorTypeColor}
                    description={row._vendorTypeInfo}
                    className="tw:text-[10px]"
                  />
                )}
              </div>
            </AppTable.Cell>

            {/* Ordered On: show date and time on separate lines */}
            <AppTable.Cell>
              <div>
                <DateFormat value={row.createdAt} formatStr="dd MMM yyyy" />
              </div>
              <div className="tw:text-xs tw:text-slate-500">
                <DateFormat value={row.createdAt} formatStr="hh:mm a" />
              </div>
            </AppTable.Cell>

            {/* Ordered Items */}
            <AppTable.Cell>
              {row.orderedItemCount ?? 0}{" "}
              <span className="tw:text-slate-500 tw:text-xs">{t("items")}</span>
              <span className="tw:text-slate-500 tw:text-xs tw:ml-1">
                {row.orderedUnitCount ?? 0} units
              </span>
              <div className="tw:text-xs tw:text-slate-500 tw:pt-1">
                {t("value")}:{" "}
                <Amount
                  value={row.totalAmount ?? 0}
                  decimalPlaces={2}
                  className="tw:text-green-600 tw:font-medium"
                />
              </div>
            </AppTable.Cell>
            {/* Received Date */}
            <AppTable.Cell>
              {row.receivedDate ? (
                <>
                  <div>
                    <DateFormat
                      value={row.receivedDate}
                      formatStr="dd MMM yyyy"
                    />
                  </div>
                  <div className="tw:text-xs tw:text-slate-500">
                    <DateFormat value={row.receivedDate} formatStr="hh:mm a" />
                  </div>
                </>
              ) : (
                <span className="tw:text-center">--</span>
              )}
            </AppTable.Cell>

            {/* Received Items + Value (value shown below the item count) */}
            <AppTable.Cell>
              {row.receivedDate ? (
                <>
                  <div>
                    {row.receivedPOCount ?? 0}{" "}
                    <span className="tw:text-slate-500 tw:text-xs">
                      {t("items")}
                    </span>
                  </div>
                  <div className="tw:text-xs tw:text-slate-500 tw:pt-1 tw:flex tw:items-center tw:gap-1">
                    {t("value")}:{" "}
                    <Amount
                      value={row.receivedPOValue ?? 0}
                      decimalPlaces={2}
                      className="tw:text-green-600 tw:font-medium"
                    />
                  </div>
                </>
              ) : (
                <span className="tw:text-center">--</span>
              )}
            </AppTable.Cell>

            {/* Status */}
            <AppTable.Cell>
              <AppBadge variant={row._statusColor}>{row._statusLabel}</AppBadge>
            </AppTable.Cell>

            <AppTable.Cell className="tw:text-center">
              <div className="tw:flex tw:items-center tw:justify-center">
                <AppLink asLink href={row.orderLink}>
                  <AppButton size="small" color="light" fill="outline">
                    <Eye />
                  </AppButton>
                </AppLink>
              </div>
            </AppTable.Cell>
          </AppTable.Row>
        ))}

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
                loadedCount={data.length}
              />
            </AppTable.Cell>
          </AppTable.Row>
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
