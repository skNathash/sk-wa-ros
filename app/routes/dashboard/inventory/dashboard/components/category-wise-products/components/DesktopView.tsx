import Amount from "~/components/core/amount/Amount";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import TableSkeletonLoader from "~/components/core/table/TableSkeletonLoader";
import type { TableHeaderItem } from "~/types/CommonTypes";
import {
  fromHeaderSort,
  toHeaderSort,
  type SortValue,
} from "~/components/feature/utility/sort/SortPopover";
import type { CategoryValue } from "../../../helper";

type Props = {
  data: CategoryValue[];
  loading: boolean;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  showLoadMore: boolean;
  sort?: SortValue;
  onSort: (value: SortValue) => void;
  onCountClick: (
    item: CategoryValue,
    tab: "fast_moving" | "slow_moving" | "non_moving",
  ) => void;
};

export const headers: TableHeaderItem[] = [
  { label: "#", key: "slNo", isCentered: true, width: "5%" },
  { label: "Category", key: "categoryName", width: "20%", enableSort: true },
  {
    label: "Inventory Value",
    key: "value",
    isCentered: true,
    width: "15%",
    enableSort: true,
  },
  {
    label: "Total Products",
    key: "totalProducts",
    isCentered: true,
    width: "15%",
    enableSort: true,
  },
  {
    label: "Fast Moving",
    key: "fastCount",
    isCentered: true,
    width: "15%",
    enableSort: true,
  },
  {
    label: "Slow Moving",
    key: "slowCount",
    isCentered: true,
    width: "15%",
    enableSort: true,
  },
  {
    label: "Non Moving",
    key: "nonMovingCount",
    isCentered: true,
    width: "15%",
    enableSort: true,
  },
];

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
  onCountClick,
}: Props) => {
  if (!loading && data.length === 0) {
    return <NoData />;
  }

  const { sortKey, sortValue } = toHeaderSort(sort);

  return (
    <AppTable container responsive containerStyle={containerStyle} stickyHeader>
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
          data.map((item, idx) => (
            <AppTable.Row key={idx}>
              <AppTable.Cell className="tw:text-center">
                {idx + 1}
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:font-medium tw:line-clamp-1">
                  {item.categoryName}
                </div>
                {item.categoryRefId && (
                  <div className="tw:text-xs tw:text-gray-500">
                    ID: {item.categoryRefId}
                  </div>
                )}
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <Amount value={item.value ?? 0} decimalPlaces={0} />
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <span className={item.totalProducts ? "" : "tw:text-gray-400"}>
                  {item.totalProducts || 0}
                </span>
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <button
                  type="button"
                  className={`tw:font-medium tw:cursor-pointer ${
                    item.fastCount
                      ? "tw:text-primary tw:hover:underline"
                      : "tw:text-gray-400"
                  }`}
                  onClick={() => onCountClick(item, "fast_moving")}
                >
                  {item.fastCount || 0}
                </button>
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <button
                  type="button"
                  className={`tw:font-medium tw:cursor-pointer ${
                    item.slowCount
                      ? "tw:text-primary tw:hover:underline"
                      : "tw:text-gray-400"
                  }`}
                  onClick={() => onCountClick(item, "slow_moving")}
                >
                  {item.slowCount || 0}
                </button>
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <button
                  type="button"
                  className={`tw:font-medium tw:cursor-pointer ${
                    item.nonMovingCount
                      ? "tw:text-primary tw:hover:underline"
                      : "tw:text-gray-400"
                  }`}
                  onClick={() => onCountClick(item, "non_moving")}
                >
                  {item.nonMovingCount || 0}
                </button>
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
