import { CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import {
  AppTable,
  TableHeader,
  TableSkeletonLoader,
  type TableHeaderItem,
} from "~/components/core/table";

type Props = {
  data: any[];
  callback: (a: { action: string; data: any }) => void;
  sortKey: string;
  sortValue: "asc" | "desc";
  sortCb: (data: { key: string; value: any }) => void;
  loading: boolean;
};

const headers = [
  { label: "Date", key: "transactionDate", width: "15%", enableSort: true },
  {
    label: "Type",
    key: "sourceType",
    width: "12%",
    enableSort: false,
  },
  {
    label: "PO ID",
    key: "sourceReference",
    width: "15%",
    enableSort: true,
  },
  {
    label: "Status",
    key: "status",
    width: "12%",
    enableSort: true,
  },
  {
    label: "Amount",
    key: "amount",
    width: "12%",
    enableSort: true,
  },
  {
    label: "Remarks",
    key: "description",
    width: "20%",
    enableSort: false,
  },
];

const containerStyle = {
  maxHeight: "calc(100vh - 350px)",
};

const DesktopView = ({
  data,
  callback,
  sortKey,
  sortValue,
  sortCb,
  loading,
}: Props) => {
  const { t } = useTranslation(["common"]);

  const view = (data: any, event?: React.MouseEvent<HTMLButtonElement>) => {
    if (event) {
      event.stopPropagation();
    }
    callback({ action: "view", data: data });
  };

  return (
    <AppTable
      size="sm"
      condensed={true}
      fixedLayout={true}
      container
      minWidth="600px"
      containerStyle={containerStyle}
      stickyHeader={true}
    >
      <AppTable.Header>
        <TableHeader
          headers={headers}
          sortKey={sortKey}
          sortValue={sortValue}
          onSort={sortCb}
        />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} rows={10} />
        ) : null}
        {!loading && data.length === 0 ? (
          <tr>
            <td colSpan={headers.length} className="tw:text-center tw:py-8">
              {t("noReceivablesFound")}
            </td>
          </tr>
        ) : (
          data.map((row, idx) => {
            return (
              <AppTable.Row key={row._id || idx} className="tw:cursor-pointer">
                <AppTable.Cell>
                  <DateFormat value={row.transactionDate} />
                </AppTable.Cell>

                <AppTable.Cell>
                  <AppBadge
                    variant={row.sourceVariantColor || "default"}
                    className="tw:uppercase"
                  >
                    {row?._sourceTypeLbl || "-"}
                  </AppBadge>
                </AppTable.Cell>

                <AppTable.Cell>
                  <AppLink
                    asLink
                    href={`/dashboard/purchase-order/view/${row?.sourceId}`}
                  >
                    {row.sourceReference || "-"}
                  </AppLink>
                </AppTable.Cell>

                <AppTable.Cell>
                  {row.status ? (
                    <AppBadge
                      variant={row._statusColor || "default"}
                      className="tw:flex tw:items-center tw:gap-1 tw:uppercase"
                    >
                      {row._status}
                    </AppBadge>
                  ) : (
                    "-"
                  )}
                </AppTable.Cell>

                <AppTable.Cell className="tw:font-semibold">
                  <Amount value={row.amount || 0} />
                </AppTable.Cell>

                <AppTable.Cell>
                  <span className="tw:text-sm tw:text-gray-600">
                    {row.description || "-"}
                  </span>
                </AppTable.Cell>
              </AppTable.Row>
            );
          })
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
