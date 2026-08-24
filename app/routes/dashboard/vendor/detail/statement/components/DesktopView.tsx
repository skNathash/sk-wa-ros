import React from "react";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import AppBadge from "~/components/core/badge/AppBadge";
import { TableSkeletonLoader } from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import AppLink from "~/components/core/link/AppLink";
import type { TableHeaderItem } from "~/types/CommonTypes";
import NoData from "~/components/core/no-data/NoData";

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
  sourceRedirectionUrl?: string;
  sourceVariantColor?: string;
  _sourceTypeLbl?: string;
  [key: string]: any;
}

interface DesktopViewProps {
  loading?: boolean;
  data: StatementData[];
  callback: (data: { action: string; data?: any }) => void;
}

const headers: TableHeaderItem[] = [
  { label: "Date", key: "transactionDate", enableSort: false, width: "13%" },
  {
    label: "Description",
    key: "notes",
    enableSort: false,
    width: "25%",
  },
  {
    label: "Reference ID",
    key: "sourceReference",
    enableSort: false,
    width: "15%",
    info: (
      <div className="tw:text-xs tw:text-slate-500">
        Reference ID is the ID of the source of the transaction like PO, Order
        ID
      </div>
    ),
  },
  {
    label: "Opening Balance",
    key: "balanceBefore",
    enableSort: false,
    width: "12%",
  },
  { label: "Credit", key: "amount", enableSort: false, width: "8%" },
  { label: "Debit", key: "amount", enableSort: false, width: "8%" },
  {
    label: "Closing Balance",
    key: "balanceAfter",
    enableSort: false,
    width: "15%",
  },
];

const DesktopView: React.FC<DesktopViewProps> = ({
  loading,
  data,
  callback,
}) => {
  return (
    <AppTable size="sm" stickyHeader fixedLayout>
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
                <DateFormat
                  value={row.transactionDate}
                  formatStr="dd MMM yyyy"
                />
                <div className="tw:text-xs tw:text-slate-500 tw:mt-1">
                  <DateFormat value={row.transactionDate} formatStr="hh:mm a" />
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                {row._sourceTypeLbl ? (
                  <div className="tw:mb-1">
                    <AppBadge
                      variant={(row.sourceVariantColor as any) || "primary"}
                    >
                      {row._sourceTypeLbl}
                    </AppBadge>
                  </div>
                ) : null}
                <div className="tw:text-xs tw:text-slate-500">
                  {row.description || "-"}
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                {row.sourceRedirectionUrl &&
                row.sourceRedirectionUrl !== "#" ? (
                  <AppLink
                    href={row.sourceRedirectionUrl}
                    asLink={true}
                    className="tw:bg-gray-100 tw:text-gray-500 tw:px-2 tw:py-1 tw:rounded-md hover:tw:bg-gray-200 tw:transition-colors"
                  >
                    <code>{row.sourceReference}</code>
                  </AppLink>
                ) : (
                  <span className="tw:bg-gray-100 tw:text-gray-500 tw:px-2 tw:py-1 tw:rounded-md">
                    <code>{row.sourceReference}</code>
                  </span>
                )}
              </AppTable.Cell>
              <AppTable.Cell>
                <Amount
                  value={row.balanceBefore ?? 0}
                  decimalPlaces={2}
                  className="tw:ml-1 tw:text-slate-500 tw:font-medium"
                />
              </AppTable.Cell>
              <AppTable.Cell>
                {row.paymentType === "credit" ? (
                  <Amount
                    value={row.amount ?? 0}
                    decimalPlaces={2}
                    className="tw:ml-1 tw:text-green-500 tw:font-medium"
                  />
                ) : (
                  "-"
                )}
              </AppTable.Cell>
              <AppTable.Cell>
                {row.paymentType === "debit" ? (
                  <Amount
                    value={row.amount ?? 0}
                    decimalPlaces={2}
                    className="tw:ml-1 tw:text-red-500 tw:font-medium"
                  />
                ) : (
                  "-"
                )}
              </AppTable.Cell>
              <AppTable.Cell>
                <Amount
                  value={row.outstandingAmount ?? 0}
                  decimalPlaces={2}
                  className="tw:ml-1 tw:text-slate-500 tw:font-medium"
                />
              </AppTable.Cell>
            </AppTable.Row>
          ))
        ) : (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length} className="tw:text-center">
              <NoData />
            </AppTable.Cell>
          </AppTable.Row>
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
