import { PhoneIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import AppBadge from "~/components/core/badge/AppBadge";
import UserPic from "~/shared/users/components/UserPic";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import AppPopover from "~/components/core/popover/AppPopover";
import { TableSkeletonLoader } from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import { Checkbox } from "~/components/ui/checkbox";
import type { SortProps, TableHeaderItem } from "~/types/CommonTypes";
import FeaturePermissionsPopover from "./FeaturePermissionsPopover";
import { useTranslation } from "react-i18next";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import Rbac from "~/components/core/rbac/Rbac";

interface SaleData {
  _id: string;
  customerInfo: {
    name: string;
    [key: string]: any;
  };
  _payableAmount: number;
  payment: string;
  createdAt: string | Date;
  [key: string]: any;
}

interface DesktopViewProps {
  loading?: boolean;
  data: SaleData[];
  features: any[];
  callback: (a: { action: string; data: any }) => void;
  onSort: (a: SortProps) => void;
  sortKey: string;
  sortValue: "asc" | "desc" | undefined;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  hasMoreData: boolean;
}

const rbacRoles = {
  toggleAllPermissions: ["USER-MANAGEMENT.UPDATE-PERMISSIONS"],
};

const defaultHeaders: TableHeaderItem[] = [
  {
    label: "Name",
    key: "name",
    width: "180px",
    isSticky: true,
    enableSort: true,
    langKey: "name",
  },
  {
    label: "Position",
    key: "position",
    width: "120px",
    langKey: "position",
  },
];

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

const DesktopView: React.FC<DesktopViewProps> = ({
  loading,
  data,
  features,
  callback,
  onSort,
  sortKey,
  sortValue,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  hasMoreData,
}) => {
  const { t } = useTranslation();
  const [headers, setHeaders] = useState<any[]>([...defaultHeaders]);
  const [minWidth, setMinWidth] = useState<string>("1800px");

  useEffect(() => {
    const headersData = [...defaultHeaders, ...features];
    setHeaders([...headersData]);
    const width = headersData.reduce(
      (acc, curr) => acc + Number(curr.width.replace("px", "")),
      0,
    );
    setMinWidth(`${width + 500}px`);
  }, [features]);

  // Show no data message when there's no data and not loading
  if (!loading && (!data || data.length === 0)) {
    return <NoData />;
  }

  const onEnableAllChange = (
    checked: boolean,
    rowIndex: number,
    featureId: string | number,
    featureIndex: number,
    rowId: string,
  ) => {
    callback({
      action: "toggleAllPermissions",
      data: {
        index: rowIndex,
        featureId,
        featureIndex,
        checked,
        _id: rowId,
      },
    });
  };

  // Show table (with loading skeleton or data)
  return (
    <AppTable
      size="sm"
      stickyHeader
      fixedLayout
      container
      minWidth={minWidth}
      containerStyle={containerStyle}
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
          <TableSkeletonLoader cols={headers.length} rows={30} />
        ) : (
          data.map((row, idx) => (
            <AppTable.Row key={row._id || idx}>
              <AppTable.Cell className="tw:sticky tw:left-0 tw:bg-white">
                <div className="tw:flex tw:gap-4 tw:items-center">
                  <div>
                    <UserPic
                      assetId={row.profileImages?.[0]}
                      gender={row.gender}
                      type={row._userPicType}
                      className="tw:w-12 tw:h-12 tw:rounded-full tw:border tw:border-gray-200"
                    />
                  </div>
                  <div>
                    <div className="tw:font-medium tw:mb-0.5 tw:mt-1">
                      <AppLink
                        asLink
                        href={`/dashboard/employee/view/${row._id}`}
                        className="tw:text-sm"
                      >
                        {row.name}
                      </AppLink>
                    </div>
                    <div className="tw:flex tw:gap-1 tw:text-gray-500 tw:items-center tw:mb-1 tw:text-xs">
                      <PhoneIcon size={10} />
                      {row.mobile}
                    </div>
                    <div className="tw:mb-2 tw:flex tw:gap-1">
                      <AppBadge variant={row.isActive ? "success" : "danger"}>
                        {row.isActive ? t("active") : t("inactive")}
                      </AppBadge>

                      {/* <AppBadge variant="light">{row.role || "--"}</AppBadge> */}
                    </div>
                  </div>
                </div>
              </AppTable.Cell>

              <AppTable.Cell>
                <AppBadge variant={row._positionBadgeColor}>
                  {row._position}
                </AppBadge>
              </AppTable.Cell>

              {row._features.map((feature: any, fIdx: number) => {
                const permissions = feature.permissions || [];
                const totalPermissions = permissions.length || 0;

                return (
                  <AppTable.Cell key={feature.key}>
                    <div className="tw:flex tw:items-center tw:gap-1 tw:mb-2">
                      <Rbac roles={["admin"]}>
                        <Checkbox
                          checked={!!feature.selected}
                          onCheckedChange={(checked: boolean) =>
                            onEnableAllChange(
                              checked,
                              idx,
                              feature.id,
                              fIdx,
                              row._id,
                            )
                          }
                          className="tw:border-2 tw:border-gray-300"
                        />
                        <span className="tw:text-xs tw:text-gray-500">
                          {t("enableAll")}
                        </span>
                      </Rbac>
                    </div>

                    <div className="tw:flex tw:items-center tw:gap-2">
                      <AppPopover
                        modal={true}
                        triggerContent={
                          <span className="tw:text-xs tw:text-gray-600 tw:underline tw:cursor-pointer">
                            {permissions.filter((p: any) => p.selected).length}/
                            {totalPermissions} {t("permission")}
                            {totalPermissions !== 1 ? t("s") : ""}
                          </span>
                        }
                        side="top"
                        align="start"
                      >
                        <FeaturePermissionsPopover
                          permissions={permissions}
                          rowIndex={idx}
                          feature={feature}
                          featureIndex={fIdx}
                          rowId={row._id}
                          callback={callback}
                        />
                      </AppPopover>
                    </div>
                  </AppTable.Cell>
                );
              })}
            </AppTable.Row>
          ))
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
