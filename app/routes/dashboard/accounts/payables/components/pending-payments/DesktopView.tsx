import React from "react";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import DateFormat from "~/components/core/date/DateFormat";
import Amount from "~/components/core/amount/Amount";
import { TableSkeletonLoader } from "~/components/core/table";
import AppBadge from "~/components/core/badge/AppBadge";
import NoData from "~/components/core/no-data/NoData";
import AppLink from "~/components/core/link/AppLink";
import { useTranslation } from "react-i18next";

interface DesktopViewData {
  _id: string;
  counterpartyName: string;
  outstandingAmount: number;
  dueDate: string | Date;
  status: string;
  [key: string]: any;
}

interface DesktopViewProps {
  loading?: boolean;
  data: DesktopViewData[];
}

const headers = [
  {
    label: "From Party",
    langKey: "fromParty",
    key: "counterpartyName",
    enableSort: false,
    width: "20%",
  },
  {
    label: "Amount",
    langKey: "amount",
    key: "outstandingAmount",
    enableSort: false,
    width: "14%",
  },
  {
    label: "Due Date",
    langKey: "dueDate",
    key: "dueDate",
    enableSort: false,
    width: "20%",
  },
  {
    label: "Status",
    langKey: "status",
    key: "status",
    enableSort: false,
    width: "20%",
  },
];

const DesktopView: React.FC<DesktopViewProps> = ({ loading, data }) => {
  const { t } = useTranslation(["common"]);

  return (
    <AppTable size="sm" stickyHeader fixedLayout container minWidth="600px">
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} />
        ) : data && data.length > 0 ? (
          data.map((row, idx) => (
            <AppTable.Row key={row._id || idx}>
              <AppTable.Cell>
                <AppLink href={row.toParty.redirectionUrl} asLink>
                  {row.toParty.name || "-"}
                </AppLink>
                <div className="tw:text-xs tw:text-slate-500 tw:mt-1">
                  {row.toParty?._type}
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                <Amount value={row.amount} decimalPlaces={2} />
              </AppTable.Cell>
              <AppTable.Cell>
                <DateFormat value={row.dueDate} formatStr="dd MMM yyyy" />
              </AppTable.Cell>
              <AppTable.Cell>
                <AppBadge variant={row._statusColor || "default"}>
                  {row._status}
                </AppBadge>
              </AppTable.Cell>
            </AppTable.Row>
          ))
        ) : (
          <AppTable.Row>
            <AppTable.Cell colSpan={5} className="tw:text-center">
              <NoData>
                <h5 className="tw:mb-2">{t("noPendingPaymentsFound")}</h5>
                <p className="tw:text-muted tw:mb-0">
                  {t("vendorPendingPaymentEmptyMessage")}
                </p>
              </NoData>
            </AppTable.Cell>
          </AppTable.Row>
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
