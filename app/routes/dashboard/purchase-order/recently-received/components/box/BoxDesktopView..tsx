import { Building2 } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import { AppTable, TableSkeletonLoader } from "~/components/core/table";
import TableHeader from "~/components/core/table/TableHeader";
import type { SortValue, TableHeaderItem } from "~/types/CommonTypes";
import VendorTypeBadge from "~/shared/vendor/components/vendor-type-badge/VendorTypeBadge";

interface TableProps {
  data: Array<Record<string, any>>;
  callback?: (a: { action: string; data: any }) => void;
  sortKey?: string;
  sortValue?: SortValue;
  onSort?: (data: { key: string; value: SortValue }) => void;
  loading?: boolean;
  hasMoreData: boolean;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
}

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

const headers: (TableHeaderItem & { langKey: string })[] = [
  { label: "Box No", langKey: "boxNo", key: "refNo", width: "12%" },
  {
    label: "Invoice No",
    langKey: "invoiceNo",
    key: "invoiceData.refId",
    width: "15%",
    enableSort: false,
  },
  {
    label: "PO ID",
    langKey: "orderId",
    key: "orderData.refId",
    width: "15%",
    enableSort: false,
  },
  {
    label: "Received Date",
    langKey: "receivedDate",
    key: "receivedOn",
    width: "15%",
    enableSort: false,
  },
  {
    label: "Received Items",
    langKey: "receivedItems",
    key: "receivedItems",
    width: "15%",
    enableSort: false,
  },
  {
    label: "Purchased From",
    langKey: "purchasedFrom",
    key: "from.name",
    width: "25%",
    enableSort: false,
  },
];

const BoxDesktopView: React.FC<TableProps> = ({
  data,
  callback,
  sortKey,
  sortValue,
  onSort,
  loading,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  hasMoreData,
}) => {
  const { t } = useTranslation(["common"]);

  if (!loading && (!data || data.length === 0)) {
    return <NoData />;
  }

  return (
    <AppTable
      size="sm"
      fixedLayout
      container
      minWidth="900px"
      containerStyle={containerStyle}
      stickyHeader
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
          <TableSkeletonLoader cols={headers.length} rows={10} />
        ) : (
          <>
            {data.map((row, idx) => (
              <AppTable.Row key={row._id || row.refNo || idx}>
                <AppTable.Cell>
                  <div
                    className="tw:font-medium tw:text-blue-600 tw:cursor-pointer tw:hover:underline"
                    onClick={() => callback?.({ action: "view", data: row })}
                  >
                    {row.refNo || "-"}
                  </div>
                </AppTable.Cell>
                <AppTable.Cell>
                  <span>{row.invoiceData?.refId || "-"}</span>
                </AppTable.Cell>
                <AppTable.Cell>
                  {row.orderData?.refId ? (
                    <AppLink
                      asLink
                      href={
                        row.isSellerOrder
                          ? `/dashboard/orders/view/${row.orderData?.id}`
                          : `/dashboard/purchase-order/view/${row.orderData?.id}`
                      }
                      className="tw:font-medium"
                    >
                      {row.orderData.refId}
                    </AppLink>
                  ) : (
                    "-"
                  )}
                </AppTable.Cell>
                <AppTable.Cell>
                  {row.receivedOn ? (
                    <>
                      <DateFormat
                        value={row.receivedOn}
                        formatStr="dd MMM yyyy"
                      />
                      <div className="tw:text-xs tw:text-gray-500">
                        <DateFormat
                          value={row.receivedOn}
                          formatStr="hh:mm a"
                        />
                      </div>
                    </>
                  ) : (
                    "-"
                  )}
                </AppTable.Cell>
                <AppTable.Cell>
                  <span className="tw:text-green-600 tw:font-bold">
                    {row.receivedItems ?? row.items?.length ?? 0}
                  </span>
                </AppTable.Cell>
                <AppTable.Cell>
                  <div className="tw:flex tw:flex-col">
                    <div className="tw:flex tw:items-center tw:gap-2">
                      {row.from?.id ? (
                        <>
                          {row.isSellerOrder ? (
                            <div>{row.from.name}</div>
                          ) : (
                            <AppLink
                              href={`/dashboard/vendor/view/${row.from.id}`}
                              asLink
                            >
                              {row.from.name}
                            </AppLink>
                          )}
                        </>
                      ) : (
                        <span className="tw:font-medium tw:flex tw:items-center tw:gap-1">
                          <Building2 size={12} className="tw:text-gray-500" />
                          {row.from?.name || "-"}
                        </span>
                      )}
                    </div>
                    {row.from?.refId && (
                      <div className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center tw:gap-2">
                        <span>
                          {t("id")} : {row.from.refId}
                        </span>
                        {row._vendorType && (
                          <VendorTypeBadge
                            type={row._vendorType}
                            color={row._vendorTypeColor}
                            description={row._vendorTypeInfo}
                            className="tw:text-[10px]"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </AppTable.Cell>
              </AppTable.Row>
            ))}
            {hasMoreData && !loading && data.length > 0 && (
              <AppTable.Row>
                <AppTable.Cell colSpan={headers.length} className="text-center">
                  <LoadMoreButton
                    loadMore={loadMore}
                    loading={loadingMore}
                    totalCount={totalCount}
                    loadedCount={loadedCount}
                  />
                </AppTable.Cell>
              </AppTable.Row>
            )}
          </>
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default BoxDesktopView;
