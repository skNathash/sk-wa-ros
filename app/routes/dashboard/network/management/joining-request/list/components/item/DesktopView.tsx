import { Phone, Calendar, Eye, MapPin, Navigation } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import AppLink from "~/components/core/link/AppLink";
import AppButton from "~/components/core/button/AppButton";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import { TableSkeletonLoader } from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import type { SortProps } from "~/types/CommonTypes";
import NoData from "~/components/core/no-data/NoData";
import CommonService from "~/services/CommonService";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";

interface SaleData {
  _id: string;
  customerInfo: {
    name: string;
    contact?: string;
    [key: string]: any;
  };
  tier?: string;
  orders?: number;
  totalSpent?: number;
  avgOrder?: number;
  lastPurchase?: string | Date;
  profileImage?: string;
  [key: string]: any;
}

interface DesktopViewProps {
  loading?: boolean;
  data: SaleData[];
  sortKey?: string;
  sortValue?: "asc" | "desc";
  onSort?: (data: SortProps) => void;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  hasMoreData: boolean;
}

const headers = [
  {
    label: "Name",
    key: "name",
    langKey: "name",
    enableSort: true,
    width: "20%",
  },
  {
    label: "Status",
    key: "status",
    langKey: "status",
    enableSort: true,
    width: "15%",
  },
  {
    label: "Requested On",
    key: "requestedOn",
    langKey: "requestedOn",
    enableSort: true,
    width: "15%",
  },
  {
    label: "Location",
    key: "location",
    langKey: "location",
    enableSort: false,
    width: "25%",
  },
  {
    label: "Distance",
    key: "distance",
    langKey: "distance",
    enableSort: false,
    width: "15%",
  },
  {
    label: "Action",
    key: "action",
    langKey: "action",
    enableSort: false,
    width: "10%",
  },
];

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
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
}) => {
  const { t } = useTranslation(["common"]);
  return (
    <AppTable
      size="sm"
      stickyHeader
      fixedLayout
      container
      minWidth="1000px"
      containerStyle={containerStyle}
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
          <TableSkeletonLoader cols={headers.length} rows={30} />
        ) : data && data.length > 0 ? (
          data.map((row, idx) => (
            <AppTable.Row key={row._id || idx}>
              <AppTable.Cell>
                {/* Name */}
                <div className="tw:font-semibold tw:text-gray-900 tw:text-base">
                  {row.sfsellerInfo?.name}
                </div>
                {row.email && (
                  <div className="tw:text-xs tw:text-gray-500 tw:mt-1 tw:truncate">
                    {row.email}
                  </div>
                )}
                {/* Mobile */}
                <div className="tw:flex tw:items-center tw:gap-1 tw:mt-2">
                  <Phone size={12} className="tw:text-gray-500" />
                  <span className="tw:text-sm tw:text-gray-600 tw:font-medium">
                    {row.sfsellerInfo?.details?.mobile || "-"}
                  </span>
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                {/* Status */}
                <AppBadge variant={row._statusColor || "warning"}>
                  {row._statusLbl || t("pending")}
                </AppBadge>
              </AppTable.Cell>
              <AppTable.Cell>
                {/* Requested On */}
                <div className="tw:flex tw:items-start tw:gap-2">
                  <Calendar
                    size={14}
                    className="tw:text-gray-500 tw:mt-0.5 tw:flex-shrink-0"
                  />
                  <div>
                    <div className="tw:font-semibold tw:text-gray-900">
                      <DateFormat
                        value={row.createdAt || null}
                        formatStr="dd MMM yyyy"
                      />
                    </div>
                    <div className="tw:text-xs tw:text-gray-500 tw:mt-0.5">
                      <DateFormat
                        value={row.createdAt || null}
                        formatStr="hh:mm a"
                      />
                    </div>
                  </div>
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                {/* Location */}
                <div className="tw:flex tw:items-start tw:gap-2">
                  <MapPin
                    size={14}
                    className="tw:text-gray-500 tw:mt-0.5 tw:flex-shrink-0"
                  />
                  <div className="tw:min-w-0 tw:flex-1">
                    {/* Address Part 1 - Address Lines */}
                    {row._formattedAddress?.part1 && (
                      <div className="tw:text-sm tw:font-medium tw:text-gray-900 tw:leading-tight">
                        {row._formattedAddress.part1}
                      </div>
                    )}

                    {/* Address Part 2 - Location Details */}
                    {row._formattedAddress?.part2 && (
                      <div className="tw:text-xs tw:text-gray-600 tw:mt-1 tw:leading-tight">
                        {row._formattedAddress.part2}
                      </div>
                    )}
                  </div>
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                {/* Distance */}
                <div className="tw:flex tw:items-center tw:gap-2">
                  <Navigation size={14} className="tw:text-gray-500" />
                  <span className="tw:font-semibold tw:text-blue-600">
                    {CommonService.roundedByDecimalPlace(
                      row.sfsellerInfo?.details?.distanceKm,
                      2
                    )}{" "}
                    km
                  </span>
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                {/* Action */}
                <AppLink
                  asLink
                  href={`/dashboard/network/view/view-join-request/${row._id}`}
                  noUnderline
                >
                  <AppButton
                    size="small"
                    color="light"
                    fill="outline"
                    className="tw:flex tw:items-center tw:gap-1"
                  >
                    <Eye size={14} />
                    {t("view")}
                  </AppButton>
                </AppLink>
              </AppTable.Cell>
            </AppTable.Row>
          ))
        ) : (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length} className="tw:text-center">
              <NoData />
            </AppTable.Cell>
          </AppTable.Row>
        )}
        {hasMoreData && !loading && data.length > 0 && (
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
