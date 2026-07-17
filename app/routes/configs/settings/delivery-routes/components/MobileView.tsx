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
      <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:lg:grid-cols-3 tw:gap-4">
        {routes.map((route) => (
          <AppCard
            key={route._id ?? route.id}
            className={`tw:h-full tw:overflow-hidden tw:border-gray-200 tw:shadow-sm ${
              !route.isActive ? "tw:bg-red-50" : ""
            }`}
            noPadding
          >
            <div className="tw:flex tw:flex-col tw:h-full">
              {/* Card Header */}
              <div className="tw:p-4 tw:bg-gray-50/50 tw:border-b tw:border-gray-100">
                <div className="tw:flex tw:justify-between tw:items-start tw:gap-3">
                  <div className="tw:min-w-0 tw:flex-1">
                    <h3 className="tw:font-bold tw:text-[15px] tw:text-gray-900 tw:truncate tw:leading-tight">
                      {route.description || route.routeCode}
                    </h3>
                    <div className="tw:mt-0.5 tw:flex tw:items-center tw:gap-2">
                      <span className="tw:text-[10px] tw:font-bold tw:text-gray-400 tw:uppercase tw:tracking-wider">
                        Route ID:{" "}
                        {route.routeId || route._id || route.id || "N/A"}
                      </span>
                      {/* <span className="tw:text-[10px] tw:font-bold tw:text-gray-400 tw:uppercase tw:tracking-wider">
                        Route Code: {route.routeCode || "N/A"}
                      </span> */}
                    </div>
                  </div>
                  <AppBadge
                    variant={route.isActive ? "success" : "danger"}
                    className="tw:text-[10px] tw:px-2.5 tw:py-0.5 tw:rounded-full tw:font-bold tw:shrink-0"
                  >
                    {route.isActive ? "ENABLED" : "DISABLED"}
                  </AppBadge>
                </div>
              </div>

              {/* Card Body */}
              <div className="tw:p-4 tw:flex-1 tw:space-y-4">
                {/* Areas Section */}
                <div className="tw:space-y-2">
                  <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-gray-400">
                    <MapPin size={13} className="tw:shrink-0" />
                    <span className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-widest">
                      Coverage Areas{" "}
                      {route.areas && route.areas.length > 0
                        ? `[${route.areas.length}]`
                        : "[0]"}
                    </span>
                  </div>
                  <div>
                    {route.areas && route.areas.length > 0 ? (
                      <LocationsListPopover areas={route.areas} />
                    ) : (
                      <span className="tw:text-xs tw:text-gray-400 tw:italic">
                        No areas assigned
                      </span>
                    )}
                  </div>
                </div>

                {/* Delivery Days Section */}
                <div className="tw:space-y-2">
                  <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-gray-400">
                    <Calendar size={13} className="tw:shrink-0" />
                    <span className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-widest">
                      Delivery Schedule
                    </span>
                  </div>
                  <div className="tw:flex tw:flex-wrap tw:gap-1.5">
                    {route.deliveryDays && route.deliveryDays.length > 0 ? (
                      route.deliveryDays.map((day: string, idx: number) => (
                        <span
                          key={idx}
                          className="tw:inline-flex tw:px-2 tw:py-0.5 tw:rounded tw:bg-gray-100 tw:text-gray-700 tw:text-[10px] tw:font-bold tw:border tw:border-gray-200/50"
                        >
                          {day.substring(0, 3)}
                        </span>
                      ))
                    ) : (
                      <span className="tw:text-xs tw:text-gray-400 tw:italic">
                        Schedule not set
                      </span>
                    )}
                  </div>
                </div>

                {/* Total Users Section */}
                <div className="tw:p-2 tw:bg-gray-50/50 tw:border tw:border-gray-100/50 tw:rounded-lg">
                  <div className="tw:flex tw:items-center tw:justify-between">
                    <div className="tw:flex tw:flex-col tw:gap-1.5">
                      <div className="tw:flex tw:items-center tw:gap-2">
                        <Users
                          size={13}
                          className="tw:shrink-0 tw:text-gray-400"
                        />
                        <span className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-widest tw:text-gray-400">
                          B2B Customers
                        </span>
                      </div>
                      <span className="tw:text-lg tw:font-bold tw:text-blue-600">
                        {route.usersLinked?.length ?? 0}
                      </span>
                    </div>
                    <div className="tw:flex tw:gap-1.5">
                      <Rbac roles={rbacRoles.addUser}>
                        <AppButton
                          size="small"
                          fill="outline"
                          onClick={() =>
                            callback({ action: "addUser", data: route })
                          }
                          className="tw:h-7 tw:text-xs tw:font-semibold tw:px-2"
                        >
                          Add
                        </AppButton>
                      </Rbac>
                      <Rbac roles={rbacRoles.addUser}>
                        <AppButton
                          size="small"
                          fill="outline"
                          onClick={() =>
                            callback({
                              action: "viewAssignedUsers",
                              data: route,
                            })
                          }
                          className="tw:h-7 tw:text-xs tw:font-semibold tw:px-2 tw:bg-white"
                        >
                          View
                        </AppButton>
                      </Rbac>
                    </div>
                  </div>
                </div>

                {/* Employees Section */}
                <div className="tw:p-2 tw:bg-gray-50/50 tw:border tw:border-gray-100/50 tw:rounded-lg">
                  <div className="tw:flex tw:items-center tw:justify-between">
                    <div className="tw:flex tw:flex-col tw:gap-1.5">
                      <div className="tw:flex tw:items-center tw:gap-2">
                        <UserCheck
                          size={13}
                          className="tw:shrink-0 tw:text-gray-400"
                        />
                        <span className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-widest tw:text-gray-400">
                          Digital Raja/Rani
                        </span>
                      </div>
                      <span className="tw:text-lg tw:font-bold tw:text-purple-600">
                        {route.manpowerLinked?.length ?? 0}
                      </span>
                    </div>
                    <div className="tw:flex tw:gap-1.5">
                      <Rbac roles={rbacRoles.addUser}>
                        <AppButton
                          size="small"
                          fill="outline"
                          onClick={() =>
                            callback({ action: "addEmployee", data: route })
                          }
                          className="tw:h-7 tw:text-xs tw:font-semibold tw:px-2"
                        >
                          Add
                        </AppButton>
                      </Rbac>
                      <Rbac roles={rbacRoles.addUser}>
                        <AppButton
                          size="small"
                          fill="outline"
                          onClick={() =>
                            callback({
                              action: "viewAssignedEmployees",
                              data: route,
                            })
                          }
                          className="tw:h-7 tw:text-xs tw:font-semibold tw:px-2 tw:bg-white"
                        >
                          View
                        </AppButton>
                      </Rbac>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="tw:p-3 tw:bg-gray-50 tw:border-t tw:border-gray-100 tw:flex tw:gap-2 tw:flex-wrap">
                <Rbac roles={rbacRoles.editRoute}>
                  <AppButton
                    size="small"
                    fill="outline"
                    color="light"
                    onClick={() => onEdit(route)}
                    className="tw:flex-1 tw:min-w-[100px] tw:py-2 tw:h-9 tw:text-xs"
                  >
                    <Edit2 size={14} className="tw:mr-1.5" />
                    Edit
                  </AppButton>
                </Rbac>

                <Rbac roles={rbacRoles.editRoute}>
                  <AppButton
                    size="small"
                    fill="outline"
                    color="light"
                    onClick={() => callback({ action: "viewLog", data: route })}
                    className="tw:flex-1 tw:min-w-[100px] tw:py-2 tw:h-9 tw:text-xs"
                    title="View Log"
                  >
                    <FileText size={14} className="tw:mr-1.5" />
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
                    className="tw:flex-1 tw:min-w-[100px] tw:py-2 tw:h-9 tw:text-xs"
                    title={route.isActive ? "Disable" : "Enable"}
                  >
                    {route.isActive ? (
                      <div className="tw:flex tw:items-center tw:justify-center">
                        <X size={14} className="tw:mr-1.5" />
                        Disable
                      </div>
                    ) : (
                      <div className="tw:flex tw:items-center tw:justify-center">
                        <Check size={14} className="tw:mr-1.5" />
                        Enable
                      </div>
                    )}
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
