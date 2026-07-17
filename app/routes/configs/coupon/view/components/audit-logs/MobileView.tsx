import React from "react";
import { ArrowRight, Clock } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import {
  renderChangeValue,
  VISIBLE_CHANGES_LIMIT,
  ShowMoreToggle,
} from "./helpers";

/** Mobile / tablet stacked card for a single audit log entry. */
const MobileCard: React.FC<{ log: any; index: number }> = ({
  log,
  index,
}) => {
  const [expanded, setExpanded] = React.useState(false);
  const changes: any[] = log._changes || [];
  const hasMore = changes.length > VISIBLE_CHANGES_LIMIT;
  const visibleChanges =
    hasMore && !expanded ? changes.slice(0, VISIBLE_CHANGES_LIMIT) : changes;

  return (
    <div className="tw:flex tw:flex-col">
      {/* Header: index + status on the left, timestamp on the right */}
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:pb-3 tw:border-b tw:border-gray-100">
        <div className="tw:flex tw:items-center tw:gap-2 tw:min-w-0">
          <span className="tw:inline-flex tw:items-center tw:justify-center tw:h-6 tw:min-w-6 tw:px-1.5 tw:rounded-full tw:bg-gray-100 tw:text-[11px] tw:font-semibold tw:text-gray-600">
            #{index + 1}
          </span>
          <AppBadge
            variant={log._statusColor}
            className="tw:text-xs tw:px-2 tw:py-0.5"
          >
            {log._statusLabel}
          </AppBadge>
        </div>
        <div className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-500 tw:shrink-0">
          <Clock className="tw:w-3.5 tw:h-3.5 tw:text-gray-400" />
          <DateFormat value={log._loggedOn} />
        </div>
      </div>

      {/* Meta: logged by + remarks */}
      <div className="tw:flex tw:flex-col tw:gap-2.5 tw:py-3">
        <div className="tw:flex tw:items-start tw:gap-2">
          <span className="tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-wide tw:text-gray-400 tw:w-24 tw:shrink-0 tw:pt-0.5">
            Logged By
          </span>
          <span className="tw:text-xs tw:font-medium tw:text-gray-800 tw:break-words tw:min-w-0">
            {log._loggedBy}
          </span>
        </div>
        <div className="tw:flex tw:items-start tw:gap-2">
          <span className="tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-wide tw:text-gray-400 tw:w-24 tw:shrink-0 tw:pt-0.5">
            Remarks
          </span>
          <span className="tw:text-xs tw:text-gray-700 tw:break-words tw:min-w-0">
            {log.remarks || "—"}
          </span>
        </div>
      </div>

      {/* Changes */}
      {changes.length > 0 && (
        <div className="tw:flex tw:flex-col tw:gap-2 tw:rounded-lg tw:bg-gray-50 tw:p-3">
          {visibleChanges.map((change: any) => (
            <div
              key={change.field}
              className="tw:flex tw:flex-col tw:gap-1 tw:pb-2 tw:border-b tw:border-gray-100 last:tw:border-0 last:tw:pb-0"
            >
              <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500 tw:break-words">
                {change.label}
              </div>
              <div className="tw:flex tw:items-center tw:gap-2 tw:text-xs tw:flex-wrap">
                <span className="tw:inline-flex tw:px-2 tw:py-0.5 tw:rounded tw:bg-red-50 tw:text-red-600 tw:break-words">
                  {renderChangeValue(
                    change.type,
                    change.oldRaw,
                    change.oldValue
                  )}
                </span>
                <ArrowRight className="tw:w-3.5 tw:h-3.5 tw:text-gray-400 tw:shrink-0" />
                <span className="tw:inline-flex tw:px-2 tw:py-0.5 tw:rounded tw:bg-green-50 tw:text-green-700 tw:font-medium tw:break-words">
                  {renderChangeValue(
                    change.type,
                    change.newRaw,
                    change.newValue
                  )}
                </span>
              </div>
            </div>
          ))}
          {hasMore && (
            <ShowMoreToggle
              expanded={expanded}
              hiddenCount={changes.length - VISIBLE_CHANGES_LIMIT}
              onToggle={() => setExpanded((prev) => !prev)}
            />
          )}
        </div>
      )}
    </div>
  );
};

/** Mobile / tablet stacked card list for all audit log entries. */
const MobileView: React.FC<{ logs: any[] }> = ({ logs }) => {
  return (
    <div className="tw:flex tw:flex-col tw:gap-3">
      {logs.map((log: any, index: number) => (
        <AppCard key={log._id} className="tw:mb-0">
          <MobileCard log={log} index={index} />
        </AppCard>
      ))}
    </div>
  );
};

export default MobileView;
