import React from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import { AppTable, TableSkeletonLoader } from "~/components/core/table";
import TableHeader from "~/components/core/table/TableHeader";
import type { TableHeaderItem, SortValue } from "~/types/CommonTypes";
import { Building2 } from "lucide-react";
import NoData from "~/components/core/no-data/NoData";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import ImgRender from "~/components/core/img/ImgRender";
import VendorTypeBadge from "~/shared/vendor/components/vendor-type-badge/VendorTypeBadge";

interface TableProps {
  data: Array<Record<string, any>>;
  callback: (a: { action: string; data: any }) => void;
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
  {
    label: "Name",
    langKey: "name",
    key: "dealName",
    width: "18%",
    enableSort: false,
  },
  {
    label: "Purchased From",
    langKey: "purchasedFrom",
    key: "vendor.name",
    width: "18%",
    enableSort: false,
  },
  {
    label: "Received Date",
    langKey: "receivedDate",
    key: "receivedDate",
    width: "12%",
    enableSort: false,
  },
  {
    label: "Received Qty",
    langKey: "receivedQty",
    key: "receivedQuantity",
    width: "8%",
    enableSort: false,
  },
  {
    label: "Received Value",
    langKey: "receivedValue",
    key: "purchasePrice",
    width: "10%",
    enableSort: false,
  },
];

const ProductTable: React.FC<TableProps> = ({
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
      minWidth="1100px"
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
              <AppTable.Row key={row._id || idx}>
                <AppTable.Cell>
                  <div className="tw:flex tw:gap-2">
                    <div className="tw:w-12 tw:h-12">
                      <ImgRender
                        src={row.image}
                        alt={row.name}
                        className="tw:w-full tw:h-full tw:object-cover"
                      />
                    </div>
                    <div className="tw:flex tw:flex-col tw:flex-1">
                      <AppLink
                        asLink
                        href={`/dashboard/inventory/products/view/${row.dealId}/purchase-history`}
                        className="tw:font-medium tw:mb-1"
                      >
                        {row.name}
                      </AppLink>
                      <span className="tw:text-xs tw:text-gray-500">
                        {t("id")}: {row.dealRefId}
                      </span>
                    </div>
                  </div>
                </AppTable.Cell>
                <AppTable.Cell>
                  <div className="tw:flex tw:flex-col">
                    <div className="tw:flex tw:items-center tw:gap-2">
                      {row.isSellerOrder ? (
                        <div>{row.from?.name}</div>
                      ) : (
                        <AppLink
                          asLink
                          href={`/dashboard/vendor/view/${row.from?.id}`}
                          className="tw:font-medium"
                        >
                          {row.from?.name}
                        </AppLink>
                      )}
                    </div>
                    <div className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center tw:gap-2">
                      <span>
                        {t("id")} : {row.from?.refId}
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
                  </div>
                </AppTable.Cell>
                <AppTable.Cell>
                  <DateFormat
                    value={row.receivedDate}
                    formatStr="dd MMM yyyy"
                  />
                  <div className="tw:text-xs tw:text-gray-500">
                    <DateFormat value={row.receivedDate} formatStr="hh:mm a" />
                  </div>
                </AppTable.Cell>
                <AppTable.Cell>
                  <span className="tw:text-green-600 tw:font-bold">
                    {row.totalReceivedQty ?? row.receivedQty ?? 0}
                  </span>
                </AppTable.Cell>
                <AppTable.Cell className="tw:font-medium">
                  <Amount value={row.totalReceivedValue || 0} />
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

export default ProductTable;
