import { isToday } from "date-fns";
import { AlertCircle } from "lucide-react";
import React from "react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import {
  AppTable,
  TableHeader,
  TableSkeletonLoader,
} from "~/components/core/table";
import DateTimeCell from "../../../components/DateTimeCell";
import RemarksCell from "../../../components/RemarksCell";
import type {
  SortValue,
  TableHeaderItem,
  VariantColor,
} from "~/types/CommonTypes";

export interface RetailerFollowupRow {
  _id?: string;
  referenceId?: string;
  type?: string;
  status?: string;
  remarks?: string;
  employee?: { employeeId?: string; id?: string; refId?: string; name?: string };
  modifiedBy?: { id?: string; name?: string; refId?: string };
  createdAt?: string;
  followUpDateTime?: string;
  modifiedAt?: string;
  remarksLog?: any[];
  _statusLabel?: string;
  _statusColor?: string;
  _typeLabel?: string;
  _typeColor?: string;
  _isFolloupDue?: boolean;
  _overdueLabel?: string;
  _canClose?: boolean;
}

interface DesktopViewProps {
  loading?: boolean;
  data: RetailerFollowupRow[];
  sortKey: string;
  sortValue: SortValue;
  onSort: (data: { key: string; value: SortValue }) => void;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  hasMoreData: boolean;
  onView: (row: RetailerFollowupRow) => void;
  onUpdate: (row: RetailerFollowupRow) => void;
}

// CS-facing columns: what state the call-back is in → when to call → why →
// who logged it → the action. The internal reference and the "last modified"
// timestamp were dropped; they don't help an agent decide who to call next.
const headers: TableHeaderItem[] = [
  { label: "S.No", key: "sno", enableSort: false, width: "56px" },
  { label: "Status", key: "status", width: "13%", enableSort: false },
  {
    label: "Follow Up On",
    key: "followUpDateTime",
    width: "20%",
    enableSort: true,
  },
  { label: "What was discussed", key: "remarks", width: "35%", enableSort: false },
  { label: "Logged by", key: "createdAt", width: "20%", enableSort: true },
  { label: "Action", key: "action", width: "12%", enableSort: false },
];

const containerStyle = {
  maxHeight: "calc(100vh - 420px)",
};

const DesktopView: React.FC<DesktopViewProps> = ({
  loading,
  data,
  sortKey,
  sortValue,
  onSort,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  hasMoreData,
  onView,
  onUpdate,
}) => {
  if (!loading && data.length === 0) {
    return (
      <NoData
        title="No follow-ups found"
        description="This retailer has no follow-ups for the selected filters."
      />
    );
  }

  return (
    <AppTable
      size="sm"
      stickyHeader
      fixedLayout
      container
      containerStyle={containerStyle}
      minWidth="880px"
      condensed
    >
      <AppTable.Header>
        <TableHeader
          headers={headers}
          onSort={onSort}
          sortKey={sortKey}
          sortValue={sortValue}
        />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} rows={20} />
        ) : (
          data.map((row, idx) => {
            const dueToday =
              !row._isFolloupDue &&
              row.status !== "Completed" &&
              row.followUpDateTime &&
              isToday(new Date(row.followUpDateTime));
            return (
              <AppTable.Row
                key={row._id || row.referenceId || idx}
                className={row._isFolloupDue ? "tw:bg-red-50" : undefined}
              >
                <AppTable.Cell>{idx + 1}</AppTable.Cell>

                <AppTable.Cell>
                  {row._isFolloupDue ? (
                    <AppBadge variant="danger">Overdue</AppBadge>
                  ) : row.status ? (
                    <AppBadge
                      variant={(row._statusColor as VariantColor) || "default"}
                    >
                      {row._statusLabel || row.status}
                    </AppBadge>
                  ) : (
                    "-"
                  )}
                </AppTable.Cell>

                <AppTable.Cell>
                  {row.followUpDateTime ? (
                    <div className="tw:flex tw:flex-col tw:items-start tw:gap-1 tw:py-1">
                      <DateTimeCell
                        value={row.followUpDateTime}
                        hideTime
                        dateClassName={
                          row._isFolloupDue
                            ? "tw:font-semibold tw:text-red-700"
                            : undefined
                        }
                      />
                      {row._isFolloupDue && (
                        <span className="tw:inline-flex tw:items-center tw:gap-1 tw:rounded tw:border tw:border-red-200 tw:bg-red-50 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-medium tw:text-red-700">
                          <AlertCircle className="tw:w-2.5 tw:h-2.5 tw:shrink-0" />
                          Follow up {row._overdueLabel}
                        </span>
                      )}
                      {dueToday && (
                        <span className="tw:inline-flex tw:items-center tw:gap-1 tw:rounded tw:border tw:border-emerald-200 tw:bg-emerald-50 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:text-emerald-700">
                          Follow up today
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="tw:text-xs tw:text-gray-400">
                      No follow-up set
                    </span>
                  )}
                </AppTable.Cell>

                <AppTable.Cell>
                  <RemarksCell value={row.remarks} />
                </AppTable.Cell>

                <AppTable.Cell>
                  <div className="tw:flex tw:flex-col tw:gap-0.5 tw:py-1">
                    {row.employee?.name ? (
                      row.employee?.refId ? (
                        <AppLink
                          href={`/master/crm/employee?id=${row.employee.refId}`}
                          asLink
                          showLinkColor
                          className="tw:text-xs tw:font-medium"
                        >
                          {row.employee.name}
                        </AppLink>
                      ) : (
                        <span className="tw:text-xs tw:font-medium tw:text-gray-700">
                          {row.employee.name}
                        </span>
                      )
                    ) : (
                      <span className="tw:text-xs tw:text-gray-400">—</span>
                    )}
                    <DateTimeCell
                      value={row.createdAt}
                      dateClassName="tw:text-[11px] tw:text-gray-500"
                    />
                  </div>
                </AppTable.Cell>

                <AppTable.Cell>
                  {/* View is always available (read-only). Open (still
                      actionable) follow-ups also get the primary Update action;
                      closed ones are done, so View only. */}
                  <div className="tw:flex tw:items-center tw:gap-2">
                    <AppButton
                      size="small"
                      fill="outline"
                      color="primary"
                      onClick={() => onView(row)}
                    >
                      View
                    </AppButton>
                    {row._canClose && (
                      <AppButton
                        size="small"
                        color="success"
                        onClick={() => onUpdate(row)}
                      >
                        Update
                      </AppButton>
                    )}
                  </div>
                </AppTable.Cell>
              </AppTable.Row>
            );
          })
        )}
        {hasMoreData && !loading && (
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
