import {
  MessageCircle,
  Phone,
  Calendar,
  Route,
  MapPin,
  User,
  Briefcase,
} from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import AppLink from "~/components/core/link/AppLink";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import NoData from "~/components/core/no-data/NoData";
import { TableSkeletonLoader } from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import type { SortProps } from "~/types/CommonTypes";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import AppButton from "~/components/core/button/AppButton";
import { Eye } from "lucide-react";
import ImgRender from "~/components/core/img/ImgRender";
import UserBadgeForItem from "~/shared/store/badge/UserBadgeForItem";
import RoutePopover from "~/shared/logistics/components/RoutePopover";

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
  onAction?: (arg: { action: string; data?: any }) => void;
}

const headers = [
  {
    label: "Business Name",
    key: "name",
    enableSort: false,
    width: "24%",
    langKey: "businessName",
  },
  {
    label: "Delivery Route",
    key: "routes",
    enableSort: false,
    width: "16%",
    langKey: "deliveryRoute",
  },
  {
    label: "Details",
    key: "details",
    enableSort: false,
    width: "20%",
  },
  {
    label: "Status / Last Login",
    key: "status",
    enableSort: false,
    width: "18%",
    langKey: "status",
  },
  {
    label: "Actions",
    key: "actions",
    enableSort: false,
    width: "18%",
    langKey: "actions",
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
  onAction,
}) => {
  const { t } = useTranslation(["common"]);

  if (!loading && data.length === 0) {
    return <NoData />;
  }

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
                {/* Business Name + Contact */}
                <AppLink
                  asLink
                  href={`/dashboard/network/view/b2b/${row._id}`}
                  className="tw:font-medium tw:inline-block"
                >
                  {row.name || "-"}
                </AppLink>
                <div className="tw:mt-1">
                  <UserBadgeForItem
                    networkType={row.networkType}
                    subType={row.subType}
                  />
                </div>
                <div className="tw:text-xs tw:text-gray-500 tw:mt-0.5">
                  <span className="tw:flex tw:items-center tw:gap-1">
                    <Phone size={10} />
                    {row.mobile || "-"}
                  </span>
                </div>
                {row.email && (
                  <div className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-500 tw:mt-0.5">
                    <MessageCircle size={10} />
                    {row.email}
                  </div>
                )}
                {row.primaryBusiness && (
                  <div className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-500 tw:mt-1">
                    <Briefcase size={10} />
                    <span className="tw:font-medium">Primary:</span>{" "}
                    {row.primaryBusiness}
                  </div>
                )}
                {row.secondaryBusiness && (
                  <div className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-500 tw:mt-0.5">
                    <Briefcase size={10} />
                    <span className="tw:font-medium">Secondary:</span>{" "}
                    {row.secondaryBusiness}
                  </div>
                )}
              </AppTable.Cell>
              <AppTable.Cell>
                {/* Delivery Route */}
                {row.routes && row.routes.length > 0 ? (
                  <div className="tw:flex tw:flex-wrap tw:gap-1">
                    {row.routes.map((route: any, idx: number) => (
                      <div
                        key={idx}
                        title={route.description || route.name || "-"}
                        className="tw:flex tw:items-center tw:gap-1"
                      >
                        <AppBadge
                          variant="secondary"
                          className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:px-2 tw:py-1"
                        >
                          <Route size={14} />
                          <span className="tw:font-medium">
                            {route.description || route.name || "-"}
                          </span>
                        </AppBadge>
                        <div className="tw:ml-1">
                          <RoutePopover route={route} isActive={false} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="tw:text-xs tw:text-gray-300 tw:italic">
                    No route configured
                  </span>
                )}
              </AppTable.Cell>

              <AppTable.Cell>
                {/* Details */}
                <div>
                  {row.createdAt && (
                    <div className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-500">
                      <Calendar size={10} />
                      <span className="tw:font-medium">Registered:</span>
                      <DateFormat
                        value={row.createdAt || null}
                        formatStr="dd MMM yyyy"
                      />
                    </div>
                  )}
                  {row.ownerDetails?.name && (
                    <div className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-500 tw:mt-1">
                      <User size={10} />
                      <span className="tw:font-medium">Contact:</span>
                      {row.ownerDetails.name}
                    </div>
                  )}
                  <div className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-500 tw:mt-1">
                    <MapPin size={10} />
                    {row.address && row.address !== ""
                      ? row.address
                      : `${row.city || row.town || "-"}, ${row.district || "-"}, ${row.state || "-"}${row.pincode ? ` - ${row.pincode}` : ""}`}
                  </div>
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                {/* Status & Last Login */}
                <AppBadge variant="outline">
                  {row.kycStatus?.overallStatus || "-"}
                </AppBadge>
                <div className="tw:text-xs tw:text-gray-500 tw:mt-2">
                  <DateFormat
                    value={row.lastLogin || null}
                    formatStr="dd MMM yyyy"
                  />{" "}
                  <DateFormat
                    value={row.lastLogin || null}
                    formatStr="hh:mm a"
                  />
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                {/* Actions */}
                <div className="tw:flex tw:items-center tw:gap-2">
                  <AppLink
                    title={t("viewDetails")}
                    asLink
                    href={`/dashboard/network/view/b2b/${row._id}`}
                  >
                    <Eye size={16} />
                  </AppLink>
                  <AppButton
                    title="Promote"
                    fill="outline"
                    size="small"
                    className="tw:flex tw:items-center tw:gap-1 tw:border-green-500 tw:text-green-600 hover:tw:bg-green-50 hover:tw:text-green-600 tw:px-2 tw:py-1"
                    onClick={() =>
                      onAction?.({ action: "openWhatsapp", data: row })
                    }
                  >
                    <ImgRender
                      src="whatsapp-logo.png"
                      className="tw:w-4 tw:h-4"
                      alt="WhatsApp"
                    />
                    <span className="tw:text-xs tw:font-medium tw:whitespace-nowrap">
                      Promote via WhatsApp
                    </span>
                  </AppButton>
                </div>
              </AppTable.Cell>
            </AppTable.Row>
          ))
        ) : (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length} className="tw:text-center">
              No data found
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
