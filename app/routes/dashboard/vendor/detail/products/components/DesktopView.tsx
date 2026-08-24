import React from "react";
import { useTranslation } from "react-i18next";
import { TrendingDown, TrendingUp } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import { TableSkeletonLoader } from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import PoAddToCart from "~/shared/purchase-order/components/po-add-to-cart/PoAddToCart";
import type { SortProps, TableHeaderItem } from "~/types/CommonTypes";
import { getCatalogMockRow } from "./catalogMock";

interface DesktopViewProps {
  vendorId: string;
  loading?: boolean;
  data: any[];
  callback: (a: { action: string; data: any }) => void;
  onSort: (a: SortProps) => void;
  sortKey: string;
  sortValue: "asc" | "desc" | undefined;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  hasMoreData: boolean;
}

const headers: TableHeaderItem[] = [
  {
    label: "Item · Pack",
    key: "name",
    width: "33%",
  },
  {
    label: "Brand · Cat",
    key: "applicableBrands",
    width: "14%",
  },
  {
    label: "Your last buy",
    key: "lastBuy",
    width: "12%",
    isRightAligned: true,
  },
  {
    label: "Vendor now",
    key: "price",
    width: "11%",
    isRightAligned: true,
  },
  {
    label: "Your stock",
    key: "stock",
    width: "18%",
  },
  {
    label: "Reorder",
    key: "action",
    width: "12%",
    isRightAligned: true,
  },
];

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

const COLS = headers.length;

const DesktopView: React.FC<DesktopViewProps> = ({
  vendorId,
  loading,
  data,
  callback,
  onSort,
  sortKey,
  sortValue,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  hasMoreData,
}) => {
  const { t } = useTranslation(["common"]);

  return (
    <AppTable
      size="sm"
      stickyHeader
      fixedLayout
      container
      containerStyle={containerStyle}
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
          <TableSkeletonLoader cols={COLS} rows={30} />
        ) : data && data.length > 0 ? (
          data.map((row, idx) => {
            const mock = getCatalogMockRow(idx, row.price);
            const stock = Number(row.loggedInUserStock?.availableQuantity ?? 0);
            const isLow = stock > 0 && stock < mock.par;
            const isOut = stock <= 0;
            const fillPercent = Math.min(
              100,
              Math.round((stock / Math.max(1, mock.par)) * 100),
            );

            return (
              <AppTable.Row key={row._id || idx}>
                <AppTable.Cell>
                  <div className="tw:font-medium tw:text-gray-900 tw:line-clamp-1">
                    {row.name || "--"}
                  </div>
                  <div className="tw:text-[11px] tw:text-gray-500">
                    {mock.pack} · MRP{" "}
                    <Amount value={mock.mrp} decimalPlaces={0} /> · sold{" "}
                    {mock.soldPerMonth}/mo
                  </div>
                </AppTable.Cell>

                <AppTable.Cell>
                  <div className="tw:flex tw:flex-col tw:items-start tw:text-left">
                    {row.applicableBrand?.brandName ? (
                      <button
                        type="button"
                        className="tw:max-w-full tw:truncate tw:text-primary tw:underline tw:text-sm tw:text-left"
                        onClick={() =>
                          callback({
                            action: "brand",
                            data: {
                              id: row.applicableBrand?.brandId,
                              name: row.applicableBrand?.brandName,
                            },
                          })
                        }
                      >
                        {row.applicableBrand?.brandName}
                      </button>
                    ) : (
                      <span className="tw:text-sm tw:text-gray-400">--</span>
                    )}
                    {row.applicableCategory?.categoryName ? (
                      <button
                        type="button"
                        className="tw:max-w-full tw:truncate tw:text-[11px] tw:text-gray-500 tw:text-left"
                        onClick={() =>
                          callback({
                            action: "category",
                            data: {
                              id: row.applicableCategory?.categoryId,
                              name: row.applicableCategory?.categoryName,
                            },
                          })
                        }
                      >
                        {row.applicableCategory?.categoryName}
                      </button>
                    ) : null}
                  </div>
                </AppTable.Cell>

                <AppTable.Cell className="tw:text-right">
                  <div className="tw:font-semibold tw:text-gray-900">
                    <Amount value={mock.lastBuyPrice} decimalPlaces={0} />
                  </div>
                  <div className="tw:text-[11px] tw:text-gray-500">
                    {row.lastPurchaseDate ? (
                      <DateFormat
                        value={row.lastPurchaseDate}
                        formatStr="dd MMM yyyy"
                      />
                    ) : (
                      "--"
                    )}
                  </div>
                </AppTable.Cell>

                <AppTable.Cell className="tw:text-right">
                  <div
                    className={`tw:font-semibold ${
                      mock.priceDelta > 0
                        ? "tw:text-red-600"
                        : mock.priceDelta < 0
                          ? "tw:text-green-700"
                          : "tw:text-gray-900"
                    }`}
                  >
                    <Amount value={mock.vendorPrice} decimalPlaces={0} />
                  </div>
                  <div className="tw:text-[11px] tw:text-gray-500 tw:flex tw:items-center tw:justify-end tw:gap-0.5">
                    {mock.priceDelta === 0 ? (
                      <span>= same</span>
                    ) : mock.priceDelta > 0 ? (
                      <span className="tw:flex tw:items-center tw:gap-0.5 tw:text-red-600">
                        <TrendingUp size={12} />
                        <Amount
                          value={Math.abs(mock.priceDelta)}
                          decimalPlaces={0}
                        />
                      </span>
                    ) : (
                      <span className="tw:flex tw:items-center tw:gap-0.5 tw:text-green-700">
                        <TrendingDown size={12} />
                        <Amount
                          value={Math.abs(mock.priceDelta)}
                          decimalPlaces={0}
                        />
                      </span>
                    )}
                  </div>
                </AppTable.Cell>

                <AppTable.Cell>
                  <div className="tw:flex tw:items-center tw:gap-1.5">
                    <span
                      className={`tw:font-semibold ${
                        isOut
                          ? "tw:text-red-600"
                          : isLow
                            ? "tw:text-amber-600"
                            : "tw:text-gray-900"
                      }`}
                    >
                      {stock}
                    </span>
                    <span className="tw:text-[11px] tw:text-gray-500">
                      / par {mock.par}
                    </span>
                    {isOut ? (
                      <span className="tw:rounded tw:bg-red-100 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:text-red-700">
                        OUT
                      </span>
                    ) : isLow ? (
                      <span className="tw:rounded tw:bg-amber-100 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:text-amber-700">
                        LOW
                      </span>
                    ) : null}
                  </div>
                  <div className="tw:mt-1 tw:h-1.5 tw:w-full tw:max-w-40 tw:rounded-full tw:bg-gray-200 tw:overflow-hidden">
                    <div
                      className={`tw:h-full tw:rounded-full ${
                        isOut
                          ? "tw:bg-red-500"
                          : isLow
                            ? "tw:bg-amber-500"
                            : "tw:bg-green-600"
                      }`}
                      style={{ width: `${fillPercent}%` }}
                    />
                  </div>
                </AppTable.Cell>

                <AppTable.Cell>
                  <div className="tw:flex tw:items-center tw:justify-end tw:gap-2">
                    {mock.suggestedQty > 0 && (
                      <span className="tw:inline-flex tw:items-center tw:rounded-md tw:border tw:border-gray-300 tw:px-2 tw:py-1 tw:text-[11px] tw:font-semibold tw:text-gray-700">
                        {mock.suggestedQty}
                      </span>
                    )}
                    <PoAddToCart
                      vendorId={vendorId}
                      dealId={row.dealId || row.dealRefId}
                      type="catalog"
                    />
                  </div>
                </AppTable.Cell>
              </AppTable.Row>
            );
          })
        ) : (
          <AppTable.Row>
            <AppTable.Cell colSpan={COLS} className="tw:text-center">
              {t("noDataFound")}
            </AppTable.Cell>
          </AppTable.Row>
        )}
        {hasMoreData && !loading && data.length > 0 && (
          <AppTable.Row>
            <AppTable.Cell colSpan={COLS} className="tw:text-center">
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
