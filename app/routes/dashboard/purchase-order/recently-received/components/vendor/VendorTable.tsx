import React from "react";
import { useTranslation } from "react-i18next";
import NoData from "~/components/core/no-data/NoData";
import Amount from "~/components/core/amount/Amount";
import AppLink from "~/components/core/link/AppLink";
import { AppTable, TableSkeletonLoader } from "~/components/core/table";
import TableHeader from "~/components/core/table/TableHeader";
import DateFormat from "~/components/core/date/DateFormat";
import type { TableHeaderItem, SortValue } from "~/types/CommonTypes";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import { Phone } from "lucide-react";
import VendorTypeBadge from "~/shared/vendor/components/vendor-type-badge/VendorTypeBadge";

interface TableProps {
  data: Array<Record<string, any>>;
  callback?: (args: { action: string; data?: any }) => void;
  sortKey?: string;
  sortValue?: SortValue;
  onSort?: (data: { key: string; value: SortValue }) => void;
  loading: boolean;
  loadingMore: boolean;
  loadMore: (event?: any) => void;
  totalCount: number;
  loadedCount: number;
  hasMoreData: boolean;
}

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

const headers: TableHeaderItem[] = [
  {
    label: "Vendor/Seller",
    langKey: "vendorSeller",
    key: "vendor.name",
    width: "20%",
  },
  {
    label: "Vendor ID",
    langKey: "id",
    key: "vendor.refId",
    width: "12%",
  },
  {
    label: "Last Received",
    langKey: "lastReceivedDate",
    key: "earliestPoDate",
    width: "20%",
  },
  {
    label: "Quantity",
    langKey: "receivedQty",
    key: "receivedQty",
    width: "12%",
  },
  {
    label: "Total Value",
    langKey: "receivedValue",
    key: "totalCost",
    width: "20%",
  },
];

const VendorTable: React.FC<TableProps> = ({
  data,
  callback,
  sortKey,
  sortValue,
  onSort,
  loading = false,
  loadingMore = false,
  loadMore,
  totalCount = 0,
  loadedCount = 0,
  hasMoreData = false,
}) => {
  if (!loading && !data.length) {
    return <NoData />;
  }

  return (
    <AppTable size="sm" fixedLayout container containerStyle={containerStyle}>
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
              <AppTable.Row key={row._id || idx}>
                <AppTable.Cell className="tw:font-medium">
                  <div className="tw:flex tw:flex-col">
                    <div className="tw:flex tw:items-center tw:gap-2">
                      {row.isSeller ? (
                        <div>{row?.from?.name}</div>
                      ) : (
                        <AppLink
                          href={`/dashboard/vendor/view/${row?.from?.id}`}
                          asLink
                        >
                          {row?.from?.name || "-"}
                        </AppLink>
                      )}
                    </div>
                    <div className="tw:text-xs tw:text-gray-500 tw:mt-0.5 tw:flex tw:items-center tw:gap-1">
                      <Phone size={12} />
                      {row?.from?.mobile || "-"}
                      {row._vendorType && (
                        <span className="tw:ml-2">
                          <VendorTypeBadge
                            type={row._vendorType}
                            color={row._vendorTypeColor}
                            description={row._vendorTypeInfo}
                            className="tw:text-[10px]"
                          />
                        </span>
                      )}
                    </div>
                  </div>
                </AppTable.Cell>
                <AppTable.Cell>
                  <span>{row?.from?.refId || "-"}</span>
                </AppTable.Cell>
                <AppTable.Cell>
                  {row.lastReceived ? (
                    <DateFormat
                      value={row.lastReceived}
                      formatStr="dd MMM yyyy"
                    />
                  ) : (
                    "-"
                  )}
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-green-600 tw:font-medium">
                  {row.totalReceivedQty ?? row.quantity ?? 0}
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-green-500">
                  <Amount
                    value={row.totalReceivedValue ?? 0}
                    decimalPlaces={2}
                  />
                </AppTable.Cell>
                {/* Action column removed */}
              </AppTable.Row>
            ))}
            {hasMoreData && data.length > 0 && (
              <AppTable.Row noHover>
                <AppTable.Cell
                  className="tw:text-center tw:py-4"
                  colSpan={headers.length}
                >
                  <LoadMoreButton
                    loadMore={loadMore}
                    loading={loadingMore}
                    totalCount={totalCount}
                    loadedCount={loadedCount}
                    noMargin
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

export default VendorTable;
