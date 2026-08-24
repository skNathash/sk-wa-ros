import {
  Edit2,
  FileText,
  MapPin,
  Calendar,
  Users,
  UserCheck,
  Check,
  X,
} from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import LocationsListPopover from "./LocationsListPopover";
import type { FC } from "react";
import NoData from "~/components/core/no-data/NoData";
import Rbac from "~/components/core/rbac/Rbac";

interface Props {
  loading: boolean;
  routes: any[];
  onEdit: (r: any) => void;
  onDelete: (r: any) => void;
  showLoadMore: boolean;
  loadingMore: boolean;
  loadMore: () => void;
  totalCount: number;
  loadedCount: number;
  callback: (a: { action: string; data?: any; index?: number }) => void;
}

const rbacRoles = {
  addUser: ["DELIVERY-ROUTE.DELIVERY-ROUTE-ADD-USER"],
  editRoute: ["DELIVERY-ROUTE.DELIVERY-ROUTE-EDIT"],
};

const MobileView: FC<Props> = ({
  loading,
  routes,
  onEdit,
  onDelete,
  showLoadMore,
  loadingMore,
  loadMore,
  totalCount = 0,
  loadedCount = 0,
  callback,
}) => {
  if (loading) {
    return (
      <div className="tw:py-8 tw:text-center tw:text-gray-500">Loading...</div>
    );
  }

  if (!loading && routes.length === 0) {
    return <NoData />;
  }

  return (
    <div className="tw:space-y-3">
      <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:lg:grid-cols-3 tw:gap-2.5">
        {routes.map((route) => (
          <AppCard
            key={route._id ?? route.id}
            className={`tw:mb-0 tw:h-full tw:overflow-hidden tw:shadow-sm tw:border-gray-200 tw:border-l-[3px] ${
              route.isActive ? "tw:border-l-green-500" : "tw:border-l-red-400"
            }`}
            noPadding
          >
            <div className="tw:flex tw:flex-col tw:h-full">
              {/* Card Header */}
              <div className="tw:px-3 tw:py-2 tw:border-b tw:border-gray-100">
                <div className="tw:flex tw:justify-between tw:items-center tw:gap-2">
                  <div className="tw:min-w-0 tw:flex-1">
                    <h3 className="tw:font-semibold tw:text-sm tw:text-gray-900 tw:truncate tw:leading-tight">
                      {route.description || route.routeCode}
                    </h3>
                    <span className="tw:text-[11px] tw:text-gray-500 tw:truncate tw:block">
                      ID: {route.routeId || route._id || route.id || "N/A"}
                    </span>
                  </div>
                  <AppBadge
                    variant={route.isActive ? "success" : "danger"}
                    size="sm"
                  >
                    {route.isActive ? "Enabled" : "Disabled"}
                  </AppBadge>
                </div>
              </div>

              {/* Card Body */}
              <div className="tw:px-3 tw:py-2 tw:flex-1 tw:space-y-1.5">
                {/* Areas */}
                <div className="tw:flex tw:items-start tw:gap-2">
                  <MapPin
                    size={13}
                    className="tw:shrink-0 tw:mt-1 tw:text-gray-400"
                  />
                  {route.areas && route.areas.length > 0 ? (
                    <div className="tw:min-w-0 tw:flex tw:items-center tw:gap-1.5 tw:flex-wrap">
                      <LocationsListPopover areas={route.areas} />
                      <span className="tw:text-[11px] tw:text-gray-400">
                        ({route.areas.length})
                      </span>
                    </div>
                  ) : (
                    <span className="tw:text-[11px] tw:text-gray-400 tw:italic tw:mt-0.5">
                      No areas assigned
                    </span>
                  )}
                </div>

                {/* Delivery Days */}
                <div className="tw:flex tw:items-start tw:gap-2">
                  <Calendar
                    size={13}
                    className="tw:shrink-0 tw:mt-1 tw:text-gray-400"
                  />
                  {route.deliveryDays && route.deliveryDays.length > 0 ? (
                    <div className="tw:flex tw:flex-wrap tw:gap-1">
                      {route.deliveryDays.map((day: string, idx: number) => (
                        <span
                          key={idx}
                          className="tw:inline-flex tw:px-1.5 tw:rounded tw:bg-gray-100 tw:text-gray-700 tw:text-[11px] tw:font-semibold tw:leading-5"
                        >
                          {day.substring(0, 3)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="tw:text-[11px] tw:text-gray-400 tw:italic tw:mt-0.5">
                      Schedule not set
                    </span>
                  )}
                </div>

                {/* Linked counts */}
                <div className="tw:rounded-md tw:border tw:border-gray-100 tw:divide-y tw:divide-gray-100 tw:bg-gray-50/60">
                  {[
                    {
                      icon: Users,
                      label: "B2B Customers",
                      count: route.usersLinked?.length ?? 0,
                      countClass: "tw:text-blue-600",
                      addAction: "addUser",
                      viewAction: "viewAssignedUsers",
                    },
                    {
                      icon: UserCheck,
                      label: "Digital Raja/Rani",
                      count: route.manpowerLinked?.length ?? 0,
                      countClass: "tw:text-purple-600",
                      addAction: "addEmployee",
                      viewAction: "viewAssignedEmployees",
                    },
                  ].map((row) => {
                    const Icon = row.icon;
                    return (
                      <div
                        key={row.label}
                        className="tw:flex tw:items-center tw:gap-2 tw:px-2 tw:py-1.5"
                      >
                        <Icon size={13} className="tw:shrink-0 tw:text-gray-400" />
                        <span className="tw:text-[11px] tw:text-gray-600 tw:truncate">
                          {row.label}
                        </span>
                        <span
                          className={`tw:text-sm tw:font-bold tw:ml-auto ${row.countClass}`}
                        >
                          {row.count}
                        </span>
                        <Rbac roles={rbacRoles.addUser}>
                          <div className="tw:flex tw:items-center tw:gap-1 tw:pl-1">
                            <AppButton
                              size="small"
                              fill="outline"
                              onClick={() =>
                                callback({ action: row.addAction, data: route })
                              }
                              className="tw:h-6 tw:px-1.5 tw:text-[11px] tw:font-semibold"
                            >
                              Add
                            </AppButton>
                            <AppButton
                              size="small"
                              fill="outline"
                              onClick={() =>
                                callback({ action: row.viewAction, data: route })
                              }
                              className="tw:h-6 tw:px-1.5 tw:text-[11px] tw:font-semibold tw:bg-white"
                            >
                              View
                            </AppButton>
                          </div>
                        </Rbac>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="tw:px-2 tw:py-1.5 tw:bg-gray-50 tw:border-t tw:border-gray-100 tw:flex tw:gap-1.5">
                <Rbac roles={rbacRoles.editRoute}>
                  <AppButton
                    size="small"
                    fill="outline"
                    color="light"
                    onClick={() => onEdit(route)}
                    className="tw:flex-1 tw:h-7 tw:px-1.5 tw:text-[11px]"
                  >
                    <Edit2 size={13} className="tw:mr-1" />
                    Edit
                  </AppButton>
                </Rbac>

                <Rbac roles={rbacRoles.editRoute}>
                  <AppButton
                    size="small"
                    fill="outline"
                    color="light"
                    onClick={() => callback({ action: "viewLog", data: route })}
                    className="tw:flex-1 tw:h-7 tw:px-1.5 tw:text-[11px]"
                    title="View Log"
                  >
                    <FileText size={13} className="tw:mr-1" />
                    Log
                  </AppButton>
                </Rbac>

                <Rbac roles={rbacRoles.editRoute}>
                  <AppButton
                    size="small"
                    fill="outline"
                    color={route.isActive ? "danger" : "success"}
                    onClick={() =>
                      callback({
                        action: route.isActive
                          ? "markAsInactive"
                          : "markAsActive",
                        data: route,
                      })
                    }
                    className="tw:flex-1 tw:h-7 tw:px-1.5 tw:text-[11px]"
                    title={route.isActive ? "Disable" : "Enable"}
                  >
                    {route.isActive ? (
                      <X size={13} className="tw:mr-1" />
                    ) : (
                      <Check size={13} className="tw:mr-1" />
                    )}
                    {route.isActive ? "Disable" : "Enable"}
                  </AppButton>
                </Rbac>
              </div>
            </div>
          </AppCard>
        ))}
      </div>

      {showLoadMore && !loading && routes.length > 0 ? (
        <div className="tw:text-center">
          <LoadMoreButton
            loadMore={loadMore}
            loading={loadingMore}
            totalCount={totalCount}
            loadedCount={loadedCount}
            loaderType="infinite-scroll"
          />
        </div>
      ) : null}
    </div>
  );
};

export default MobileView;
