import React from "react";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import TableSkeletonLoader from "~/components/core/table/TableSkeletonLoader";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import Amount from "~/components/core/amount/Amount";
import type { SortValue, TableHeaderItem } from "~/types/CommonTypes";
import type { RateRow } from "../helper";

interface Props {
  data: RateRow[];
  loading?: boolean;
  sortKey: string;
  sortValue: SortValue;
  onSort: (d: { key: string; value: SortValue }) => void;
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore: () => void;
  totalCount?: number;
  loadedCount: number;
}

const headers: TableHeaderItem[] = [
  { label: "GST Rate", key: "gstRate", width: "25%", enableSort: true },
  {
    label: "GST Collected",
    key: "gstCollected",
    width: "25%",
    enableSort: true,
  },
  { label: "GST Inward", key: "gstInward", width: "25%", enableSort: true },
  {
    label: "Net GST Payable",
    key: "netGstPayable",
    width: "25%",
    enableSort: true,
  },
];

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
}) => {
  if (!loading && data.length === 0) return <NoData />;

  return (
    <div>
      <AppTable container responsive fixedLayout minWidth="700px" stickyHeader condensed>
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
          ) : data.length === 0 ? (
            <AppTable.Row>
              <AppTable.Cell colSpan={headers.length}>
                <NoData />
              </AppTable.Cell>
            </AppTable.Row>
          ) : (
            data.map((item) => (
              <AppTable.Row key={item.gstRate}>
                <AppTable.Cell>{item.gstRate || "0"}%</AppTable.Cell>
                <AppTable.Cell className="tw:text-emerald-600 tw:font-semibold">
                  <Amount value={item.gstCollected} />
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-red-600 tw:font-semibold">
                  <Amount value={item.gstInward} />
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-blue-600 tw:font-bold">
                  <Amount value={item.netGstPayable} />
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
    </div>
  );
};

export default DesktopView;
