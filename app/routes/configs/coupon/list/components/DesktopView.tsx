import React from "react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import AppCard from "~/components/core/card/AppCard";
import NoData from "~/components/core/no-data/NoData";
import { TableSkeletonLoader } from "~/components/core/table";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import Amount from "~/components/core/amount/Amount";
import type { SortValue, TableHeaderItem } from "~/types/CommonTypes";
import { Eye, Pencil } from "lucide-react";

interface Props {
  data: any[];
  callback: (params: { action: string; data?: any }) => void;
  onSort: (params: { key: string; value: SortValue }) => void;
  sortKey?: string;
  sortValue?: SortValue;
  loading: boolean;
  startSlNo?: number;
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore?: () => void;
  totalCount?: number;
  loadedCount?: number;
}

const containerStyle: React.CSSProperties = {
  maxHeight: "calc(100vh - 200px)",
  overflowX: "auto",
  overflowY: "auto",
};

const getHeaders = (): TableHeaderItem[] => [
  { label: "SL", key: "sl", width: "40px" },
  { label: "Title", key: "title", width: "200px", enableSort: true },
  { label: "Code", key: "code", width: "100px" },
  { label: "Applicable For", key: "applicableFor", width: "100px" },
  { label: "Discount", key: "discount.value", width: "70px" },
  { label: "Validity", key: "validFrom", width: "170px" },
  { label: "Status", key: "status", width: "120px" },
  { label: "Active", key: "isActive", width: "100px" },
  { label: "Created On", key: "createdAt", width: "150px", enableSort: true },
  { label: "Updated On", key: "updatedAt", width: "150px", enableSort: true },
  { label: "Action", key: "action", width: "100px" },
];

const formatDiscount = (discount: any) => {
  if (!discount) return "-";
  if (discount.kind === "PERCENT") {
    return `${discount.value}%`;
  }
  return `₹${discount.value ?? 0}`;
};

const DesktopView: React.FC<Props> = ({
  data,
  callback,
  onSort,
  sortKey,
  sortValue,
  loading,
  startSlNo = 1,
  showLoadMore = false,
  loadingMore = false,
  loadMore,
  totalCount = 0,
  loadedCount = 0,
}) => {
  const headers = getHeaders();

  // Row navigates to view. Action buttons call stopPropagation so their
  // clicks never bubble up to this handler.
  const handleRowClick = (item: any) => {
    callback({ action: "view", data: item });
  };

  return (
    <AppCard noPadding>
      <AppTable
        fixedLayout
        container
        size="sm"
        stickyHeader
        condensed
        minWidth="1200px"
        containerStyle={containerStyle}
      >
        <AppTable.Header>
          <TableHeader
            headers={headers}
            onSort={(d) =>
              onSort({ key: d.key, value: d.value as "asc" | "desc" })
            }
            sortKey={sortKey}
            sortValue={sortValue}
          />
        </AppTable.Header>
        <AppTable.Body>
          {loading && <TableSkeletonLoader cols={headers.length} rows={10} />}
          {!loading && data.length === 0 && (
            <AppTable.Row>
              <AppTable.Cell
                colSpan={headers.length}
                className="tw:text-center"
              >
                <NoData />
              </AppTable.Cell>
            </AppTable.Row>
          )}
          {!loading &&
            data.map((item, index) => {
              const id = item._id;
              // Running/completed coupons are live or finished, so their terms
              // can no longer be changed — hide the edit action for them.
              const status = (item.status || "").toLowerCase();
              const isLocked = status === "running" || status === "completed";
              return (
                <AppTable.Row
                  key={id || index}
                  onClick={() => handleRowClick(item)}
                  className="tw:cursor-pointer tw:hover:bg-gray-50"
                >
                  <AppTable.Cell>
                    <div className="tw:font-medium tw:text-gray-600">
                      {startSlNo + index}
                    </div>
                  </AppTable.Cell>
                  <AppTable.Cell>
                    <div className="tw:space-y-1">
                      <div className="tw:font-medium tw:text-sm tw:text-gray-900">
                        {item.title || "-"}
                      </div>
                      {item.description && (
                        <div className="tw:text-xs tw:text-gray-500 tw:truncate">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </AppTable.Cell>
                  <AppTable.Cell>
                    <span className="tw:text-xs tw:font-mono tw:bg-gray-100 tw:px-2 tw:py-1 tw:rounded">
                      {item.code || "-"}
                    </span>
                  </AppTable.Cell>
                  <AppTable.Cell>
                    <div className="tw:flex tw:flex-wrap tw:gap-1">
                      {(Array.isArray(item.applicableFor)
                        ? item.applicableFor
                        : []
                      ).map((a: string) => (
                        <AppBadge
                          key={a}
                          variant="primary"
                          className="tw:text-xs"
                        >
                          {a}
                        </AppBadge>
                      ))}
                      {(!item.applicableFor ||
                        item.applicableFor.length === 0) &&
                        "-"}
                    </div>
                  </AppTable.Cell>
                  <AppTable.Cell>
                    <div className="tw:font-medium tw:text-gray-900">
                      {formatDiscount(item.discount)}
                    </div>
                    {item.discount?.maxDiscountPerUse != null && (
                      <div className="tw:text-xs tw:text-gray-500">
                        Max <Amount value={item.discount.maxDiscountPerUse} />
                      </div>
                    )}
                  </AppTable.Cell>
                  <AppTable.Cell>
                    <div className="tw:text-xs">
                      <DateFormat
                        value={item.validFrom}
                        formatStr="dd MMM yyyy"
                      />
                      {" - "}
                      <DateFormat
                        value={item.validTill}
                        formatStr="dd MMM yyyy"
                      />
                    </div>

                    {item._validityLabel &&
                      item.status?.toLowerCase() === "running" && (
                        <div className="tw:mt-1">
                          <AppBadge variant={item._validityColor}>
                            {item._validityLabel}
                          </AppBadge>
                        </div>
                      )}
                  </AppTable.Cell>
                  <AppTable.Cell>
                    <AppBadge variant={item._statusColor}>
                      {item._statusLabel}
                    </AppBadge>
                  </AppTable.Cell>
                  <AppTable.Cell>
                    <AppBadge variant={item._activeColor}>
                      {item._activeLabel}
                    </AppBadge>
                  </AppTable.Cell>

                  <AppTable.Cell>
                    {item.createdAt ? (
                      <DateFormat
                        value={item.createdAt}
                        formatStr="dd MMM yyyy hh:mm a"
                      />
                    ) : (
                      "-"
                    )}
                    <div className="tw:text-xs tw:text-gray-500">
                      {item?.createdBy?.name || "-"}
                    </div>
                  </AppTable.Cell>
                  <AppTable.Cell>
                    {item.updatedAt ? (
                      <DateFormat
                        value={item.updatedAt}
                        formatStr="dd MMM yyyy hh:mm a"
                      />
                    ) : (
                      "-"
                    )}
                  </AppTable.Cell>
                  <AppTable.Cell>
                    <div className="tw:flex tw:items-center tw:gap-2">
                      <AppButton
                        size="small"
                        fill="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          callback({ action: "view", data: item });
                        }}
                        className="tw:p-1.5"
                      >
                        <Eye className="tw:w-4 tw:h-4" />
                      </AppButton>
                      {!isLocked && (
                        <AppButton
                          size="small"
                          fill="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            callback({ action: "edit", data: item });
                          }}
                          className="tw:p-1.5"
                        >
                          <Pencil className="tw:w-4 tw:h-4" />
                        </AppButton>
                      )}
                    </div>
                  </AppTable.Cell>
                </AppTable.Row>
              );
            })}
          {showLoadMore && !loading && data.length > 0 && (
            <AppTable.Row>
              <AppTable.Cell
                colSpan={headers.length}
                className="tw:text-center tw:py-4"
              >
                <LoadMoreButton
                  loadMore={loadMore || (() => {})}
                  loading={loadingMore}
                  totalCount={totalCount}
                  loadedCount={loadedCount}
                />
              </AppTable.Cell>
            </AppTable.Row>
          )}
        </AppTable.Body>
      </AppTable>
    </AppCard>
  );
};

export default DesktopView;
