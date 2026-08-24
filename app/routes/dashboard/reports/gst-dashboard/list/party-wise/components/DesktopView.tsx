import clsx from "clsx";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import TableSkeletonLoader from "~/components/core/table/TableSkeletonLoader";
import type { SortValue, TableHeaderItem } from "~/types/CommonTypes";
import type { PartyRow } from "../helper";

/** Avatar tints, cycled by row order so a list stays visually varied. */
const avatarTints = [
  "tw:bg-blue-500",
  "tw:bg-sky-500",
  "tw:bg-indigo-500",
  "tw:bg-fuchsia-500",
  "tw:bg-teal-500",
  "tw:bg-amber-500",
];

/** "sakti_Store" → SS, "Kruthikstore" → K — first letter of up to two words. */
export const getInitials = (name: string) =>
  (name || "")
    .split(/[\s_]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

export const PartyAvatar: React.FC<{
  name: string;
  index: number;
  size?: "sm" | "md";
}> = ({ name, index, size = "md" }) => (
  <span
    className={clsx(
      "tw:inline-flex tw:items-center tw:justify-center tw:shrink-0 tw:rounded-full tw:text-white tw:font-bold",
      size === "sm"
        ? "tw:w-8 tw:h-8 tw:text-[10px]"
        : "tw:w-10 tw:h-10 tw:text-xs",
      avatarTints[index % avatarTints.length],
    )}
  >
    {getInitials(name) || "?"}
  </span>
);

/** Amber state chip in the STATE column — the state's name, not its code. */
export const StateBadge: React.FC<{ state: string }> = ({ state }) => {
  if (!state) return <span className="tw:text-gray-400">—</span>;

  return (
    <span className="tw:inline-flex tw:items-center tw:rounded tw:bg-amber-100 tw:text-amber-700 tw:text-[10px] tw:font-bold tw:tracking-wide tw:px-1.5 tw:py-0.5">
      {state}
    </span>
  );
};

/** GSTR-2A reconciliation state for a party. */
export const MatchBadge: React.FC<{ matched: boolean }> = ({ matched }) => (
  <AppBadge variant={matched ? "success" : "danger"} size="sm">
    <span className="tw:tracking-wide">{matched ? "MATCHED" : "MISMATCH"}</span>
  </AppBadge>
);

interface Props {
  data: PartyRow[];
  loading?: boolean;
  sortKey?: string;
  sortValue?: SortValue;
  onSort?: (d: { key: string; value: SortValue }) => void;
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore: () => void;
  totalCount?: number;
  loadedCount: number;
  /** Period label shown on the right of the card header, e.g. "Jul 2026". */
  periodLabel?: string;
  /** Card header — follows the tile the user picked above. */
  title: string;
}

const headers: TableHeaderItem[] = [
  { label: "Party", key: "name", width: "24%", enableSort: true },
  { label: "GSTIN", key: "gstNumber", width: "17%", enableSort: true },
  { label: "State", key: "state", width: "14%", enableSort: true },
  { label: "Inv", key: "orderCount", width: "7%", enableSort: true },
  {
    label: "Taxable",
    key: "totalTaxableAmount",
    width: "14%",
    enableSort: true,
    isRightAligned: true,
  },
  {
    label: "Tax",
    key: "totalTax",
    width: "12%",
    enableSort: true,
    isRightAligned: true,
  },
  {
    label: "GSTR-2A Match",
    key: "matched",
    width: "13%",
    enableSort: true,
    isCentered: true,
  },
];

/**
 * Viewport-relative height, as the other list tables do it — what is left once
 * the summary tiles, tabs and breadcrumbs above have taken their share. The
 * floor keeps six rows visible on short screens; the body scrolls and pages in
 * the rest from there.
 */
const containerStyle = {
  maxHeight: "calc(100vh - 450px)",
  minHeight: "26.5rem",
};

const DesktopView: React.FC<Props> = ({
  data,
  loading = false,
  sortKey,
  sortValue,
  onSort,
  showLoadMore = false,
  loadingMore = false,
  loadMore,
  totalCount = 0,
  loadedCount,
  periodLabel,
  title,
}) => (
  <AppCard noPadding className="tw:mb-4">
    <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:px-4 tw:py-3 tw:border-b tw:border-gray-100">
      <h3 className="tw:text-base tw:font-bold tw:text-gray-900">
        {title}
      </h3>
      {periodLabel && (
        <span className="tw:text-xs tw:text-gray-400 tw:shrink-0">
          {periodLabel}
        </span>
      )}
    </div>

    <AppTable
      container
      responsive
      fixedLayout
      minWidth="900px"
      stickyHeader
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
          <TableSkeletonLoader cols={headers.length} rows={6} />
        ) : data.length === 0 ? (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length}>
              <NoData />
            </AppTable.Cell>
          </AppTable.Row>
        ) : (
          data.map((item, idx) => (
            <AppTable.Row key={item._id}>
              <AppTable.Cell>
                <div className="tw:flex tw:items-center tw:gap-3">
                  <PartyAvatar name={item.name} index={idx} />
                  <span className="tw:font-medium tw:text-gray-900 tw:truncate">
                    {item.name}
                  </span>
                </div>
              </AppTable.Cell>

              <AppTable.Cell className="tw:text-gray-600 tw:tabular-nums">
                {item.gstNumber || "—"}
              </AppTable.Cell>

              <AppTable.Cell>
                <StateBadge state={item.state} />
              </AppTable.Cell>

              <AppTable.Cell className="tw:text-gray-700 tw:tabular-nums">
                {item.orderCount}
              </AppTable.Cell>

              <AppTable.Cell className="tw:text-right tw:font-semibold tw:text-gray-900 tw:tabular-nums">
                <Amount value={item.totalTaxableAmount} decimalPlaces={0} />
              </AppTable.Cell>

              <AppTable.Cell className="tw:text-right tw:font-semibold tw:text-gray-900 tw:tabular-nums">
                <Amount value={item.totalTax} decimalPlaces={0} />
              </AppTable.Cell>

              <AppTable.Cell className="tw:text-center">
                <MatchBadge matched={item.matched} />
              </AppTable.Cell>
            </AppTable.Row>
          ))
        )}

        {showLoadMore && !loading && data.length > 0 && (
          <AppTable.Row noHover>
            <AppTable.Cell colSpan={headers.length}>
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
  </AppCard>
);

export default DesktopView;
