import type React from "react";
import { UserRound, CalendarClock } from "lucide-react";
import DateFormat from "~/components/core/date/DateFormat";
import NextFollowUpChip from "~/shared/crm/components/NextFollowUpChip";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import {
  AppTable,
  TableHeader,
  TableSkeletonLoader,
} from "~/components/core/table";
import type { TableHeaderItem } from "~/types/CommonTypes";
import type { EmployeeSummaryRow } from "./helper";

interface DesktopViewProps {
  loading?: boolean;
  data: EmployeeSummaryRow[];
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  hasMoreData: boolean;
}

const headers: TableHeaderItem[] = [
  { label: "S.No", key: "sno", enableSort: false, width: "50px" },
  { label: "Employee", key: "name", width: "240px", enableSort: false },
  // {
  //   label: "Retailers Contacted",
  //   key: "retailersContacted",
  //   width: "150px",
  //   enableSort: false,
  // },
  {
    label: "Follow-ups",
    key: "total",
    width: "130px",
    enableSort: false,
  },
  {
    label: "Pending Follow-ups",
    key: "pending",
    width: "150px",
    enableSort: false,
  },
  { label: "Overdue", key: "overdue", width: "90px", enableSort: false },
  {
    label: "Last Contact",
    key: "lastLoggedOn",
    width: "180px",
    enableSort: false,
  },
  {
    label: "Next Follow-up",
    key: "nextFollowUp",
    width: "190px",
    enableSort: false,
  },
];

const containerStyle = {
  maxHeight: "calc(100vh - 360px)",
};

// A single status count. When it has a target href and a non-zero value it
// becomes a link into the employee follow-up page pre-filtered to that status.
const CountCell: React.FC<{
  value: number;
  className?: string;
  href?: string;
  suffix?: string;
}> = ({ value, className, href, suffix }) => {
  const classes = `tw:font-semibold tw:tabular-nums ${
    className || "tw:text-gray-900"
  }`;
  const suffixEl = suffix ? (
    <span className="tw:ml-1 tw:font-normal tw:text-xs tw:text-gray-500">
      {suffix}
    </span>
  ) : null;
  if (href && (value ?? 0) > 0) {
    return (
      <AppLink href={href} asLink className={classes}>
        {(value ?? 0).toLocaleString()}
        {suffixEl}
      </AppLink>
    );
  }
  return (
    <span className={classes}>
      {(value ?? 0).toLocaleString()}
      {suffixEl}
    </span>
  );
};

const DesktopView: React.FC<DesktopViewProps> = ({
  loading,
  data,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  hasMoreData,
}) => {
  if (!loading && data.length === 0) {
    return (
      <NoData
        title="No employees found"
        description="Try adjusting your search or filters."
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
      minWidth="1190px"
      condensed
    >
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} rows={20} />
        ) : (
          data.map((row, idx) => (
            <AppTable.Row key={row.id || row.employeeId || idx}>
              <AppTable.Cell>{idx + 1}</AppTable.Cell>

              <AppTable.Cell>
                <div className="tw:flex tw:items-start tw:gap-2 tw:py-1">
                  <span className="tw:flex tw:h-7 tw:w-7 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-gray-100">
                    <UserRound className="tw:h-3.5 tw:w-3.5 tw:text-gray-500" />
                  </span>
                  <div className="tw:flex tw:flex-col tw:gap-0.5 tw:min-w-0">
                    {row.id ? (
                      <AppLink
                        href={`/master/crm/employee?id=${row.id}`}
                        asLink
                        showLinkColor
                        className="tw:font-medium tw:line-clamp-1"
                      >
                        {row.name || "-"}
                      </AppLink>
                    ) : (
                      <span className="tw:font-medium tw:text-gray-900 tw:line-clamp-1">
                        {row.name || "-"}
                      </span>
                    )}
                    {row.email && (
                      <span className="tw:text-xs tw:text-gray-500 tw:line-clamp-1">
                        {row.email}
                      </span>
                    )}
                  </div>
                </div>
              </AppTable.Cell>

              {/* <AppTable.Cell>
                <CountCell
                  value={row.retailersContacted}
                  suffix={
                    row.retailersContacted === 1 ? "retailer" : "retailers"
                  }
                />
              </AppTable.Cell> */}
              <AppTable.Cell>
                <CountCell value={row.total} href={row.links?.total} />
              </AppTable.Cell>
              <AppTable.Cell>
                {/* Pending = still-open + in-progress call-backs. */}
                <CountCell
                  value={row.open + row.inProgress}
                  className="tw:text-amber-600"
                  href={row.links?.open}
                />
              </AppTable.Cell>
              <AppTable.Cell>
                <CountCell value={row.overdue} className="tw:text-red-600" />
              </AppTable.Cell>
              <AppTable.Cell>
                {row.lastLoggedOn ? (
                  <div className="tw:flex tw:flex-col tw:gap-0.5 tw:min-w-0">
                    <DateFormat
                      value={row.lastLoggedOn}
                      formatStr="dd MMM yyyy"
                      className="tw:text-gray-900"
                    />
                    {row.lastFollowup?.franchiseName &&
                      (row.lastFollowup.franchiseId ? (
                        <AppLink
                          href={`/master/crm/retailer?id=${row.lastFollowup.franchiseId}`}
                          asLink
                          showLinkColor
                          className="tw:text-xs tw:line-clamp-1"
                        >
                          {row.lastFollowup.franchiseName}
                        </AppLink>
                      ) : (
                        <span className="tw:text-xs tw:text-gray-500 tw:line-clamp-1">
                          {row.lastFollowup.franchiseName}
                        </span>
                      ))}
                  </div>
                ) : (
                  <span className="tw:text-gray-400">-</span>
                )}
              </AppTable.Cell>

              <AppTable.Cell>
                {row.nextFollowup?.followUpDateTime ? (
                  <div className="tw:flex tw:flex-col tw:gap-0.5 tw:min-w-0">
                    <div className="tw:flex tw:items-center tw:gap-1.5">
                      <CalendarClock className="tw:h-3.5 tw:w-3.5 tw:shrink-0 tw:text-gray-400" />
                      <DateFormat
                        value={row.nextFollowup.followUpDateTime}
                        formatStr="dd MMM yyyy"
                        className="tw:text-gray-900"
                      />
                      <NextFollowUpChip
                        date={row.nextFollowup.followUpDateTime}
                      />
                    </div>
                    {row.nextFollowup.franchiseName &&
                      (row.nextFollowup.franchiseId ? (
                        <AppLink
                          href={`/master/crm/retailer?id=${row.nextFollowup.franchiseId}`}
                          asLink
                          showLinkColor
                          className="tw:text-xs tw:line-clamp-1 tw:pl-5"
                        >
                          {row.nextFollowup.franchiseName}
                        </AppLink>
                      ) : (
                        <span className="tw:text-xs tw:text-gray-500 tw:line-clamp-1 tw:pl-5">
                          {row.nextFollowup.franchiseName}
                        </span>
                      ))}
                  </div>
                ) : (
                  <span className="tw:text-gray-400">-</span>
                )}
              </AppTable.Cell>
            </AppTable.Row>
          ))
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
