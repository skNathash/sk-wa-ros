import { Calendar, MapPin, Navigation } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import AppLink from "~/components/core/link/AppLink";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import { TableSkeletonLoader } from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import CommonService from "~/services/CommonService";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import type {
  PaginationState,
  TableHeaderItem,
  ViewToggleType,
} from "~/types/CommonTypes";
import {
  fromHeaderSort,
  toHeaderSort,
  type SortValue,
} from "~/components/feature/utility/sort/SortPopover";
import {
  DirectoryEmpty,
  InitialsAvatar,
} from "~/shared/network/components/directory-bits/DirectoryBits";

interface RequestData {
  _id: string;
  name?: string;
  mobile?: string;
  email?: string;
  initials?: string;
  distanceKm?: number;
  createdAt?: string | Date;
  formattedLocation?: string | null;
  _formattedAddress?: {
    part1?: string | null;
    part2?: string | null;
  };
  sfsellerInfo?: {
    name?: string;
    details?: {
      mobile?: string;
      distanceKm?: number;
    };
    email?: string;
  };
  _statusLbl?: string;
  _statusColor?: string;
  [key: string]: any;
}

interface DesktopViewProps {
  loading?: boolean;
  data: RequestData[];
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  hasMoreData: boolean;
  paginationConfig: PaginationState;
  view: ViewToggleType;
  onViewChange: (view: ViewToggleType) => void;
  sortValue?: SortValue;
  onSort?: (value: SortValue) => void;
}

/**
 * Column config. Sortable keys feed both the header arrows and the mobile
 * sort popover.
 */
export const headers: TableHeaderItem[] = [
  {
    label: "Retailer",
    key: "name",
    langKey: "name",
    enableSort: true,
    width: "26%",
  },
  {
    label: "Status",
    key: "status",
    langKey: "status",
    enableSort: true,
    width: "12%",
  },
  {
    label: "Requested On",
    key: "createdAt",
    langKey: "requestedOn",
    enableSort: true,
    width: "14%",
  },
  {
    label: "Location",
    key: "location",
    langKey: "location",
    enableSort: false,
    width: "24%",
  },
  {
    label: "Distance",
    key: "distance",
    langKey: "distance",
    enableSort: false,
    width: "12%",
  },
  {
    label: "Action",
    key: "action",
    langKey: "action",
    enableSort: false,
    width: "12%",
    isRightAligned: true,
  },
];

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

const DesktopView: React.FC<DesktopViewProps> = ({
  loading,
  data,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  hasMoreData,
  paginationConfig,
  view,
  onViewChange,
  sortValue,
  onSort,
}) => {
  const { t } = useTranslation(["common"]);

  return (
    <>
      {/* Toolbar — pagination summary on the left, view toggle on the right. */}
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:px-4 tw:py-3">
        <div>
          {loading ? (
            <span className="tw:inline-block tw:h-5 tw:w-32 tw:animate-pulse tw:rounded tw:bg-gray-200" />
          ) : (
            <PaginationSummary
              paginationConfig={paginationConfig}
              loadingTotalRecords={false}
              loadedCount={loadedCount}
              fwSize="sm"
            />
          )}
        </div>
        <div className="tw:flex tw:items-center tw:gap-2">
          <ViewToggle viewType={view} callback={onViewChange} />
        </div>
      </div>

      {!loading && data.length === 0 ? (
        <DirectoryEmpty
          title="No joining requests"
          description="Nothing matches this status or filter. Try another segment or clear your search."
        />
      ) : (
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
              {...toHeaderSort(sortValue)}
              onSort={(data) => onSort?.(fromHeaderSort(data))}
            />
          </AppTable.Header>
          <AppTable.Body>
            {loading ? (
              <TableSkeletonLoader cols={headers.length} rows={30} />
            ) : (
              data.map((row, idx) => {
                const name = row.name || row.sfsellerInfo?.name || "";
                const mobile =
                  row.mobile || row.sfsellerInfo?.details?.mobile || "";
                const distance =
                  row.distanceKm ?? row.sfsellerInfo?.details?.distanceKm;

                return (
                  <AppTable.Row key={row._id || idx}>
                    <AppTable.Cell>
                      <div className="tw:flex tw:items-center tw:gap-3">
                        <InitialsAvatar
                          name={name}
                          initials={row.initials}
                          size={38}
                        />
                        <div className="tw:min-w-0">
                          <AppLink
                            asLink
                            href={`/dashboard/network/view/view-join-request/${row._id}`}
                          >
                            <span className="tw:font-semibold">{name}</span>
                          </AppLink>
                          <div className="tw:mt-0.5 tw:truncate tw:text-xs tw:text-gray-500">
                            {[
                              mobile ? `+91 ${mobile}` : null,
                              row.email || null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </div>
                        </div>
                      </div>
                    </AppTable.Cell>

                    <AppTable.Cell>
                      <AppBadge variant={(row._statusColor as any) || "warning"}>
                        {row._statusLbl || t("pending")}
                      </AppBadge>
                    </AppTable.Cell>

                    <AppTable.Cell>
                      {row.createdAt ? (
                        <div className="tw:flex tw:items-start tw:gap-2">
                          <Calendar
                            size={14}
                            className="tw:mt-0.5 tw:shrink-0 tw:text-gray-400"
                          />
                          <div>
                            <DateFormat
                              value={row.createdAt}
                              formatStr="dd MMM yyyy"
                              className="tw:text-sm tw:text-gray-700"
                            />
                            <div className="tw:mt-0.5 tw:text-xs tw:text-gray-400">
                              <DateFormat
                                value={row.createdAt}
                                formatStr="hh:mm a"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="tw:text-sm tw:text-gray-500">
                          {t("nA")}
                        </span>
                      )}
                    </AppTable.Cell>

                    <AppTable.Cell>
                      <div className="tw:flex tw:items-start tw:gap-2">
                        <MapPin
                          size={14}
                          className="tw:mt-0.5 tw:shrink-0 tw:text-gray-400"
                        />
                        <div className="tw:min-w-0 tw:flex-1">
                          {row._formattedAddress?.part1 ? (
                            <div className="tw:truncate tw:text-sm tw:font-medium tw:text-gray-900">
                              {row._formattedAddress.part1}
                            </div>
                          ) : null}
                          {row._formattedAddress?.part2 ||
                          row.formattedLocation ? (
                            <div className="tw:mt-0.5 tw:truncate tw:text-xs tw:text-gray-500">
                              {row._formattedAddress?.part2 ||
                                row.formattedLocation}
                            </div>
                          ) : (
                            <span className="tw:text-sm tw:text-gray-400">
                              {t("nA")}
                            </span>
                          )}
                        </div>
                      </div>
                    </AppTable.Cell>

                    <AppTable.Cell>
                      <div className="tw:flex tw:items-center tw:gap-1.5">
                        <Navigation size={14} className="tw:text-gray-400" />
                        <span className="tw:text-sm tw:font-semibold tw:text-sky-600">
                          {distance != null
                            ? `${CommonService.roundedByDecimalPlace(distance, 2)} km`
                            : t("nA")}
                        </span>
                      </div>
                    </AppTable.Cell>

                    <AppTable.Cell>
                      <div className="tw:flex tw:items-center tw:justify-end">
                        <AppLink
                          asLink
                          href={`/dashboard/network/view/view-join-request/${row._id}`}
                          noUnderline
                        >
                          <span className="tw:inline-flex tw:items-center tw:rounded-md tw:border tw:border-gray-300 tw:px-3 tw:py-1.5 tw:text-xs tw:font-semibold tw:text-gray-700 hover:tw:bg-gray-50">
                            Open
                          </span>
                        </AppLink>
                      </div>
                    </AppTable.Cell>
                  </AppTable.Row>
                );
              })
            )}
            {hasMoreData && !loading && data.length > 0 && (
              <AppTable.Row>
                <AppTable.Cell
                  colSpan={headers.length}
                  className="tw:text-center"
                >
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
      )}
    </>
  );
};

export default DesktopView;
