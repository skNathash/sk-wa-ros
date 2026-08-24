import type React from "react";
import { MapPin, Phone, CalendarClock } from "lucide-react";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import NextFollowUpChip from "~/shared/crm/components/NextFollowUpChip";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import {
  AppTable,
  TableHeader,
  TableSkeletonLoader,
} from "~/components/core/table";
import type { TableHeaderItem } from "~/types/CommonTypes";
import type { RetailerSummaryRow } from "./helper";

interface DesktopViewProps {
  loading?: boolean;
  data: RetailerSummaryRow[];
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  hasMoreData: boolean;
}

const headers: TableHeaderItem[] = [
  { label: "S.No", key: "sno", enableSort: false, width: "44px" },
  { label: "Retailer", key: "franchiseName", width: "200px", enableSort: false },
  {
    label: "Retailer Location",
    key: "location",
    width: "170px",
    enableSort: false,
  },
  // {
  //   label: "Times Contacted",
  //   key: "timesContacted",
  //   width: "95px",
  //   enableSort: false,
  // },
  {
    label: "Follow-ups",
    key: "total",
    width: "90px",
    enableSort: false,
  },
  {
    label: "Pending Follow-ups",
    key: "awaiting",
    width: "110px",
    enableSort: false,
  },
  { label: "Overdue", key: "overdue", width: "75px", enableSort: false },
  {
    label: "Last Contact",
    key: "lastLoggedOn",
    width: "140px",
    enableSort: false,
  },
  {
    label: "Next Follow-up",
    key: "nextFollowUp",
    width: "230px",
    enableSort: false,
  },
];

const containerStyle = {
  maxHeight: "calc(100vh - 320px)",
};

// A single status count. When it has a target href and a non-zero value it
// becomes a link into the retailer follow-up page pre-filtered to that status.
const CountCell: React.FC<{
  value: number;
  className?: string;
  href?: string;
}> = ({ value, className, href }) => {
  const classes = `tw:font-semibold tw:tabular-nums ${
    className || "tw:text-gray-900"
  }`;
  if (href && (value ?? 0) > 0) {
    return (
      <AppLink href={href} asLink className={classes}>
        {(value ?? 0).toLocaleString()}
      </AppLink>
    );
  }
  return <span className={classes}>{(value ?? 0).toLocaleString()}</span>;
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
        title="No retailers found"
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
      minWidth="1160px"
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
            <AppTable.Row key={row.id || row.franchiseRefId || idx}>
              <AppTable.Cell>{idx + 1}</AppTable.Cell>

              <AppTable.Cell>
                <div className="tw:flex tw:flex-col tw:gap-0.5 tw:py-1">
                  {row.id ? (
                    <AppLink
                      href={`/master/crm/retailer?id=${row.id}`}
                      asLink
                      showLinkColor
                      className="tw:font-medium tw:line-clamp-2"
                    >
                      {row.franchiseName || "-"}
                    </AppLink>
                  ) : (
                    <span className="tw:font-medium tw:text-gray-900 tw:line-clamp-2">
                      {row.franchiseName || "-"}
                    </span>
                  )}
                  {row.franchiseRefId && (
                    <span className="tw:text-xs tw:text-gray-500">
                      ID: {row.franchiseRefId}
                    </span>
                  )}
                  {row.mobileNo && (
                    <span className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-500">
                      <Phone className="tw:w-3 tw:h-3 tw:text-gray-400 tw:shrink-0" />
                      {row.mobileNo}
                    </span>
                  )}
                </div>
              </AppTable.Cell>

              <AppTable.Cell>
                {row.town || row.district || row.state || row.pincode ? (
                  <span className="tw:flex tw:items-start tw:gap-1 tw:text-xs tw:text-gray-500">
                    <MapPin className="tw:w-3 tw:h-3 tw:mt-0.5 tw:text-gray-400 tw:shrink-0" />
                    <span className="tw:line-clamp-3">
                      {[row.town, row.district, row.state]
                        .filter(Boolean)
                        .join(", ")}
                      {row.pincode ? ` - ${row.pincode}` : ""}
                    </span>
                  </span>
                ) : (
                  <span className="tw:text-gray-400">-</span>
                )}
              </AppTable.Cell>

              {/* <AppTable.Cell>
                <span className="tw:font-semibold tw:tabular-nums tw:text-gray-900">
                  {(row.timesContacted ?? 0).toLocaleString()}{" "}
                  <span className="tw:font-normal tw:text-gray-500">
                    {(row.timesContacted ?? 0) === 1 ? "time" : "times"}
                  </span>
                </span>
              </AppTable.Cell> */}
              <AppTable.Cell>
                <CountCell value={row.total} href={row.links?.total} />
              </AppTable.Cell>
              <AppTable.Cell>
                {/* Pending = still-open + in-progress follow-ups. */}
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
                    {row.lastContactBy && (
                      <span className="tw:text-xs tw:text-gray-500 tw:line-clamp-1">
                        by {row.lastContactBy}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="tw:text-gray-400">-</span>
                )}
              </AppTable.Cell>

              <AppTable.Cell>
                {row.nextFollowup?.followUpDateTime ? (
                  <div className="tw:flex tw:flex-col tw:gap-0.5 tw:min-w-0">
                    <div className="tw:flex tw:items-center tw:gap-1.5 tw:whitespace-nowrap">
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
                    {row.nextFollowup.employeeName && (
                      <span className="tw:text-xs tw:text-gray-500 tw:line-clamp-1 tw:pl-5">
                        by {row.nextFollowup.employeeName}
                      </span>
                    )}
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
