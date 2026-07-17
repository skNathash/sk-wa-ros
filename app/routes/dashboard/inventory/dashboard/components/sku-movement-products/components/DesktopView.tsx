import { ChevronRight } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppPopover from "~/components/core/popover/AppPopover";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import TableSkeletonLoader from "~/components/core/table/TableSkeletonLoader";
import DealSummaryPopover from "~/components/feature/inventory/popover/deal-sales-summary/DealSummaryPopover";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";
import type { TableHeaderItem } from "~/types/CommonTypes";
import {
  fromHeaderSort,
  toHeaderSort,
  type SortValue,
} from "~/components/feature/utility/sort/SortPopover";
import { isLooseStockUom, type FastMovingProduct } from "../../../helper";
import type { SkuMovementType } from "../helper";

type Props = {
  data: FastMovingProduct[];
  loading: boolean;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  showLoadMore: boolean;
  sort?: SortValue;
  onSort: (value: SortValue) => void;
  callback: (args: { action: string; data?: any }) => void;
  type?: SkuMovementType;
};

// The Last Order column is hidden for the Non Moving tab.
const showLastOrder = (type?: SkuMovementType) => type !== "NON_MOVING";

// Slow Moving items have no sales in the recent windows, so that tab surfaces
// the longer 45/60/90-day periods instead of the default 7/15/30.
export const getPeriods = (type?: SkuMovementType): number[] =>
  type === "SLOW" ? [45, 60, 90] : [7, 15, 30];

const periodField = (days: number) => `last${days}Days`;

export const getHeaders = (type?: SkuMovementType): TableHeaderItem[] => {
  const headers: TableHeaderItem[] = [
    { label: "#", key: "rank", width: "3%" },
    { label: "Product", key: "dealName", width: "22%", enableSort: true },
    ...getPeriods(type).map((days) => ({
      label: `${days}d Sales`,
      key: `salesAnalytics.${periodField(days)}.quantity`,
      isCentered: true,
      width: "10%",
      enableSort: true,
    })),
    {
      label: "Last Order",
      key: "lastOrderDate",
      isCentered: true,
      width: "12%",
      enableSort: true,
    },
    {
      label: "Current Stock",
      key: "availableQuantity",
      isCentered: true,
      width: "12%",
      enableSort: true,
    },
    { label: "Menu", key: "menuName", width: "12%", enableSort: true },
    { label: "Category", key: "categoryName", width: "12%", enableSort: true },
    { label: "Brand", key: "brandName", width: "9%", enableSort: true },
  ];

  return showLastOrder(type)
    ? headers
    : headers.filter((h) => h.key !== "lastOrderDate");
};

// Each sales period column shows the quantity sold (SKU) on top and the
// sales value below, stacked in the same cell. The last period column also
// shows a "More" link that opens the full 7/15/30/45/60/90-day breakdown; the
// other periods render an invisible copy of it so every sales column stays the
// same height and the numbers line up across columns.
const PeriodCell = ({
  qty,
  value,
  isLooseQty,
  showMore,
}: {
  qty?: number;
  value?: number;
  isLooseQty?: boolean;
  showMore?: boolean;
}) => (
  <span className="tw:inline-flex tw:flex-col tw:items-center tw:leading-tight">
    <span className="tw:font-semibold tw:text-emerald-700">
      <DisplayQty qty={qty ?? 0} isLooseQty={isLooseQty} />
    </span>
    <span className="tw:text-[11px] tw:text-slate-500">
      <Amount value={value ?? 0} />
    </span>
    <span
      aria-hidden={!showMore}
      className={`tw:mt-0.5 tw:inline-flex tw:items-center tw:gap-0.5 tw:text-[10px] tw:text-slate-400 ${
        showMore ? "" : "tw:invisible"
      }`}
    >
      More
      <ChevronRight size={10} />
    </span>
  </span>
);

const containerStyle = {
  maxHeight: "calc(100vh - 300px)",
};

const DesktopView = ({
  data,
  loading,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  showLoadMore,
  sort,
  onSort,
  callback,
  type,
}: Props) => {
  if (!loading && data.length === 0) {
    return <NoData />;
  }

  const headers = getHeaders(type);
  const periods = getPeriods(type);
  const showOrder = showLastOrder(type);
  const { sortKey, sortValue } = toHeaderSort(sort);

  return (
    <AppTable
      container
      responsive
      containerStyle={containerStyle}
      stickyHeader
      fixedLayout
      minWidth="1150px"
    >
      <AppTable.Header>
        <TableHeader
          headers={headers}
          sortKey={sortKey}
          sortValue={sortValue}
          onSort={(sortData) => onSort(fromHeaderSort(sortData))}
        />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} rows={10} />
        ) : (
          data.map((p, idx) => {
            const rank = idx + 1;

            return (
              <AppTable.Row
                key={idx}
                className={idx % 2 === 0 ? "tw:bg-white" : "tw:bg-slate-50/60"}
              >
                <AppTable.Cell>
                  <div className="tw:text-center">{rank}</div>
                </AppTable.Cell>
                <AppTable.Cell>
                  <AppLink
                    asLink
                    href={`/dashboard/inventory/products/view/${p.dealId}`}
                  >
                    <div className="tw:line-clamp-2">{p.dealName}</div>
                  </AppLink>
                  {p.dealRefId && (
                    <div className="tw:text-xs tw:text-gray-400 tw:mt-0.5">
                      {p.dealRefId}
                    </div>
                  )}
                </AppTable.Cell>
                {periods.map((days, i) => {
                  const stats = (p.salesAnalytics as any)?.[
                    periodField(days)
                  ];
                  const isLast = i === periods.length - 1;
                  const cell = (
                    <PeriodCell
                      qty={stats?.quantity}
                      value={stats?.value}
                      isLooseQty={isLooseStockUom(p.selectedStockUom)}
                      showMore={isLast}
                    />
                  );
                  return (
                    <AppTable.Cell
                      key={days}
                      className="tw:text-center"
                    >
                      {isLast ? (
                        <AppPopover
                          triggerContent={
                            <span className="tw:cursor-pointer">{cell}</span>
                          }
                        >
                          <DealSummaryPopover
                            salesAnalytics={p.salesAnalytics as any}
                          />
                        </AppPopover>
                      ) : (
                        cell
                      )}
                    </AppTable.Cell>
                  );
                })}
                {showOrder && (
                  <AppTable.Cell className="tw:text-center">
                    {p.lastOrderDate ? (
                      <span className="tw:inline-flex tw:flex-col tw:items-center tw:leading-tight">
                        <DateFormat
                          value={p.lastOrderDate}
                          formatStr="dd MMM yyyy"
                          className="tw:font-semibold tw:text-slate-700"
                        />
                        <span className="tw:text-[11px] tw:text-slate-500">
                          <Amount value={p.lastOrderValue ?? 0} />
                        </span>
                      </span>
                    ) : (
                      <span className="tw:text-slate-400">-</span>
                    )}
                  </AppTable.Cell>
                )}
                <AppTable.Cell className="tw:text-center">
                  <span className="tw:font-semibold">
                    <DisplayQty
                      qty={p.availableQuantity ?? 0}
                      isLooseQty={isLooseStockUom(p.selectedStockUom)}
                    />
                  </span>
                </AppTable.Cell>
                <AppTable.Cell>
                  <AppLink
                    onClick={() =>
                      callback({
                        action: "menu",
                        data: { id: p.menuRefId, name: p.menuName },
                      })
                    }
                  >
                    <span className="tw:text-xs tw:line-clamp-2">
                      {p.menuName}
                    </span>
                  </AppLink>
                </AppTable.Cell>
                <AppTable.Cell>
                  <AppLink
                    onClick={() =>
                      callback({
                        action: "category",
                        data: { id: p.categoryRefId, name: p.categoryName },
                      })
                    }
                  >
                    <span className="tw:text-xs tw:line-clamp-2">
                      {p.categoryName}
                    </span>
                  </AppLink>
                </AppTable.Cell>
                <AppTable.Cell>
                  <AppLink
                    onClick={() =>
                      callback({
                        action: "brand",
                        data: { id: p.brandRefId, name: p.brandName },
                      })
                    }
                  >
                    <span className="tw:text-xs tw:line-clamp-2">
                      {p.brandName}
                    </span>
                  </AppLink>
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
