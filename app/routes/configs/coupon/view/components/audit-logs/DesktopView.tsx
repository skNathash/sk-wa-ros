import React from "react";
import AppCard from "~/components/core/card/AppCard";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import {
  headers,
  renderChangeValue,
  VISIBLE_CHANGES_LIMIT,
  ShowMoreToggle,
} from "./helpers";

/** Desktop table row for a single audit log entry (Field / Old / New columns). */
const DesktopRow: React.FC<{ log: any; index: number }> = ({ log, index }) => {
  const [expanded, setExpanded] = React.useState(false);
  const changes: any[] = log._changes || [];
  const hasChanges = changes.length > 0;
  const hasMore = changes.length > VISIBLE_CHANGES_LIMIT;
  const visibleChanges =
    hasMore && !expanded ? changes.slice(0, VISIBLE_CHANGES_LIMIT) : changes;

  const toggle = () => setExpanded((prev) => !prev);

  return (
    <AppTable.Row>
      <AppTable.Cell className="tw:text-center tw:align-middle">
        <div className="tw:font-medium tw:text-gray-600 tw:text-xs">
          {index + 1}
        </div>
      </AppTable.Cell>
      <AppTable.Cell className="tw:text-left tw:align-middle">
        <AppBadge
          variant={log._statusColor}
          className="tw:text-xs tw:px-2 tw:py-0.5"
        >
          {log._statusLabel}
        </AppBadge>
      </AppTable.Cell>
      <AppTable.Cell className="tw:text-left tw:align-middle">
        <div className="tw:text-xs tw:text-gray-700">{log._loggedBy}</div>
      </AppTable.Cell>
      <AppTable.Cell className="tw:text-left tw:align-middle">
        <div className="tw:text-xs tw:text-gray-600">
          <DateFormat value={log._loggedOn} />
        </div>
      </AppTable.Cell>
      <AppTable.Cell className="tw:text-left tw:align-middle">
        <div className="tw:text-xs tw:text-gray-700 tw:break-words">
          {log.remarks || "-"}
        </div>
      </AppTable.Cell>
      <AppTable.Cell className="tw:text-left tw:align-top">
        {hasChanges ? (
          <div className="tw:flex tw:flex-col tw:gap-1">
            {visibleChanges.map((change: any) => (
              <div
                key={change.field}
                className="tw:text-xs tw:font-medium tw:text-gray-700 tw:break-words"
              >
                {change.label}
              </div>
            ))}
            {hasMore && (
              <ShowMoreToggle
                expanded={expanded}
                hiddenCount={changes.length - VISIBLE_CHANGES_LIMIT}
                onToggle={toggle}
              />
            )}
          </div>
        ) : (
          <div className="tw:text-xs tw:text-gray-400">-</div>
        )}
      </AppTable.Cell>
      <AppTable.Cell className="tw:text-left tw:align-top">
        {hasChanges ? (
          <div className="tw:flex tw:flex-col tw:gap-1">
            {visibleChanges.map((change: any) => (
              <div
                key={change.field}
                className="tw:text-xs tw:text-red-600 tw:break-words"
              >
                {renderChangeValue(change.type, change.oldRaw, change.oldValue)}
              </div>
            ))}
          </div>
        ) : (
          <div className="tw:text-xs tw:text-gray-400">-</div>
        )}
      </AppTable.Cell>
      <AppTable.Cell className="tw:text-left tw:align-top">
        {hasChanges ? (
          <div className="tw:flex tw:flex-col tw:gap-1">
            {visibleChanges.map((change: any) => (
              <div
                key={change.field}
                className="tw:text-xs tw:text-green-600 tw:font-medium tw:break-words"
              >
                {renderChangeValue(change.type, change.newRaw, change.newValue)}
              </div>
            ))}
          </div>
        ) : (
          <div className="tw:text-xs tw:text-gray-400">-</div>
        )}
      </AppTable.Cell>
    </AppTable.Row>
  );
};

/** Desktop table view for all audit log entries (owns header + table layout). */
const DesktopView: React.FC<{ logs: any[] }> = ({ logs }) => {
  return (
    <AppCard>
      <AppTable
        fixedLayout
        container
        size="sm"
        stickyHeader
        condensed
        minWidth="1000px"
        containerStyle={{ maxHeight: "600px" }}
      >
        <AppTable.Header>
          <TableHeader headers={headers} />
        </AppTable.Header>
        <AppTable.Body>
          {logs.map((log: any, index: number) => (
            <DesktopRow key={log._id} log={log} index={index} />
          ))}
        </AppTable.Body>
      </AppTable>
    </AppCard>
  );
};

export default DesktopView;
