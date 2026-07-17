import { DownloadIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import { TableSkeletonLoader } from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import PlatformFeeStatementPlan from "~/shared/accounts/components/platform-fee-statement-plan/PlatformFeeStatementPlan";
import type { TableHeaderItem } from "~/types/CommonTypes";

interface DesktopViewProps {
  data: any[];
  loading: boolean;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  hasMoreData: boolean;
  callback: (a: { action: string; data: any }) => void;
}

const headers: TableHeaderItem[] = [
  { label: "Date", enableSort: false, langKey: "date" },
  { label: "ID", enableSort: false, langKey: "id" },
  { label: "Description", enableSort: false, langKey: "description" },
  { label: "Order", enableSort: false, langKey: "referenceId" },
  { label: "Opening Balance", enableSort: false, langKey: "openingBalance" },
  { label: "Credit", enableSort: false, langKey: "credit" },
  { label: "Debit", enableSort: false, langKey: "debit" },
  { label: "Closing Balance", enableSort: false, langKey: "closingBalance" },
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
}: DesktopViewProps) => {
  const { t } = useTranslation(["common"]);

  if (!loading && data.length === 0) {
    return <NoData />;
  }

  return (
    <>
      <AppTable responsive={true} hover={true} striped={false}>
        <AppTable.Header>
          <TableHeader headers={headers} />
        </AppTable.Header>
        <AppTable.Body>
          {loading ? (
            <TableSkeletonLoader cols={headers.length} rows={10} />
          ) : (
            data.map((item, index) => (
              <AppTable.Row key={item._id || index}>
                <AppTable.Cell>
                  <div className="tw:text-xs tw:whitespace-nowrap">
                    {item.createdAt ? (
                      <DateFormat value={item.createdAt} />
                    ) : (
                      "-"
                    )}
                  </div>
                </AppTable.Cell>
                <AppTable.Cell>
                  <div className="tw:text-xs tw:font-medium tw:text-gray-600">
                    {item.refId || "-"}
                  </div>
                </AppTable.Cell>
                <AppTable.Cell>
                  <div className="tw:text-gray-500 tw:text-xs">
                    {item.description || "--"}
                    {(item.planName || item.planRefId) && (
                      <div className="tw:mt-1 tw:text-xs">
                        {item.planName && (
                          <PlatformFeeStatementPlan
                            planName={item.planName}
                            startDate={item.planStartAt}
                            endDate={item.planEndAt}
                          />
                        )}
                        {item.planRefId && <div>Ref ID: {item.planRefId}</div>}
                      </div>
                    )}
                  </div>
                </AppTable.Cell>
                <AppTable.Cell>
                  <div className="tw:flex tw:gap-2 tw:items-center">
                    <div className="tw:text-xs tw:font-medium tw:text-blue-600">
                      {item._tranRedirect?.path ? (
                        <AppLink href={item._tranRedirect.path} asLink>
                          {item.transactionId || "-"}
                        </AppLink>
                      ) : (
                        item.transactionId || "-"
                      )}
                    </div>
                    {item._showDownloadLink && (
                      <AppButton
                        onClick={() =>
                          callback({ action: "download", data: item })
                        }
                        fill="clear"
                        size="small"
                        className="tw:h-6"
                      >
                        <DownloadIcon />
                      </AppButton>
                    )}
                  </div>
                </AppTable.Cell>
                <AppTable.Cell>
                  <Amount value={item.openingBalance || 0} />
                </AppTable.Cell>
                <AppTable.Cell>
                  {item.transactionType === "Credit" ? (
                    <Amount
                      value={item.amount || 0}
                      className="tw:text-green-600 tw:font-medium"
                    />
                  ) : (
                    "-"
                  )}
                </AppTable.Cell>
                <AppTable.Cell>
                  {item.transactionType === "Debit" ? (
                    <Amount
                      value={item.amount || 0}
                      className="tw:text-red-600 tw:font-medium"
                    />
                  ) : (
                    "-"
                  )}
                </AppTable.Cell>
                <AppTable.Cell>
                  <div className="tw:font-bold">
                    <Amount value={item.closingBalance || 0} />
                  </div>
                </AppTable.Cell>
              </AppTable.Row>
            ))
          )}

          {hasMoreData && !loading && data.length > 0 && (
            <AppTable.Row>
              <AppTable.Cell colSpan={8} className="tw:text-center">
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
    </>
  );
};

export default DesktopView;
