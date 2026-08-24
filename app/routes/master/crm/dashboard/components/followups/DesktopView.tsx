import { AlertCircle, MapPin, Phone } from "lucide-react";
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
import type {
  SortValue,
  TableHeaderItem,
  VariantColor,
} from "~/types/CommonTypes";

export interface LeadFollowupRow {
  _id?: string;
  referenceId?: string;
  franchiseId?: string;
  franchiseName?: string;
  franchiseRefId?: string;
  state?: string;
  district?: string;
  town?: string;
  mobileNo?: string;
  type?: string;
  status?: string;
  pincode?: string | number;
  remarks?: string;
  employee?: { id?: string; refId?: string; name?: string };
  assignedTo?: { employeeId?: string; name?: string };
  followUpDateTime?: string;
  createdAt?: string;
  modifiedAt?: string;
  modifiedBy?: { id?: string; name?: string; refId?: string };
  remarksLog?: any[];
  _statusLabel?: string;
  _statusColor?: string;
  _typeLabel?: string;
  _typeColor?: string;
  _isFolloupDue?: boolean;
  _overdueLabel?: string;
}

interface DesktopViewProps {
  loading?: boolean;
  data: LeadFollowupRow[];
  sortKey: string;
  sortValue: SortValue;
  onSort: (data: { key: string; value: SortValue }) => void;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  hasMoreData: boolean;
  onView: (row: LeadFollowupRow) => void;
}

const headers: TableHeaderItem[] = [
  { label: "S.No", key: "sno", enableSort: false, width: "50px" },
  { label: "Retailer", key: "franchiseName", width: "170px", enableSort: false },
  {
    label: "Retailer Location",
    key: "location",
    width: "190px",
    enableSort: false,
  },
  {
    label: "Follow-up On",
    key: "followUpDateTime",
    width: "185px",
    enableSort: true,
  },
  { label: "Status", key: "status", width: "110px", enableSort: false },
  { label: "Created On", key: "createdAt", width: "175px", enableSort: true },
  {
    label: "Last Updated",
    key: "modifiedAt",
    width: "185px",
    enableSort: true,
  },
  { label: "Reference", key: "referenceId", width: "90px", enableSort: false },
  { label: "Action", key: "action", width: "90px", enableSort: false },
];

const containerStyle = {
  maxHeight: "calc(100vh - 320px)",
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
}) => {
  if (!loading && data.length === 0) {
    return (
      <NoData
        title="No follow-ups found"
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
      minWidth="1260px"
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
            return (
              <AppTable.Row
                key={row._id || row.referenceId || idx}
                className={row._isFolloupDue ? "tw:bg-red-50" : undefined}
              >
                <AppTable.Cell>{idx + 1}</AppTable.Cell>

                <AppTable.Cell>
                  <div className="tw:flex tw:flex-col tw:gap-0.5 tw:py-1">
                    {row.franchiseId ? (
                      <AppLink
                        href={`/master/crm/retailer?id=${row.franchiseId}`}
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
                        ID {row.franchiseRefId}
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
                    <span className="tw:flex tw:items-start tw:gap-1 tw:text-gray-900">
                      <MapPin className="tw:w-3 tw:h-3 tw:mt-0.5 tw:text-gray-400 tw:shrink-0" />
                      <span className="tw:line-clamp-2">
                        {[row.town, row.district, row.state]
                          .filter(Boolean)
                          .join(", ")}
                        {row.pincode ? ` - ${row.pincode}` : ""}
                      </span>
                    </span>
                  ) : (
                    "-"
                  )}
                </AppTable.Cell>

                <AppTable.Cell>
                  {row.followUpDateTime ? (
                    <div className="tw:flex tw:flex-col tw:items-start tw:gap-1 tw:py-1">
                      <DateTimeCell
                        value={row.followUpDateTime}
                        showClockIcon
                        dateClassName={
                          row._isFolloupDue
                            ? "tw:font-semibold tw:text-red-700"
                            : "tw:font-medium tw:text-gray-900"
                        }
                      />
                      {row._isFolloupDue && (
                        <span className="tw:inline-flex tw:items-center tw:gap-1 tw:rounded tw:border tw:border-red-200 tw:bg-red-50 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-medium tw:text-red-700">
                          <AlertCircle className="tw:w-2.5 tw:h-2.5 tw:shrink-0" />
                          Due {row._overdueLabel}
                        </span>
                      )}
                    </div>
                  ) : (
                    "-"
                  )}
                </AppTable.Cell>

                <AppTable.Cell>
                  {row.status ? (
                    <AppBadge
                      variant={
                        (row._statusColor as VariantColor) || "default"
                      }
                    >
                      {row._statusLabel || row.status}
                    </AppBadge>
                  ) : (
                    "-"
                  )}
                </AppTable.Cell>

                <AppTable.Cell>
                  <div className="tw:flex tw:flex-col tw:gap-0.5 tw:py-1">
                    <DateTimeCell value={row.createdAt} />
                    {(row.employee?.name || row.assignedTo?.name) &&
                      (row.employee?.refId ? (
                        <AppLink
                          href={`/master/crm/employee?id=${row.employee.refId}`}
                          asLink
                          showLinkColor
                          className="tw:text-xs"
                        >
                          by {row.employee.name || row.assignedTo?.name}
                        </AppLink>
                      ) : (
                        <span className="tw:text-xs tw:text-gray-500">
                          by {row.employee?.name || row.assignedTo?.name}
                        </span>
                      ))}
                  </div>
                </AppTable.Cell>

                <AppTable.Cell>
                  {row.modifiedAt ? (
                    <div className="tw:flex tw:flex-col tw:gap-0.5 tw:py-1">
                      <DateTimeCell value={row.modifiedAt} />
                      {row.modifiedBy?.name &&
                        (row.modifiedBy?.refId ? (
                          <AppLink
                            href={`/master/crm/employee?id=${row.modifiedBy.refId}`}
                            asLink
                            showLinkColor
                            className="tw:text-xs"
                          >
                            by {row.modifiedBy.name}
                          </AppLink>
                        ) : (
                          <span className="tw:text-xs tw:text-gray-500">
                            by {row.modifiedBy.name}
                          </span>
                        ))}
                    </div>
                  ) : (
                    "-"
                  )}
                </AppTable.Cell>

                <AppTable.Cell>
                  <span className="tw:font-medium tw:text-gray-900">
                    {row.referenceId ? `ID ${row.referenceId}` : "-"}
                  </span>
                </AppTable.Cell>

                <AppTable.Cell>
                  <AppButton
                    size="small"
                    fill="outline"
                    color="primary"
                    onClick={() => onView(row)}
                  >
                    View
                  </AppButton>
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
