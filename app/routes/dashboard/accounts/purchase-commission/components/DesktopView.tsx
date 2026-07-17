import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import { TableSkeletonLoader } from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import AppLink from "~/components/core/link/AppLink";
import DownloadCommissionButton from "./DownloadCommissionButton";

type DesktopViewProps = {
  data: any[];
  loading?: boolean;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  hasMoreData: boolean;
};

const headers = [
  {
    label: "Date",
    langKey: "date",
    key: "createdAt",
    enableSort: false,
    width: "18%",
  },
  {
    label: "Receipt ID",
    langKey: "receiptId",
    key: "receiptId",
    enableSort: false,
    width: "14%",
  },
  {
    label: "PO ID",
    langKey: "poId",
    key: "refId",
    enableSort: false,
    width: "18%",
  },
  {
    label: "Amount",
    langKey: "amount",
    key: "amount",
    enableSort: false,
    width: "16%",
  },
  {
    label: "Tax",
    langKey: "tax",
    key: "taxInfo",
    enableSort: false,
    width: "20%",
  },
  {
    label: "",
    langKey: "actions",
    key: "actions",
    enableSort: false,
    width: "12%",
  },
];

const containerStyle = {
  maxHeight: "calc(100vh - 260px)",
};

export default function DesktopView({
  data,
  loading,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  hasMoreData,
}: DesktopViewProps) {
  if (!loading && data.length === 0) {
    return <NoData />;
  }

  return (
    <AppTable
      size="sm"
      stickyHeader
      fixedLayout
      container
      containerStyle={containerStyle}
      minWidth="820px"
    >
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} rows={30} />
        ) : data && data.length > 0 ? (
          data.map((row) => (
            <AppTable.Row key={String(row.receiptId)}>
              <AppTable.Cell>
                <DateFormat value={row.createdAt} />
              </AppTable.Cell>
              <AppTable.Cell>{row.receiptId}</AppTable.Cell>
              <AppTable.Cell>
                {row.refId ? (
                  <AppLink
                    href={`/dashboard/purchase-order/view/${row.refOrderNo}`}
                    asLink
                    className="tw:bg-gray-100 tw:text-gray-600 tw:px-2 tw:py-1 tw:rounded-md"
                  >
                    <code>{row.refId}</code>
                  </AppLink>
                ) : (
                  "-"
                )}
              </AppTable.Cell>
              <AppTable.Cell>
                <Amount
                  value={row.amount ?? 0}
                  decimalPlaces={2}
                  className="tw:ml-1 tw:text-red-600 tw:font-medium"
                />
              </AppTable.Cell>
              <AppTable.Cell>{row.taxInfo?.gst ?? 0}%</AppTable.Cell>
              <AppTable.Cell>
                <DownloadCommissionButton receiptId={row.receiptId} />
              </AppTable.Cell>
            </AppTable.Row>
          ))
        ) : (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length} className="tw:text-center">
              No data found
            </AppTable.Cell>
          </AppTable.Row>
        )}

        {hasMoreData && !loading && data.length > 0 && (
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
        )}
      </AppTable.Body>
    </AppTable>
  );
}
