import clsx from "clsx";
import { Check } from "lucide-react";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import { TableSkeletonLoader } from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import CommonService from "~/services/CommonService";
import type {
  SortProps,
  SortValue,
  TableHeaderItem,
} from "~/types/CommonTypes";
import {
  ONLINE_PARTNERS,
  type ElectronicsRow,
  type RowPartnerPrice,
} from "../helper";
import InlinePriceEdit, {
  type InlinePriceResult,
} from "~/shared/catalog/components/inline-price-edit/InlinePriceEdit";

/**
 * Electronics price sheet — one row per online-listed SKU with the CLUB price
 * editable in place, next to the Amazon / Flipkart / Others benchmarks.
 *
 * Rows are tinted by where the CLUB price sits: a row losing to online turns
 * rose so the sheet reads as a worklist, and each marketplace column keeps its
 * own faint brand tint so the three benchmarks stay separable at a glance.
 */

const containerStyle = {
  maxHeight: "calc(100vh - 260px)",
};

export interface DesktopViewProps {
  loading?: boolean;
  data: ElectronicsRow[];
  /** Prices pushed in by the match actions, keyed by deal id. */
  forced?: Record<string, { price: number; token: number }>;
  onPriceResult: (result: InlinePriceResult) => void;
  onMatch: (row: ElectronicsRow) => void;
  /** Pencil in the price field — opens the full price config modal. */
  onEdit: (row: ElectronicsRow) => void;
  sortKey?: string;
  sortValue?: SortValue;
  onSort?: (sort: SortProps) => void;
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore: () => void;
  totalCount?: number;
  loadedCount: number;
}

/** A marketplace price, opening the listing when the feed carried a link. */
const PartnerPrice: React.FC<{ partner: RowPartnerPrice }> = ({ partner }) => {
  if (!partner.price) return <span className="tw:text-gray-300">—</span>;

  const amount = (
    <Amount
      value={partner.price}
      decimalPlaces={0}
      className={clsx(
        "tw:whitespace-nowrap tw:tabular-nums tw:text-sm",
        partner.isLowest
          ? clsx("tw:font-bold", partner.lowestClass)
          : "tw:font-medium tw:text-gray-600",
      )}
    />
  );

  if (!partner.url) return amount;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        CommonService.openInNewWindow(partner.url);
      }}
      className="tw:cursor-pointer tw:transition-opacity hover:tw:opacity-70"
    >
      {amount}
    </button>
  );
};

const DesktopView: React.FC<DesktopViewProps> = ({
  loading = false,
  data,
  forced = {},
  onPriceResult,
  onMatch,
  onEdit,
  sortKey = "",
  sortValue = "asc",
  onSort = () => {},
  showLoadMore = false,
  loadingMore = false,
  loadMore,
  totalCount = 0,
  loadedCount,
}) => {
  const tableHeaders: TableHeaderItem[] = [
    { label: "Item", key: "dealName", enableSort: true, width: "30%" },
    {
      label: "MRP",
      key: "mrp",
      enableSort: false,
      isCentered: true,
      width: "10%",
    },
    {
      label: "You (CLUB) · Edit",
      key: "price",
      enableSort: true,
      isCentered: true,
      width: "16%",
    },
    ...ONLINE_PARTNERS.map((partner) => ({
      label: (
        <span className={clsx("tw:font-bold", partner.headerClass)}>
          {partner.label}
        </span>
      ),
      key: `partner:${partner.key}`,
      enableSort: false,
      isCentered: true,
      width: "10%",
    })),
    {
      label: "Action",
      key: "action",
      enableSort: false,
      isCentered: true,
      width: "12%",
    },
  ];

  if (!loading && data.length === 0) {
    return <NoData />;
  }

  return (
    <AppTable
      container
      minWidth="1000px"
      containerStyle={containerStyle}
      stickyHeader
    >
      <AppTable.Header>
        <TableHeader
          headers={tableHeaders}
          sortKey={sortKey}
          onSort={onSort}
          sortValue={sortValue}
        />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={tableHeaders.length} rows={12} />
        ) : (
          data.map((row) => {
            const losing = row._tone === "above";

            return (
              <AppTable.Row
                key={row._id || row.id}
                // The row tint is the sheet's worklist signal: rose means the
                // CLUB price is losing to a marketplace right now.
                className={losing ? "tw:bg-red-50" : ""}
              >
                <AppTable.Cell>
                  <div className="tw:flex tw:items-start tw:gap-2.5">
                    <span
                      className="tw:mt-0.5 tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:text-[10px] tw:font-bold tw:text-white"
                      style={{ backgroundColor: row._monogramColor }}
                    >
                      {row._monogram}
                    </span>
                    <div className="tw:min-w-0">
                      <AppLink
                        asLink
                        href={`/dashboard/inventory/products/view/${row._id}/pricing`}
                        className="tw:font-semibold"
                      >
                        {row.name}
                      </AppLink>
                      {(row._subLine || row._matchedHint) && (
                        <div className="tw:mt-0.5 tw:text-xs tw:text-gray-500">
                          {row._subLine}
                          {row._matchedHint && (
                            <span className="tw:ml-1 tw:font-semibold tw:text-red-600">
                              {row._matchedHint}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </AppTable.Cell>

                <AppTable.Cell className="tw:text-center">
                  <Amount
                    value={row.mrp || 0}
                    decimalPlaces={0}
                    className="tw:font-medium tw:text-gray-600 tw:whitespace-nowrap"
                  />
                </AppTable.Cell>

                <AppTable.Cell className="tw:text-center">
                  <InlinePriceEdit
                    dealId={row._id}
                    type="b2c"
                    price={row.b2cPrice || 0}
                    force={forced[row._id]}
                    invalid={losing}
                    callback={onPriceResult}
                    onEdit={() => onEdit(row)}
                    aria-label={`CLUB price for ${row.name}`}
                    className="tw:w-[120px]"
                  />
                </AppTable.Cell>

                {row._partners.map((partner) => (
                  <AppTable.Cell
                    key={partner.key}
                    className={clsx("tw:text-center", partner.cellClass)}
                  >
                    <PartnerPrice partner={partner} />
                  </AppTable.Cell>
                ))}

                <AppTable.Cell className="tw:text-center">
                  {losing ? (
                    <button
                      type="button"
                      onClick={() => onMatch(row)}
                      className="tw:inline-flex tw:cursor-pointer tw:items-center tw:whitespace-nowrap tw:rounded-lg tw:bg-red-600 tw:px-3 tw:py-1.5 tw:text-xs tw:font-bold tw:text-white tw:transition-colors hover:tw:bg-red-700"
                    >
                      Match ₹
                      {CommonService.formattedAmount(row._lowestOnline, 0)}
                    </button>
                  ) : row._isWinning ? (
                    <span className="tw:inline-flex tw:items-center tw:gap-1 tw:rounded-lg tw:bg-emerald-50 tw:px-2.5 tw:py-1.5 tw:text-xs tw:font-bold tw:uppercase tw:tracking-wide tw:text-emerald-700">
                      <Check size={13} />
                      Winning
                    </span>
                  ) : (
                    <span className="tw:text-xs tw:text-gray-400">
                      Not priced
                    </span>
                  )}
                </AppTable.Cell>
              </AppTable.Row>
            );
          })
        )}

        {showLoadMore && !loading && data.length > 0 && (
          <AppTable.Row noHover>
            <AppTable.Cell
              className="tw:py-4 tw:text-center"
              colSpan={tableHeaders.length}
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
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
