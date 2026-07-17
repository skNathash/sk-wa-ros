import { Check, Edit2, FileText, Plus, X } from "lucide-react";
import React from "react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import { TableSkeletonLoader } from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import LocationsListPopover from "./LocationsListPopover";
import type { SortValue, TableHeaderItem } from "~/types/CommonTypes";
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
  sortKey?: string;
  sortValue?: SortValue;
  onSort?: (data: { key: string; value: SortValue }) => void;
  callback: (a: { action: string; data?: any; index?: number }) => void;
}

const rbacRoles = {
  addUser: ["DELIVERY-ROUTE.DELIVERY-ROUTE-ADD-USER"],
  editRoute: ["DELIVERY-ROUTE.DELIVERY-ROUTE-EDIT"],
};

const headers: TableHeaderItem[] = [
  { label: "Sl No.", key: "slNo", width: "5%" },
  { label: "Route Name", key: "description", width: "25%" },
  { label: "Areas", key: "areas", width: "25%", enableSort: false },
  { label: "Days", key: "deliveryDays", width: "25%", enableSort: false },
  {
    label: "Linked B2B Customers",
    key: "totalUsers",
    width: "12%",
    enableSort: false,
  },
  {
    label: "Linked Digital Raja/Rani",
    key: "totalEmployees",
    width: "12%",
    enableSort: false,
  },
  { label: "Status", key: "status", width: "15%", enableSort: false },
  { label: "Actions", key: "action", width: "15%" },
];

const DesktopView: React.FC<Props> = ({
  loading,
  routes,
  onEdit,
  onDelete,
  showLoadMore,
  loadingMore,
  loadMore,
  totalCount = 0,
  loadedCount = 0,
  sortKey,
  sortValue,
  onSort,
  callback,
}) => {
  if (!loading && routes.length === 0) {
    return <NoData />;
  }

  return (
    <div className="tw:overflow-x-auto">
      <AppTable>
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
            <TableSkeletonLoader cols={headers.length} rows={10} />
          ) : routes.length > 0 ? (
            routes.map((route, index) => (
              <AppTable.Row
                key={route._id ?? route.id}
                className={!route.isActive ? "tw:bg-red-50" : ""}
              >
                <AppTable.Cell>{index + 1}</AppTable.Cell>
                <AppTable.Cell>
                  <div className="tw:flex tw:flex-col">
                    <div className="tw:font-medium">
                      {route.description || route.routeCode}
                    </div>
                    <div className="tw:text-xs tw:text-gray-500">
                      ID: {route.routeId || route._id || route.id || "N/A"}
                    </div>
                  </div>
                </AppTable.Cell>
                <AppTable.Cell>
                  <div className="tw:flex tw:flex-wrap tw:gap-1.5">
                    {route.areas && route.areas.length > 0 ? (
                      <LocationsListPopover areas={route.areas} />
                    ) : (
                      <span className="tw:text-xs tw:text-gray-400 tw:italic">
                        No areas assigned
                      </span>
                    )}
                  </div>
                </AppTable.Cell>
                <AppTable.Cell>
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
                </AppTable.Cell>
                <AppTable.Cell>
                  <div className="tw:flex tw:flex-col tw:gap-2">
                    <div className="tw:text-sm tw:font-semibold">
                      {route.usersLinked?.length ?? 0} B2B Customers
                    </div>
                    <div className="tw:flex tw:gap-3">
                      <Rbac roles={rbacRoles.addUser}>
                        <button
                          onClick={() =>
                            callback({ action: "addUser", data: route })
                          }
                          className="tw:text-xs tw:text-green-600 hover:tw:text-green-800 hover:tw:underline tw:font-semibold tw:cursor-pointer"
                        >
                          <Plus size={12} className="tw:inline tw:mr-0.5" />
                          Add
                        </button>
                      </Rbac>

                      <Rbac roles={rbacRoles.addUser}>
                        <button
                          onClick={() =>
                            callback({
                              action: "viewAssignedUsers",
                              data: route,
                            })
                          }
                          className="tw:text-xs tw:text-gray-600 hover:tw:text-gray-800 hover:tw:underline tw:font-medium tw:cursor-pointer"
                        >
                          View
                        </button>
                      </Rbac>
                    </div>
                  </div>
                </AppTable.Cell>
                <AppTable.Cell>
                  <div className="tw:flex tw:flex-col tw:gap-2">
                    <div className="tw:text-sm tw:font-semibold">
                      {route.manpowerLinked?.length ?? 0} Digital Raja/Rani
                    </div>
                    <div className="tw:flex tw:gap-3">
                      <Rbac roles={rbacRoles.addUser}>
                        <button
                          onClick={() =>
                            callback({ action: "addEmployee", data: route })
                          }
                          className="tw:text-xs tw:text-green-600 hover:tw:text-green-800 hover:tw:underline tw:font-semibold tw:cursor-pointer"
                        >
                          <Plus size={12} className="tw:inline tw:mr-0.5" />
                          Add
                        </button>
                      </Rbac>

                      <Rbac roles={rbacRoles.addUser}>
                        <button
                          onClick={() =>
                            callback({
                              action: "viewAssignedEmployees",
                              data: route,
                            })
                          }
                          className="tw:text-xs tw:text-gray-600 hover:tw:text-gray-800 hover:tw:underline tw:font-medium tw:cursor-pointer"
                        >
                          View
                        </button>
                      </Rbac>
                    </div>
                  </div>
                </AppTable.Cell>
                <AppTable.Cell>
                  {route.isActive ? (
                    <AppBadge variant="success">Enabled</AppBadge>
                  ) : (
                    <AppBadge variant="destructive">Disabled</AppBadge>
                  )}
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-right">
                  <div className="tw:flex tw:items-center tw:justify-end tw:gap-2">
                    <Rbac roles={rbacRoles.editRoute}>
                      <AppButton
                        size="small"
                        fill="outline"
                        onClick={() => onEdit(route)}
                        title="Edit Route"
                      >
                        <Edit2 size={16} />
                      </AppButton>
                    </Rbac>

                    <Rbac roles={rbacRoles.editRoute}>
                      <AppButton
                        size="small"
                        fill="outline"
                        onClick={() =>
                          callback({ action: "viewLog", data: route })
                        }
                        title="View Log"
                      >
                        <FileText size={16} />
                      </AppButton>
                    </Rbac>

                    {route.isActive ? (
                      <Rbac roles={rbacRoles.editRoute}>
                        <AppButton
                          size="small"
                          fill="outline"
                          color="danger"
                          onClick={() =>
                            callback({
                              action: "markAsInactive",
                              data: route,
                              index,
                            })
                          }
                          className="tw:flex tw:items-center tw:justify-center tw:gap-1.5 tw:w-[110px]"
                        >
                          <X size={14} />
                          Disable
                        </AppButton>
                      </Rbac>
                    ) : (
                      <Rbac roles={rbacRoles.editRoute}>
                        <AppButton
                          size="small"
                          fill="outline"
                          color="success"
                          onClick={() =>
                            callback({
                              action: "markAsActive",
                              data: route,
                              index,
                            })
                          }
                          className="tw:flex tw:items-center tw:justify-center tw:gap-1.5 tw:w-[110px]"
                        >
                          <Check size={14} />
                          Enable
                        </AppButton>
                      </Rbac>
                    )}
                  </div>
                </AppTable.Cell>
              </AppTable.Row>
            ))
          ) : (
            <AppTable.Row>
              <AppTable.Cell colSpan={headers.length}>
                <NoData />
              </AppTable.Cell>
            </AppTable.Row>
          )}
          {showLoadMore && !loading && routes.length > 0 ? (
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
                  loaderType="infinite-scroll"
                />
              </AppTable.Cell>
            </AppTable.Row>
          ) : null}
        </AppTable.Body>
      </AppTable>
    </div>
  );
};

export default DesktopView;
