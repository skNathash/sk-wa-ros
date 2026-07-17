import { CheckCircle, Eye } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import {
  AppTable,
  TableHeader,
  TableSkeletonLoader,
} from "~/components/core/table";

type Props = {
  data: any[];
  callback: (a: { action: string; data: any }) => void;
  sortKey: string;
  sortValue: "asc" | "desc";
  sortCb: (data: { key: string; value: "asc" | "desc" }) => void;
  loading: boolean;
};

const headers = [
  { label: "Payment Date", key: "paymentDate", width: "20%", enableSort: true },
  { label: "PO ID", key: "poId", width: "12%", enableSort: true },
  {
    label: "Amount",
    key: "poAmount",
    width: "15%",
    enableSort: true,
  },
  { label: "Method", key: "paymentMethod", width: "15%", enableSort: true },
  { label: "Reference", key: "refNo", width: "25%", enableSort: true },
  { label: "Status", key: "status", width: "15%", enableSort: true },
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
              No payments found.
            </td>
          </tr>
        ) : (
          data.map((row, idx) => {
            return (
              <AppTable.Row
                key={row._id || idx}
                className="tw:cursor-pointer"
                onClick={() => view(row)}
              >
                <AppTable.Cell>
                  <DateFormat
                    value={row.paymentDate}
                    formatStr="dd MMM yyyy hh:mm a"
                  />
                </AppTable.Cell>

                <AppTable.Cell>
                  <AppLink className="tw:text-blue-500" onClick={() => {}}>
                    {row.poId}
                  </AppLink>
                </AppTable.Cell>

                <AppTable.Cell className="tw:font-semibold">
                  <Amount value={row.poAmount || 0} />
                </AppTable.Cell>

                <AppTable.Cell>
                  {row.paymentMethod ? (
                    <AppBadge variant="light">{row.paymentMethod}</AppBadge>
                  ) : (
                    "-"
                  )}
                </AppTable.Cell>

                <AppTable.Cell>
                  <div className="tw:font-medium">{row.refNo || "-"}</div>
                </AppTable.Cell>

                {/* Status column */}
                <AppTable.Cell>
                  {row.status ? (
                    <AppBadge
                      variant={row.status === "Paid" ? "success" : "danger"}
                      className="tw:flex tw:items-center tw:gap-1"
                    >
                      {row.status === "Paid" && (
                        <CheckCircle size={14} className="tw:text-green-600" />
                      )}
                      {row.status === "Paid"
                        ? "Paid"
                        : row.status === "UnPaid"
                        ? "UnPaid"
                        : row.status}
                    </AppBadge>
                  ) : (
                    "-"
                  )}
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
