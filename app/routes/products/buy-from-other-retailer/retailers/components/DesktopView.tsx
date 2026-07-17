import React from "react";
import { Phone, MapPin, Navigation } from "lucide-react";
import UserBadgeType from "~/shared/store/badge/UserBadgeType";
import AppTable from "~/components/core/table/AppTable";
import AppCard from "~/components/core/card/AppCard";
import TableHeader from "~/components/core/table/TableHeader";
import type { SortValue, TableHeaderItem } from "~/types/CommonTypes";
import AppButton from "~/components/core/button/AppButton";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import AppBadge from "~/components/core/badge/AppBadge";
import ImgRender from "~/components/core/img/ImgRender";
import { useTranslation } from "react-i18next";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppLink from "~/components/core/link/AppLink";
import DateFormat from "~/components/core/date/DateFormat";
import StoreLinkPopover from "./StoreLinkPopover";

interface DesktopViewProps {
  loading: boolean;
  data: any[];
  callback: (action: { action: string; data: any }) => void;
  sortKey?: string;
  onSort?: (data: { key: string; value: SortValue }) => void;
  sortValue?: SortValue;
  showLoadMore: boolean;
  loadedCount: number;
  loadingMore: boolean;
  loadMore: () => void;
  totalCount: number;
}

const tableHeaders: TableHeaderItem[] = [
  { label: "#", key: "sl", width: "4%" },
  { label: "Name", key: "name", width: "25%", langKey: "name" },
  { label: "Type", key: "type", width: "15%", langKey: "type" },
  { label: "Inventory", key: "inventory", width: "12%", langKey: "inventory" },
  { label: "Location", key: "location", width: "25%", langKey: "location" },
  { label: "Distance", key: "distance", width: "10%", langKey: "distance" },
  { label: "Actions", key: "action", width: "9%", langKey: "actions" },
];

const containerStyle = { maxHeight: "calc(100vh - 200px)" };

const DesktopView: React.FC<DesktopViewProps> = ({
  loading = false,
  data,
  callback,
  sortKey,
  onSort,
  sortValue,
  showLoadMore = false,
  loadedCount,
  loadingMore = false,
  loadMore,
  totalCount = 0,
}) => {
  const { t } = useTranslation();

  if (loading && (!data || data.length === 0)) {
    return (
      <div className="tw:w-full tw:text-center tw:py-6">
        <AppSpinner />
      </div>
    );
  }

  // Show no-data when not loading and no records
  if (!loading && (!data || data.length === 0)) {
    return <NoData />;
  }

  // Default table render when data is present
  return (
    <AppCard noPadding>
      <AppTable container stickyHeader containerStyle={containerStyle}>
        <AppTable.Header>
          <TableHeader
            headers={tableHeaders}
            sortKey={sortKey}
            onSort={onSort}
            sortValue={sortValue}
          />
        </AppTable.Header>
        <AppTable.Body>
          {data.map((item, idx) => (
            <AppTable.Row key={item._id || idx}>
              <AppTable.Cell>{idx + 1}</AppTable.Cell>

              <AppTable.Cell>
                <div className="tw:flex tw:items-center tw:gap-2">
                  <div
                    onClick={() =>
                      callback({ action: "viewImages", data: item })
                    }
                    className="tw:cursor-pointer"
                  >
                    <ImgRender
                      assetId={item.shopImg}
                      className="tw:w-10 tw:h-10 tw:rounded-full"
                    />
                  </div>
                  <div>
                    <div className="tw:font-medium tw:line-clamp-2">
                      <AppLink
                        href={`/products/buy-from-other-retailer/retailer/${item._id}`}
                        showLinkColor
                        asLink
                      >
                        {item.name}
                      </AppLink>
                    </div>
                    <div className="tw:mt-1 tw:flex tw:items-center tw:gap-2 tw:mb-1">
                      <div className="tw:text-xs tw:text-gray-500">
                        {t("id")}: {item.franchiseId || "-"}
                      </div>
                    </div>

                    {/* registered on */}
                    <div>
                      <div className="tw:text-xs tw:text-gray-500">
                        {t("registeredOn")}:{" "}
                        <DateFormat
                          value={item.createdAt}
                          formatStr="dd MMM yyyy"
                        />
                      </div>

                      <div className="tw:mt-1">
                        <StoreLinkPopover mobile={item.mobile} />
                      </div>
                    </div>
                  </div>
                </div>
              </AppTable.Cell>

              <AppTable.Cell>
                <UserBadgeType type={item.displayType?.name} />
              </AppTable.Cell>

              <AppTable.Cell>
                {item.analytics?.totalSubscribedInStockDeals ?? "0"}{" "}
                <span className="tw:text-xs tw:text-gray-500">
                  {t("products")}
                </span>{" "}
              </AppTable.Cell>

              <AppTable.Cell>
                <div className="tw:text-xs tw:line-clamp-2">
                  {item.addressLine1 || item.addressLine2
                    ? `${item.addressLine1 || ""}${
                        item.addressLine2 ? ", " + item.addressLine2 : ""
                      }`
                    : "-"}
                </div>
                <div className="tw:text-xs tw:text-gray-500">
                  {t("pincode")}: {item.pincode || "-"}
                </div>
              </AppTable.Cell>

              <AppTable.Cell>
                <div className="tw:flex tw:items-center tw:gap-1">
                  <Navigation size={14} className="tw:text-gray-500" />
                  <AppBadge variant="light">
                    {item.distanceToFranchiseKm || 0} km
                  </AppBadge>
                </div>
              </AppTable.Cell>

              <AppTable.Cell>
                <div className="tw:flex tw:gap-2">
                  <AppLink
                    href={`/products/buy-from-other-retailer/retailer/${item._id}`}
                    asLink
                  >
                    <AppButton size="small">{t("browse")}</AppButton>
                  </AppLink>
                </div>
              </AppTable.Cell>
            </AppTable.Row>
          ))}

          {showLoadMore && (
            <AppTable.Row>
              <AppTable.Cell colSpan={tableHeaders.length}>
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
    </AppCard>
  );
};

export default DesktopView;
