import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import { TableSkeletonLoader } from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import type { TableHeaderItem } from "~/types/CommonTypes";

type Props = {
  data: any[];
  loading: boolean;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  hasMoreData: boolean;
  callback: (payload: { action: string; data: any }) => void;
};

const headers: TableHeaderItem[] = [
  { label: "Date", key: "date", width: "16%", langKey: "date" },
  {
    label: "Description",
    key: "description",
    width: "38%",
    langKey: "description",
  },
  { label: "Order ID", key: "orderId", width: "18%", langKey: "orderId" },
  {
    label: "Amount",
    key: "amount",
    width: "14%",
    langKey: "amountDebit",
    isRightAligned: true,
  },
  {
    label: "Available Limit",
    key: "balance",
    width: "14%",
    langKey: "availableLimit",
    isRightAligned: true,
  },
];

const DesktopView = ({
  data,
  loading,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  hasMoreData,
  callback,
}: Props) => {
  if (!loading && !data.length) {
    return <NoData />;
  }

  return (
    <AppTable size="sm" stickyHeader fixedLayout container minWidth="100px">
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <AppTable.Row>
            <TableSkeletonLoader cols={headers.length} />
          </AppTable.Row>
        ) : null}

        {data.map((row, index) => (
          <AppTable.Row key={row._id || index}>
            <AppTable.Cell>
              <DateFormat value={row.date ?? ""} formatStr="dd MMM yyyy" />
              <div className="tw:text-xs tw:text-slate-500">
                <DateFormat value={row.date ?? ""} formatStr="hh:mm a" />
              </div>
            </AppTable.Cell>

            <AppTable.Cell>
              <div className="tw:text-xs tw:text-slate-600">
                {row.description || "-"}
              </div>
            </AppTable.Cell>

            <AppTable.Cell>
              {row.orderDetails?.orderId ? (
                <button
                  type="button"
                  onClick={() =>
                    callback({ action: "view-order", data: row })
                  }
                  className="tw:text-sm tw:font-medium tw:text-primary tw:hover:underline tw:cursor-pointer"
                >
                  {row.sourceReference || "-"}
                </button>
              ) : (
                <span className="tw:text-sm tw:text-slate-600">
                  {row.sourceReference || "-"}
                </span>
              )}
            </AppTable.Cell>

            <AppTable.Cell className="tw:text-right">
              <Amount
                value={row.rawAmount ?? 0}
                decimalPlaces={2}
                className="tw:font-semibold tw:text-red-500"
              />
            </AppTable.Cell>

            <AppTable.Cell className="tw:text-right">
              <Amount
                value={row.rawBalance ?? 0}
                decimalPlaces={2}
                className="tw:font-semibold tw:text-green-600"
              />
            </AppTable.Cell>
          </AppTable.Row>
        ))}

        {hasMoreData && !loading && data.length > 0 ? (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length} className="tw:text-center">
              <LoadMoreButton
                loadMore={loadMore}
                loading={loadingMore}
                totalCount={totalCount}
                loadedCount={loadedCount}
              />
            </AppTable.Cell>
          </AppTable.Row>
        ) : null}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
