import React from "react";
import { Building2, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppLink from "~/components/core/link/AppLink";
import {
  AppTable,
  TableHeader,
  TableSkeletonLoader,
} from "~/components/core/table";
import type { SortProps } from "~/types/CommonTypes";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import clsx from "clsx";
import VendorTypeBadge from "~/shared/vendor/components/vendor-type-badge/VendorTypeBadge";

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

const baseHeaders = [
  {
    label: "Name",
    key: "vendorInfo.vendorName",
    width: "30%",
    langKey: "name",
  },
  {
    label: "ID",
    key: "vendorInfo.vendorId",
    width: "8%",
    langKey: "id",
  },
  {
    label: "Type",
    key: "_vendorType",
    width: "10%",
    langKey: "type",
  },
];

const actionHeader = {
  label: "Actions",
  key: "actions",
  width: "14%",
  isCentered: true,
  langKey: "actions",
};

const countHeader = (isReceived: boolean) => ({
  label: isReceived ? "Received PO" : "Open PO",
  key: isReceived ? "receivedPOCount" : "notReceivedPOCount",
  width: "16%",
  isCentered: true,
  langKey: isReceived ? "receivedPo" : "openPo",
});

const valueHeader = (isReceived: boolean) => ({
  label: isReceived ? "Received PO Value" : "Open PO Value",
  key: isReceived ? "receivedPOValue" : "notReceivedPOValue",
  width: "20%",
  isCentered: true,
  langKey: isReceived ? "receivedPoValue" : "openPoValue",
});

const DesktopView: React.FC<Props> = ({
  data,
  loading,
  sortKey,
  sortValue,
  sortCb,
  callback,
  showLoadMore,
  loadMore,
  loadingMore,
  totalCount,
  groupByType,
}) => {
  const { t } = useTranslation(["common"]);

  const isReceived = groupByType === "received";

  const headers = [
    ...baseHeaders,
    countHeader(isReceived),
    valueHeader(isReceived),
    actionHeader,
  ];

  const containerStyle = {
    maxHeight: "calc(100vh - 260px)",
  } as any;

  if (!loading && data.length === 0) return null;

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
        ) : (
          data.map((row) => (
            <AppTable.Row key={row._id}>
              <AppTable.Cell>
                <div className="tw:font-medium">
                  <AppLink
                    asLink
                    href={`/dashboard/vendor/view/${row.vendorInfo?.id}/purchase-order?tab=purchase-order`}
                    className="tw:flex tw:gap-1 tw:items-center"
                  >
                    <Building2 size={16} className="tw:text-slate-500" />
                    {row?.vendorInfo?.name ?? ""}
                  </AppLink>
                </div>
              </AppTable.Cell>

              <AppTable.Cell>
                <div className="tw:text-xs tw:text-gray-600">
                  {row?.vendorInfo?.vendorId ?? ""}
                </div>
              </AppTable.Cell>

              <AppTable.Cell>
                {row?._vendorType ? (
                  <VendorTypeBadge
                    type={row._vendorType}
                    color={row._vendorTypeColor}
                    description={row._vendorTypeInfo}
                    className="tw:text-[10px]"
                  />
                ) : (
                  <div className="tw:text-gray-300">-</div>
                )}
              </AppTable.Cell>

              <AppTable.Cell className="tw:text-center">
                <div
                  className={clsx("tw:font-medium", {
                    // green only when in 'received' view and value > 0
                    "tw:text-green-600":
                      isReceived && (row?.receivedPOCount ?? 0) > 0,
                    // red when not in 'received' view and open PO count > 0
                    "tw:text-red-600":
                      !isReceived && (row?.notReceivedPOCount ?? 0) > 0,
                    "tw:text-gray-400": isReceived
                      ? (row?.receivedPOCount ?? 0) === 0
                      : (row?.notReceivedPOCount ?? 0) === 0,
                  })}
                >
                  {isReceived
                    ? (row?.receivedPOCount ?? 0)
                    : (row?.notReceivedPOCount ?? 0)}
                </div>
              </AppTable.Cell>

              <AppTable.Cell className="tw:text-center tw:font-medium">
                <Amount
                  value={
                    isReceived
                      ? row?.receivedPOValue || 0
                      : row?.notReceivedPOValue || 0
                  }
                  decimalPlaces={2}
                  className={clsx({
                    // green only when in 'received' view and value > 0
                    "tw:text-green-600":
                      isReceived && (row?.receivedPOValue ?? 0) > 0,
                    // red when not in 'received' view and open PO value > 0
                    "tw:text-red-600":
                      !isReceived && (row?.notReceivedPOValue ?? 0) > 0,
                    "tw:text-gray-400": isReceived
                      ? (row?.receivedPOValue ?? 0) === 0
                      : (row?.notReceivedPOValue ?? 0) === 0,
                  })}
                />
              </AppTable.Cell>

              <AppTable.Cell className="tw:text-center">
                <div className="tw:flex tw:items-center tw:justify-center">
                  <AppButton
                    size="small"
                    color="light"
                    fill="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      callback({ action: "viewVendor", data: row });
                    }}
                  >
                    <Eye className="tw:mr-1" />
                    {t("view")}
                  </AppButton>
                </div>
              </AppTable.Cell>
            </AppTable.Row>
          ))
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
