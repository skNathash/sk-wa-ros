import clsx from "clsx";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import TableSkeletonLoader from "~/components/core/table/TableSkeletonLoader";
import type { PaginationState, TableHeaderItem } from "~/types/CommonTypes";

type Props = {
  type: "payables" | "receivables";
  data: any[];
  loading: boolean;
  loadingMore: boolean;
  hasMoreData: boolean;
  loadMore: () => void;
  pagination: PaginationState;
};

const headers: TableHeaderItem[] = [
  { label: "#", key: "sno", width: "5%" },
  { label: "Name", key: "name", width: "30%" },
  { label: "Party", key: "party", width: "20%" },
  { label: "Since", key: "date", width: "20%" },
  { label: "Amount", key: "amount", width: "25%" },
];

const DesktopView = ({
  type,
  data,
  loading,
  loadingMore,
  hasMoreData,
  loadMore,
  pagination,
}: Props) => {
  return (
    <>
      <AppTable size="sm" condensed>
        <AppTable.Header>
          <TableHeader headers={headers} />
        </AppTable.Header>
        <AppTable.Body>
          {loading ? (
            <TableSkeletonLoader cols={headers.length} rows={5} />
          ) : data.length === 0 ? (
            <AppTable.Row noHover>
              <AppTable.Cell colSpan={headers.length}>
                <NoData />
              </AppTable.Cell>
            </AppTable.Row>
          ) : (
            data.map((item: any, index: number) => (
              <AppTable.Row key={item._id}>
                <AppTable.Cell>{index + 1}</AppTable.Cell>
                <AppTable.Cell>
                  {item.redirectionUrl && item.redirectionUrl !== "#" ? (
                    <AppLink
                      asLink
                      href={item.redirectionUrl}
                      className="tw:text-sm tw:font-semibold tw:text-gray-900 hover:tw:text-blue-600 tw:transition-colors"
                    >
                      {item.name}
                    </AppLink>
                  ) : (
                    <span className="tw:text-sm tw:font-semibold tw:text-gray-900">
                      {item.name}
                    </span>
                  )}
                </AppTable.Cell>
                <AppTable.Cell>{item.partyLabel}</AppTable.Cell>
                <AppTable.Cell>
                  {item.date && (
                    <DateFormat
                      value={item.date}
                      formatStr="dd MMM yyyy"
                    />
                  )}
                </AppTable.Cell>
                <AppTable.Cell>
                  <Amount
                    value={item.outstandingAmount}
                    decimalPlaces={2}
                    className={clsx(
                      "tw:text-sm tw:font-bold",
                      type === "payables"
                        ? "tw:text-red-600"
                        : "tw:text-green-600",
                    )}
                  />
                </AppTable.Cell>
              </AppTable.Row>
            ))
          )}
        </AppTable.Body>
      </AppTable>

      {hasMoreData && !loading && (
        <div className="tw:text-center tw:mt-4">
          <LoadMoreButton
            loadMore={loadMore}
            loadedCount={data.length}
            loading={loadingMore}
            totalCount={pagination.totalRecords}
          />
        </div>
      )}
    </>
  );
};

export default DesktopView;
