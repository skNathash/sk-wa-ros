import React from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import type { TableHeaderItem } from "~/types/CommonTypes";
import DateFormat from "~/components/core/date/DateFormat";
import DisplayPrice from "~/shared/products/display-price/DisplayPrice";
import AppLink from "~/components/core/link/AppLink";
import AppBadge from "~/components/core/badge/AppBadge";
import NoData from "~/components/core/no-data/NoData";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import SchemeDetailsPopover from "~/routes/configs/rsp/history/components/SchemeDetailsPopover";

interface TableProps {
  data: Array<Record<string, any>>;
  loading?: boolean;
  emptyText?: string;
  onSort?: (data: { key: string; value: "asc" | "desc" | undefined }) => void;
  sortKey?: string;
  sortValue?: "asc" | "desc" | undefined;
  // pagination / load more
  loadedCount?: number;
  totalCount?: number;
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore?: () => void;
}

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

const Table: React.FC<TableProps> = ({
  data,
  loading = false,
  emptyText,
  onSort,
  sortKey,
  sortValue,
  loadedCount = 0,
  totalCount = 0,
  showLoadMore = false,
  loadingMore = false,
  loadMore,
}) => {
  const { t } = useTranslation(["common"]);

  const headers: TableHeaderItem[] = [
    { key: "slno", label: t("slNo"), width: "5%" },
    { key: "type", label: t("type"), width: "5%", isCentered: true },
    { key: "change", label: t("change"), width: "20%", isCentered: true },
    { key: "user", label: "Updated by", width: "20%" },
    { key: "when", label: "Updated On", width: "20%" },
    { key: "reason", label: "Reason", width: "20%" },
  ];

  const defaultEmptyText = emptyText || t("noDataFound");
  const getTypeBadge = (applicableFor: string) => {
    if (applicableFor === "Network") {
      return <AppBadge variant="primary">{t("b2b")}</AppBadge>;
    } else if (applicableFor === "Customer") {
      return <AppBadge variant="success">{t("b2c")}</AppBadge>;
    }
    return <AppBadge variant="light">{applicableFor || "--"}</AppBadge>;
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
            <AppTable.Row key={idx}>
              <AppTable.Cell>{idx + 1}</AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                {getTypeBadge(row.applicableFor)}
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <div className="tw:flex tw:flex-col tw:items-center">
                  <div className="tw:grid tw:grid-cols-[1fr_auto_1fr] tw:gap-x-2 tw:items-center tw:w-full">
                    {/* Row 1: Prices */}
                    <div className="tw:text-right">
                      <span className="tw:text-gray-500">
                        <DisplayPrice
                          price={row.oldData?.price}
                          uom={row.oldData?.selectedStockUom}
                        />
                      </span>
                    </div>
                    <div className="tw:flex tw:justify-center">
                      <ArrowRight
                        className="tw:text-gray-400"
                        size={16}
                      />
                    </div>
                    <div className="tw:text-left">
                      <span className="tw:text-green-600 tw:font-semibold">
                        <DisplayPrice
                          price={row.newData?.price}
                          uom={row.newData?.selectedStockUom}
                        />
                      </span>
                    </div>

                    {/* Row 2: MRPs */}
                    {(() => {
                      const oldMrp = row.oldData?.mrp !== undefined ? Number(row.oldData.mrp) : 0;
                      const newMrp = row.newData?.mrp !== undefined ? Number(row.newData.mrp) : 0;
                      if (oldMrp > 0 || newMrp > 0) {
                        return (
                          <>
                            <div className="tw:text-right tw:text-[10px] tw:text-gray-400 tw:leading-none tw:flex tw:items-center tw:justify-end tw:gap-1 tw:mt-1">
                              <span className="tw:uppercase tw:text-[9px] tw:font-normal tw:text-gray-400/80">{t("mrp")}:</span>
                              <span className="tw:text-gray-400">
                                <DisplayPrice
                                  price={oldMrp}
                                  uom={row.oldData?.selectedStockUom}
                                  hideUom
                                />
                              </span>
                            </div>
                            <div className="tw:flex tw:justify-center tw:mt-1">
                              <ArrowRight
                                className="tw:text-gray-300"
                                size={10}
                              />
                            </div>
                            <div className="tw:text-left tw:text-[10px] tw:text-gray-400 tw:leading-none tw:mt-1">
                              <span className="tw:text-gray-400 tw:font-medium">
                                <DisplayPrice
                                  price={newMrp}
                                  uom={row.newData?.selectedStockUom}
                                  hideUom
                                />
                              </span>
                            </div>
                          </>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {row.newData?.isFixedPrice && (
                    <div className="tw:mt-1">
                      <AppBadge variant="warning">Fixed</AppBadge>
                    </div>
                  )}

                  <SchemeDetailsPopover
                    oldData={row.oldData}
                    newData={row.newData}
                  />
                </div>
              </AppTable.Cell>
              <AppTable.Cell>{row.createdByName || "--"}</AppTable.Cell>
              <AppTable.Cell>
                {row.createdAt ? <DateFormat value={row.createdAt} /> : "--"}
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:text-xs tw:text-gray-500">
                  {row.reason || "--"}
                </div>
              </AppTable.Cell>
            </AppTable.Row>
          ))
        )}
        {/** Load more row */}
        {!loading && data.length > 0 && showLoadMore && (
          <AppTable.Row>
            <AppTable.Cell
              colSpan={headers.length}
              className="tw:text-center tw:py-4"
            >
              <LoadMoreButton
                loadMore={loadMore || (() => {})}
                loading={!!loadingMore}
                totalCount={totalCount || 0}
                loadedCount={loadedCount || 0}
              />
            </AppTable.Cell>
          </AppTable.Row>
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default Table;
