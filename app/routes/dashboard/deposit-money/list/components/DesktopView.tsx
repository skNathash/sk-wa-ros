import React from "react";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import DateFormat from "~/components/core/date/DateFormat";
import AppBadge from "~/components/core/badge/AppBadge";
import { TableSkeletonLoader } from "~/components/core/table";
import NoData from "~/components/core/no-data/NoData";

type Props = {
  items: any[];
  loading: boolean;
  onItemClick: (item: any) => void;
};

const headers = [
  { label: "ID", key: "id" },
  { label: "Type", key: "paymentType" },
  { label: "Amount", key: "amount" },
  { label: "Status", key: "status" },
  { label: "Created On", key: "createdAt" },
  { label: "Action" },
];

const DesktopView: React.FC<Props> = ({ items, loading, onItemClick }) => {
  if (!loading && items.length === 0) {
    return <NoData />;
  }

  return (
    <AppTable container responsive fixedLayout stickyHeader>
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? <TableSkeletonLoader cols={headers.length} /> : null}
        {items.map((it) => (
          <AppTable.Row key={it._id || it.id}>
            <AppTable.Cell>{it._id || it.id}</AppTable.Cell>
            <AppTable.Cell>{it.paymentType || it.type || "-"}</AppTable.Cell>
            <AppTable.Cell>
              {typeof it.amount === "number"
                ? it.amount.toFixed(2)
                : it.amount || "-"}
            </AppTable.Cell>
            <AppTable.Cell>
              <AppBadge
                variant={
                  it.status === "Success"
                    ? "success"
                    : it.status === "Pending"
                    ? "warning"
                    : "danger"
                }
              >
                {it.status || "-"}
              </AppBadge>
            </AppTable.Cell>
            <AppTable.Cell>
              <DateFormat
                value={it.createdAt}
                formatStr="dd MMM yyyy, hh:mm a"
              />
            </AppTable.Cell>
            <AppTable.Cell className="tw:text-center">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => onItemClick(it)}
              >
                View
              </button>
            </AppTable.Cell>
          </AppTable.Row>
        ))}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
