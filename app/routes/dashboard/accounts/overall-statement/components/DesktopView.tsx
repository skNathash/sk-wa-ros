import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import { TableSkeletonLoader } from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import { useTranslation } from "react-i18next";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import { Building2 } from "lucide-react";

interface StatementData {
  _id: string;
  paymentDate: string | Date;
  notes?: string;
  sourceReference?: string;
  statementType?: "credit" | "debit";
  amount?: number;
  balanceBefore?: number;
  balanceAfter?: number;
  sourceType?: string;
  [key: string]: any;
}

interface DesktopViewProps {
  loading?: boolean;
  data: StatementData[];
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  hasMoreData: boolean;
  callback: (payload: { action: string; data?: any }) => void;
}

const getHeaders = (t: any) => [
  {
    label: t("date"),
    key: "paymentDate",
    enableSort: false,
    width: "13%",
  },
  {
    label: t("description"),
    key: "notes",
    enableSort: false,
    width: "25%",
  },
  {
    label: t("reference"),
    key: "sourceReference",
    enableSort: false,
    width: "15%",
  },
  {
    label: t("openingBalance"),
    key: "balanceBefore",
    enableSort: false,
    width: "12%",
  },
  {
    label: t("credit"),
    key: "amount",
    enableSort: false,
    width: "8%",
  },
  {
    label: t("debit"),
    key: "amount",
    enableSort: false,
    width: "8%",
  },
  {
    label: t("closingBalance"),
    key: "balanceAfter",
    enableSort: false,
    width: "15%",
  },
];

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

const DesktopView: React.FC<DesktopViewProps> = ({
  loading,
  data,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  hasMoreData,
  callback,
}) => {
  const { t } = useTranslation();
  const headers = getHeaders(t);

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
      minWidth="1000px"
    >
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} rows={30} />
        ) : data && data.length > 0 ? (
          data.map((row, idx) => (
            <AppTable.Row
              key={row._id || idx}
              onClick={() => callback({ action: "viewPayment", data: row })}
              className={
                row.sourceType === "PAYMENT" ? "tw:cursor-pointer" : ""
              }
            >
              <AppTable.Cell>
                <DateFormat value={row.paymentDate} formatStr="dd MMM yyyy" />
                <div className="tw:text-xs tw:text-slate-500 tw:mt-1">
                  <DateFormat value={row.paymentDate} formatStr="hh:mm a" />
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                {row.sourceType ? (
                  <div className="tw:mb-1">
                    <AppBadge variant={row.sourceVariantColor || "primary"}>
                      {row._sourceTypeLbl}
                    </AppBadge>
                  </div>
                ) : null}

                <div className="tw:text-xs tw:text-gray-500">
                  {row.notes || "-"}
                </div>
                {row._vendorInfo?.id && (
                  <div className="tw:text-xs tw:text-gray-600 tw:mt-1 tw:flex tw:items-center tw:gap-1">
                    <span className="tw:text-slate-700 tw:mr-1 tw:flex tw:items-center tw:gap-1">
                      <Building2 size={14} />
                      {t("vendor")}:
                    </span>
                    {row._vendorInfo?.id ? (
                      <AppLink href={row._vendorInfo.redirectionUrl} asLink>
                        {row._vendorInfo.name || row._vendorInfo.id}
                        {row._vendorInfo?.vendorType ? (
                          <AppBadge
                            variant={row._vendorInfo?.vendorTypeColor}
                            className="tw:ml-1"
                          >
                            {row._vendorInfo?.vendorType}
                          </AppBadge>
                        ) : null}
                      </AppLink>
                    ) : null}
                  </div>
                )}
              </AppTable.Cell>
              <AppTable.Cell>
                <AppLink
                  href={row.sourceRedirectionUrl}
                  asLink
                  className="tw:bg-gray-100 tw:text-gray-500 tw:px-2 tw:py-1 tw:rounded-md"
                >
                  <code>{row.sourceReference}</code>
                </AppLink>
              </AppTable.Cell>
              <AppTable.Cell>
                <Amount
                  value={row.balanceBefore ?? 0}
                  decimalPlaces={2}
                  className="tw:ml-1 tw:text-slate-500 tw:font-medium"
                />
              </AppTable.Cell>
              <AppTable.Cell>
                {row.statementType === "credit" ? (
                  <Amount
                    value={row.amount ?? 0}
                    decimalPlaces={2}
                    className="wa-amount tw:ml-1 tw:font-medium tw:text-[color:var(--wa-domain-in)]"
                  />
                ) : (
                  "-"
                )}
              </AppTable.Cell>
              <AppTable.Cell>
                {row.statementType === "debit" ? (
                  <Amount
                    value={row.amount ?? 0}
                    decimalPlaces={2}
                    className="wa-amount tw:ml-1 tw:font-medium tw:text-[color:var(--wa-domain-out)]"
                  />
                ) : (
                  "-"
                )}
              </AppTable.Cell>
              <AppTable.Cell>
                <Amount
                  value={row.balanceAfter ?? 0}
                  decimalPlaces={2}
                  className="tw:ml-1 tw:text-slate-500 tw:font-medium"
                />
              </AppTable.Cell>
            </AppTable.Row>
          ))
        ) : (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length} className="tw:text-center">
              {t("noDataFound")}
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
};

export default DesktopView;
