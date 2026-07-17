import React from "react";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import { AppTable, TableHeader } from "~/components/core/table";

interface Log {
  oldValue: string;
  newValue: string;
  createdAt?: string;
  createdOn?: string;
  remarks: string;
}

interface StockMasterLogsProps {
  logs: Log[];
}

const headers = [
  { label: "Old Value", key: "oldValue" },
  { label: "New Value", key: "newValue" },
  { label: "Created On", key: "createdAt" },
  { label: "Remarks", key: "remarks" },
];

const StockMasterLogs: React.FC<StockMasterLogsProps> = ({ logs }) => {
  return (
    <AppCard title="Logs">
      <AppTable container stickyHeader responsive bordered hover size="sm">
        <AppTable.Header>
          <TableHeader headers={headers} />
        </AppTable.Header>
        <AppTable.Body>
          {logs.length > 0 ? (
            logs.map((log, idx) => (
              <tr key={idx}>
                <td>
                  <DateFormat value={log.oldValue} formatStr="dd MMM yyyy" />
                </td>
                <td>
                  <DateFormat value={log.newValue} formatStr="dd MMM yyyy" />
                </td>
                <td>
                  <DateFormat
                    value={log.createdAt || log.createdOn || null}
                    formatStr="dd MMM yyyy"
                  />
                </td>
                <td>{log.remarks}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={headers.length} className="tw:text-center">
                No logs found
              </td>
            </tr>
          )}
        </AppTable.Body>
      </AppTable>
    </AppCard>
  );
};

export default StockMasterLogs;
