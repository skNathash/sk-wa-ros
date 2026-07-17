import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
// Load more removed - not required anymore
import NoData from "~/components/core/no-data/NoData";
import { TableSkeletonLoader } from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
// AppLink removed because PO ID column was removed
import DownloadCommissionButton from "./DownloadCommissionButton";
import PlatformFeeStatementPlan from "~/shared/accounts/components/platform-fee-statement-plan/PlatformFeeStatementPlan";

type DesktopViewProps = {
  data: any[];
  loading?: boolean;
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
    label: "ID",
    langKey: "id",
    key: "receiptId",
    enableSort: false,
    width: "10%",
  },
  {
    label: "Plan",
    langKey: "plan",
    key: "plan",
    enableSort: false,
    width: "20%",
  },
  {
    label: "Amount",
    langKey: "amount",
    key: "amount",
    enableSort: false,
    width: "20%",
  },
  {
    label: "",
    langKey: "actions",
    key: "actions",
    enableSort: false,
    width: "20%",
  },
];

const containerStyle = {
  maxHeight: "calc(100vh - 260px)",
};

export default function DesktopView({ data, loading }: DesktopViewProps) {
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

              <AppTable.Cell>
                <div className="tw:font-medium tw:text-gray-600">
                  {row.receiptId}
                </div>
              </AppTable.Cell>

              <AppTable.Cell>
                <div className="tw:flex tw:flex-col">
                  {(row._raw?.planName || row._raw?.planRefId) && (
                    <div className="tw:mt-1 tw:text-xs tw:text-gray-500">
                      {row._raw?.planName && (
                        <PlatformFeeStatementPlan
                          planName={row._raw.planName}
                          startDate={row._raw.planStartAt}
                          endDate={row._raw.planEndAt}
                        />
                      )}
                      {row._raw?.planRefId && (
                        <div>Ref ID: {row._raw.planRefId}</div>
                      )}
                    </div>
                  )}
                </div>
              </AppTable.Cell>
              {/* PO ID cell removed */}
              <AppTable.Cell>
                <Amount
                  value={row.amount ?? 0}
                  decimalPlaces={2}
                  className="tw:ml-1 tw:text-red-600 tw:font-medium"
                />
              </AppTable.Cell>
              <AppTable.Cell>
                <DownloadCommissionButton subscriptionId={row.subscriptionId} />
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

        {/* load more removed - pagination handled externally if needed */}
      </AppTable.Body>
    </AppTable>
  );
}
