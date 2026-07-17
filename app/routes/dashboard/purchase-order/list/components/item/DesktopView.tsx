import { CheckCircle, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import Rbac from "~/components/core/rbac/Rbac";
import {
  AppTable,
  TableHeader,
  TableSkeletonLoader,
} from "~/components/core/table";
import type { SortProps } from "~/types/CommonTypes";

const rbacRoles = {
  receive: ["PURCHASE-ORDER.RECEIVE"],
};

type Props = {
  data: any[];
  callback: (a: { action: string; data: any }) => void;
  tab: string;
  sortKey: string;
  sortValue: "asc" | "desc" | undefined;
  sortCb: (data: SortProps) => void;
  loading: boolean;
  showLoadMore: boolean;
  loadingMore: boolean;
  loadMore: () => void;
  totalCount: number;
};

const DesktopView = ({
  data,
  callback,
  tab,
  sortKey,
  sortValue,
  sortCb,
  loading,
  showLoadMore,
  loadingMore,
  loadMore,
  totalCount,
}: Props) => {
  const { t } = useTranslation(["common"]);

  const headers = [
    { label: t("id"), key: "_id", width: "12%", enableSort: true },
    {
      label: t("vendor"),
      key: "vendorInfo.name",
      width: "24%",
      enableSort: true,
    },
    { label: t("createdOn"), key: "createdAt", width: "14%", enableSort: true },
    {
      label: t("expectedDelivery"),
      key: "expectedDeliveryDate",
      width: "16%",
      enableSort: true,
    },
    { label: t("items"), key: "_totalItems", width: "10%" },
    {
      label: t("totalValue"),
      key: "payableAmount",
      width: "12%",
      isCentered: true,
      enableSort: true,
    },
    { label: t("status"), key: "status", width: "20%", isCentered: true },
    { label: t("actions"), key: "actions", width: "20%", isCentered: true },
  ];

  const containerStyle = {
    maxHeight: "calc(100vh - 200px)",
  };

  if (!loading && data.length === 0) {
    return null;
  }

  return (
    <AppTable
      size="sm"
      fixedLayout={true}
      container
      minWidth="1200px"
      stickyHeader={true}
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
          <TableSkeletonLoader cols={headers.length} rows={20} />
        ) : (
          data.map((row, idx) => {
            return (
              <AppTable.Row key={row._id || idx} className="tw:cursor-pointer">
                <AppTable.Cell>
                  <AppLink
                    asLink
                    href={`/dashboard/purchase-order/view/${row._id}`}
                  >
                    {row.orderId}
                  </AppLink>
                  {row._sourceType && (
                    <div className="tw:mt-1">
                      <AppBadge variant={row._sourceType.color as any}>
                        <span className="tw:text-xs">
                          {row._sourceType.name}
                        </span>
                      </AppBadge>
                    </div>
                  )}
                </AppTable.Cell>
                <AppTable.Cell className="tw:font-medium">
                  <AppLink
                    asLink
                    href={`/dashboard/vendor/view/${row.vendorInfo?.id}`}
                  >
                    {row.vendorInfo?.name || "N/A"}
                  </AppLink>
                  <div className="tw:text-xs tw:text-gray-500">
                    {row.vendorInfo?.vendorId || "--"}
                  </div>
                </AppTable.Cell>
                <AppTable.Cell>
                  <DateFormat value={row.createdAt} formatStr="dd MMM yyyy" />
                  <div className="tw:text-xs tw:text-gray-500">
                    <DateFormat value={row.createdAt} formatStr="hh:mm a" />
                  </div>
                </AppTable.Cell>
                <AppTable.Cell>
                  {row.expectedDeliveryDate ? (
                    <DateFormat
                      value={row.expectedDeliveryDate}
                      formatStr="dd MMM yyyy"
                    />
                  ) : (
                    "--"
                  )}
                </AppTable.Cell>
                <AppTable.Cell>
                  <div className="tw:font-medium">
                    {row.items?.length} {t("products")}
                  </div>
                  <div className="tw:text-xs tw:text-gray-500">
                    {row._totalQuantity} {t("totalUnits")}
                  </div>
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-center tw:font-medium">
                  <Amount
                    value={row.payableAmount || row.totalAmount || 0}
                    decimalPlaces={2}
                  />
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-center">
                  <AppBadge variant={row._statusColor as any}>
                    {row._statusLabel}
                  </AppBadge>
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-center">
                  <div className="tw:flex tw:items-center tw:justify-center">
                    <AppButton
                      size="small"
                      color="light"
                      fill="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        callback({ action: "view", data: row });
                      }}
                    >
                      <Eye className="tw:mr-1" />
                      {t("view")}
                    </AppButton>
                    <Rbac roles={rbacRoles.receive}>
                      {tab !== "overview" &&
                        (row.status === "Approved" ||
                          row.status === "Partially Received") && (
                          <AppButton
                            size="small"
                            color="success"
                            noShadow={true}
                            onClick={(e) => {
                              e.stopPropagation();
                              callback({ action: "receive", data: row });
                            }}
                            className="tw:ml-1"
                          >
                            <CheckCircle className="tw:mr-1" />
                            {t("receive")}
                          </AppButton>
                        )}
                    </Rbac>

                    {tab !== "overview" && row.status === "Draft" && (
                      <AppButton
                        size="small"
                        color="success"
                        fill="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          callback({ action: "edit", data: row });
                        }}
                        className="tw:ml-2"
                      >
                        {t("editPO")}
                      </AppButton>
                    )}
                  </div>
                </AppTable.Cell>
              </AppTable.Row>
            );
          })
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
