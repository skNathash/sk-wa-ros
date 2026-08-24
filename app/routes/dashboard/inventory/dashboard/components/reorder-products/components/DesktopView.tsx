import { ChevronRight } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
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
import type { InventoryRiskRow, InventoryRiskType } from "../helper";

type Props = {
  data: InventoryRiskRow[];
  loading: boolean;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  showLoadMore: boolean;
  sort?: SortValue;
  onSort: (value: SortValue) => void;
  callback: (args: { action: string; data?: any }) => void;
  type?: InventoryRiskType;
};

// "Last Order" and reorder-specific column widths apply only to the reorder
// table.
const isReorderType = (type?: InventoryRiskType) =>
  !type || type === "reorderRequired";

// Sales period columns (7d–90d) are shown for both the reorder and reserve
// tables.
const hasSalesColumns = (type?: InventoryRiskType) =>
  isReorderType(type) || type === "reserve";

const salesHeaders: TableHeaderItem[] = [
  {
    label: "7d Sales",
    key: "salesAnalytics.last7Days.quantity",
    isCentered: true,
    width: "6%",
    enableSort: true,
  },
  {
    label: "15d Sales",
    key: "salesAnalytics.last15Days.quantity",
    isCentered: true,
    width: "6%",
    enableSort: true,
  },
  {
    label: "30d Sales",
    key: "salesAnalytics.last30Days.quantity",
    isCentered: true,
    width: "6%",
    enableSort: true,
  },
];

export const getHeaders = (type?: InventoryRiskType): TableHeaderItem[] => {
  const isReorder = isReorderType(type);
  const showSales = hasSalesColumns(type);

  return [
    { label: "#", key: "rank", width: "3%" },
    {
      label: "Product",
      key: "dealName",
      width: showSales ? "12%" : "27%",
      enableSort: true,
    },
    ...(showSales ? salesHeaders : []),
    ...(isReorder
      ? [
          {
            label: "Last Order",
            key: "lastOrderDate",
            isCentered: true,
            width: "6%",
            enableSort: true,
          },
        ]
      : []),
    {
      label: type === "reserve" ? "Reserve Qty Used" : "Stock Qty",
      key: type === "reserve" ? "totalReserveQty" : "stockQty",
      isCentered: true,
      width: showSales ? "12%" : "21%",
      enableSort: true,
    },
    {
      label: "Menu",
      key: "menuName",
      width: showSales ? "9%" : "14%",
      enableSort: true,
    },
    {
      label: "Category",
      key: "categoryName",
      width: showSales ? "10%" : "15%",
      enableSort: true,
    },
    {
      label: "Brand",
      key: "brandName",
      width: showSales ? "5%" : "11%",
      enableSort: true,
    },
  ];
};

export const headers = getHeaders();

// Each sales period column shows the quantity sold (SKU) on top and the
// sales value below, stacked in the same cell. The 30d column also shows a
// "More" link that opens the full 45/60/90-day breakdown; the other periods
// render an invisible copy of it so every sales column stays the same height
// and the numbers line up across columns.
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
      <DisplayQty qty={qty ?? 0} isLooseQty={Boolean(isLooseQty)} />
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
  overflowX: "auto" as const,
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
  const isReorder = isReorderType(type);
  const showSales = hasSalesColumns(type);
  const { sortKey, sortValue } = toHeaderSort(sort);

  return (
    <AppTable
      container
      responsive
      containerStyle={containerStyle}
      stickyHeader
      minWidth={showSales ? "1300px" : "1100px"}
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
          data.map((p, idx) => (
            <AppTable.Row
              key={p._key}
              className={idx % 2 === 0 ? "tw:bg-white" : "tw:bg-slate-50/60"}
            >
              <AppTable.Cell>
                <div className="tw:text-center">{idx + 1}</div>
              </AppTable.Cell>
              <AppTable.Cell>
                <AppLink
                  asLink
                  href={`/dashboard/inventory/products/view/${p.dealId}`}
                >
                  <div className="tw:line-clamp-2">{p.dealName}</div>
                </AppLink>
                <div className="tw:text-xs tw:text-gray-500">{p.dealRefId}</div>
              </AppTable.Cell>
              {showSales && (
                <>
                  <AppTable.Cell className="tw:text-center">
                    <PeriodCell
                      qty={p._sales7Qty}
                      value={p._sales7Value}
                      isLooseQty={p._isLooseQty}
                    />
                  </AppTable.Cell>
                  <AppTable.Cell className="tw:text-center">
                    <PeriodCell
                      qty={p._sales15Qty}
                      value={p._sales15Value}
                      isLooseQty={p._isLooseQty}
                    />
                  </AppTable.Cell>
                  <AppTable.Cell className="tw:text-center">
                    <AppPopover
                      triggerContent={
                        <span className="tw:cursor-pointer">
                          <PeriodCell
                            qty={p._sales30Qty}
                            value={p._sales30Value}
                            isLooseQty={p._isLooseQty}
                            showMore
                          />
                        </span>
                      }
                    >
                      <DealSummaryPopover
                        salesAnalytics={p.salesAnalytics as any}
                      />
                    </AppPopover>
                  </AppTable.Cell>
                </>
              )}
              {isReorder && (
                <AppTable.Cell className="tw:text-center">
                  {p.lastOrderDate ? (
                    <span className="tw:inline-flex tw:flex-col tw:items-center tw:leading-tight">
                      <DateFormat
                        value={p.lastOrderDate}
                        formatStr="dd MMM yyyy"
                        className="tw:font-semibold tw:text-slate-700"
                      />
                      <span className="tw:text-[11px] tw:text-slate-500">
                        <Amount value={p._lastOrderValue} />
                      </span>
                    </span>
                  ) : (
                    <span className="tw:text-slate-400">-</span>
                  )}
                </AppTable.Cell>
              )}
              <AppTable.Cell className="tw:text-center">
                <div className="tw:inline-flex tw:flex-col tw:items-center tw:gap-1">
                  {type === "reserve" ? (
                    <span className="tw:font-semibold tw:text-amber-700">
                      {p._reserveQtyLabel}
                    </span>
                  ) : (
                    <span className="tw:font-semibold tw:text-emerald-700">
                      <DisplayQty
                        qty={p._stockQty}
                        isLooseQty={p._isLooseQty}
                      />
                    </span>
                  )}
                  <AppButton
                    size="small"
                    color="primary"
                    noShadow
                    className="tw:h-6 tw:px-2.5 tw:py-0 tw:text-[11px] tw:font-medium"
                    onClick={() =>
                      callback({
                        action: "buyNow",
                        data: { dealId: p.dealId },
                      })
                    }
                  >
                    Buy Now
                  </AppButton>
                </div>
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

export default DesktopView;
