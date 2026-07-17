import React from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";
import DateFormat from "~/components/core/date/DateFormat";
import AppBadge from "~/components/core/badge/AppBadge";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import type { SortProps, TableHeaderItem } from "~/types/CommonTypes";

interface TableProps {
  data: Array<Record<string, any>>;
  loading?: boolean;
  emptyText?: string;
  onSort?: (data: SortProps) => void;
  sortKey?: string;
  sortValue?: "asc" | "desc";
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore: () => void;
  totalCount?: number;
  loadedCount: number;
  onView?: (item: Record<string, any>) => void;
}

const headers: TableHeaderItem[] = [
  { key: "createdAt", label: "Date", langKey: "date", width: "12%" },
  { key: "stockLedgerId", label: "Ledger ID", langKey: "ledgerId", width: "12%" },
  { key: "refId", label: "Reference", langKey: "reference", width: "18%" },
  { key: "type", label: "Type", langKey: "type", width: "12%" },
  { key: "location", label: "Location", langKey: "location", width: "12%" },
  {
    key: "openingQty",
    label: "Opening Qty",
    langKey: "openingQty",
    width: "10%",
  },
  { key: "quantity", label: "Change Qty", langKey: "changeQty", width: "10%" },
  {
    key: "closingQty",
    label: "Closing Qty",
    langKey: "closingQty",
    width: "10%",
  },
  { key: "mrp", label: "MRP", langKey: "mrp", width: "8%" },
  {
    key: "purchasePrice",
    label: "Price",
    langKey: "purchasePrice",
    width: "10%",
  },
  {
    key: "createdBy",
    label: "Updated By",
    langKey: "updatedBy",
    width: "15%",
  },
];

const Table: React.FC<TableProps> = ({
  data,
  loading = false,
  emptyText,
  onSort,
  sortKey,
  sortValue,
  showLoadMore = false,
  loadingMore = false,
  loadMore,
  totalCount = 0,
  loadedCount,
  onView,
}) => {
  const { t } = useTranslation(["common"]);

  const containerStyle = {
    maxHeight: "calc(100vh - 200px)",
  };

  const defaultEmptyText = emptyText || t("noDataFound");
  const renderReference = (referenceHref?: string, refNo?: string) => {
    const hasValidReferenceLink = !!referenceHref && referenceHref !== "#";

    if (!hasValidReferenceLink) {
      return refNo || "--";
    }

    return (
      <AppLink
        asLink
        href={referenceHref}
        className="tw:text-blue-600 tw:font-normal"
        onClick={(e) => e.stopPropagation()}
      >
        {refNo || "--"}
      </AppLink>
    );
  };

  if (!loading && data.length === 0) {
    return <NoData />;
  }

  return (
    <AppTable
      size="sm"
      fixedLayout
      container
      containerStyle={containerStyle}
      stickyHeader
      minWidth="1300px"
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
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length} className="tw:text-center">
              {t("loading")}
            </AppTable.Cell>
          </AppTable.Row>
        ) : data.length === 0 ? (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length} className="tw:text-center">
              {defaultEmptyText}
            </AppTable.Cell>
          </AppTable.Row>
        ) : (
          data.map((row, idx) => (
            <AppTable.Row
              key={row._id || idx}
              onClick={() => onView?.(row)}
              className="tw:cursor-pointer"
            >
              <AppTable.Cell>
                {row.createdAt ? (
                  <>
                    <DateFormat value={row.createdAt} formatStr="dd MMM yyyy" />{" "}
                    <div className="tw:text-xs tw:text-gray-500">
                      <DateFormat value={row.createdAt} formatStr="hh:mm a" />
                    </div>
                  </>
                ) : (
                  "--"
                )}
              </AppTable.Cell>
              <AppTable.Cell>
                <code>{row.stockLedgerId || "--"}</code>
              </AppTable.Cell>
              <AppTable.Cell>
                {renderReference(row._tranRedirect?.path, row.refNo)}
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:flex tw:items-center tw:gap-2">
                  {row.icon && (
                    <row.icon
                      className={
                        row.direction === "IN"
                          ? "tw:text-green-500"
                          : "tw:text-red-500"
                      }
                      size={16}
                    />
                  )}
                  <span className="tw:uppercase">
                    {row.referenceType || "--"}
                  </span>
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                {row.location?.name ? (
                  <AppBadge
                    variant={
                      row.location.name === "Sellable" ? "success" : "danger"
                    }
                  >
                    {row.location.name}
                  </AppBadge>
                ) : (
                  "--"
                )}
              </AppTable.Cell>
              <AppTable.Cell>
                <DisplayQty
                  qty={Number(row.effectiveOldQty) || 0}
                  isLooseQty={false}
                  uom={row.selectedStockUom}
                />
              </AppTable.Cell>
              <AppTable.Cell
                className={
                  "tw:font-semibold " +
                  (row.direction === "IN"
                    ? "tw:text-green-500"
                    : "tw:text-red-500")
                }
              >
                {row.direction === "IN" ? "+" : "-"}
                <DisplayQty
                  qty={Number(row.quantity) || 0}
                  isLooseQty={false}
                  uom={row.selectedStockUom}
                />
              </AppTable.Cell>
              <AppTable.Cell>
                <DisplayQty
                  qty={Number(row.effectiveNewQty) || 0}
                  isLooseQty={false}
                  uom={row.selectedStockUom}
                />
              </AppTable.Cell>
              <AppTable.Cell>
                <Amount value={row.mrp} decimalPlaces={2} />
              </AppTable.Cell>
              <AppTable.Cell>
                <Amount value={row.purchasePrice} decimalPlaces={2} />
              </AppTable.Cell>
              <AppTable.Cell>
                {row.createdBy?.name || "--"}
                {row.createdAt && (
                  <div className="tw:text-xs tw:text-gray-500">
                    <DateFormat value={row.createdAt} formatStr="dd MMM yyyy" />
                  </div>
                )}
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
                loadedCount={loadedCount}
              />
            </AppTable.Cell>
          </AppTable.Row>
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default Table;
