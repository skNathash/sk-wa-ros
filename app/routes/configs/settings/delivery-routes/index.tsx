import { PlusIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import DeliveryRoutesService from "~/services/DeliveryRoutesService";
import type {
  BreadcrumbItem,
  PaginationState,
  ViewToggleType,
} from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import MobileView from "./components/MobileView";
import Customers from "./components/customers/Customers";
import Employees from "./components/employees/Employees";
import AppTab from "~/components/core/tab/AppTab";
import Filter from "./components/Filter";
import { getCount, getData, prepareParams } from "./helper";
import RouteManageModal from "./modals/RouteManageModal";
import UsersModal from "./modals/users/UsersModal";
import AssignedUsersModal from "./modals/assigned-users/AssignedUsersModal";
import AuditLogModal from "./modals/audit-log/AuditLogModal";
import EmployeesModal from "./modals/employees/EmployeesModal";
import AssignedEmployeesModal from "./modals/employees/AssignedEmployeesModal";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import useScreenView from "~/hooks/useScreenView";
import Rbac from "~/components/core/rbac/Rbac";

export async function clientLoader() {
  return PageAccessService.canAccessPage([
    "DELIVERY-ROUTE.DELIVERY-ROUTE-VIEW",
    "DELIVERY-ROUTE.DELIVERY-ROUTE-CREATE",
  ]);
}

const defaultBreadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    langKey: "dashboard",
    redirect: { path: "/dashboard" },
  },
  {
    label: "Configs",
    langKey: "configs",
    redirect: { path: "/configs/settings" },
  },
  { label: "Delivery / Beat Route" },
];

const TABS = [
  { key: "config", name: "Config", icon: "settings" },
  { key: "customers", name: "B2B Customers", icon: "users" },
  { key: "employees", name: "Digital Raja/Rani", icon: "users" },
];

const rbacRoles = {
  createRoute: ["DELIVERY-ROUTE.DELIVERY-ROUTE-CREATE"],
};

const DeliveryRoutes = () => {
  const appToast = useAppToast();
  const { isMobile } = useScreenView();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("config");
  const [routes, setRoutes] = useState<any[]>([]);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewType, setViewType] = useState<ViewToggleType>("list");

  const [usersModal, setUsersModal] = useState<{
    show: boolean;
    type: "b2b" | "b2c";
    data?: any;
    routeId?: string;
  }>({
    show: false,
    type: "b2b",
    data: {},
    routeId: "",
  });

  const [modal, setModal] = useState<{
    show: boolean;
    data?: any;
    editId?: string | null;
  }>({
    show: false,
    data: null,
    editId: null,
  });

  const [appAlertDialog, setAppAlertDialog] = useState<{
    show: boolean;
    title: string;
    description: string;
    action?: string;
    data?: any;
  }>({
    show: false,
    title: "",
    description: "",
  });

  const [assignedUsersModal, setAssignedUsersModal] = useState<{
    show: boolean;
    routeId?: string | null;
    refreshKey?: number;
  }>({
    show: false,
    routeId: null,
  });

  const [auditLogModal, setAuditLogModal] = useState<{
    show: boolean;
    routeId?: string | null;
  }>({
    show: false,
    routeId: null,
  });

  const [employeesModal, setEmployeesModal] = useState<{
    show: boolean;
    data?: any;
    routeId?: string;
  }>({
    show: false,
    data: {},
    routeId: "",
  });

  const [assignedEmployeesModal, setAssignedEmployeesModal] = useState<{
    show: boolean;
    routeId?: string | null;
    refreshKey?: number;
  }>({
    show: false,
    routeId: null,
  });

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const filterRef = useRef<{ search: string; status: string }>({
    search: "",
    status: "all",
  });

  const applyFilter = useCallback(async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };

    setLoading(true);
    setRoutes([]);

    try {
      const params = prepareParams(filterRef.current, paginationRef.current);
      const total = await getCount(params);
      paginationRef.current.totalRecords = total;
      const data = await getData(params);
      setRoutes(data);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };

      const params = prepareParams(filterRef.current, paginationRef.current);
      const data = await getData(params);
      setRoutes((prev) => [...prev, ...data]);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMoreData, loadingMore]);

  useEffect(() => {
    filterRef.current = { search: "", status: "all" };
    void applyFilter();
  }, [applyFilter]);

  const handleCreate = () => {
    setModal({ show: true, data: null, editId: null });
  };

  const handleEdit = (route: any) => {
    const id = route._id ?? route.id ?? route.routeId ?? null;
    setModal({ show: true, data: null, editId: id });
  };

  const handleDelete = (route: any) => {
    setAppAlertDialog({
      show: true,
      title: "Delete Route",
      description: "Are you sure you want to delete this route?",
      action: "deleteRoute",
      data: route,
    });
  };

  const handleModalCallback = (a: {
    action: "submit" | "close";
    data?: any;
  }) => {
    if (a.action === "submit") {
      if (modal.editId) {
        // After edit, refresh only the updated route from server
        void fetchAndReplaceRoute(modal.editId).then(() =>
          appToast.show({
            msg: "Route updated successfully",
            color: "success",
          }),
        );
      } else {
        // Create - refresh list from server to ensure latest data and proper ordering
        void applyFilter();
      }
    }
    setModal({ show: false, data: null, editId: null });
  };

  const handleUsersModalCallback = (a: { action: string; data?: any }) => {
    if (a.action === "close") {
      setUsersModal({ show: false, type: "b2b", data: null });
      return;
    }

    if (a.action === "userAssigned") {
      // Refresh only the affected route
      const routeId = a.data?.routeId ?? usersModal.routeId;
      // setUsersModal({ show: false, type: "b2b", data: null });
      if (routeId) {
        void fetchAndReplaceRoute(routeId).then(() =>
          appToast.show({ msg: "User assigned to route", color: "success" }),
        );
      }
      return;
    }

    // fallback close
    setUsersModal({ show: false, type: "b2b", data: null });
  };

  const handleAssignedUsersModalCallback = (a: {
    action: string;
    data?: any;
  }) => {
    if (a.action === "close") {
      setAssignedUsersModal({ show: false, routeId: null });
      return;
    }

    if (a.action === "userRemoved") {
      const routeId = a.data?.routeId ?? assignedUsersModal.routeId;
      const user = a.data?.user;
      const userId = user?._id ?? user?.id;

      // update local routes list to remove the user from route
      setRoutes((prev) =>
        prev.map((r) =>
          (r._id ?? r.id) === routeId
            ? {
                ...r,
                usersLinked: (r.usersLinked || []).filter(
                  (uu: any) => (uu._id ?? uu.id) !== userId,
                ),
              }
            : r,
        ),
      );

      // trigger assigned users modal to refresh its route data
      setAssignedUsersModal((prev) => ({
        ...prev,
        refreshKey: (prev.refreshKey || 0) + 1,
      }));

      appToast.show({ msg: "User removed from route", color: "success" });
      return;
    }

    if (a.action === "userRemovedFailed") {
      const msg = a.data?.message || "Failed to remove user";
      appToast.show({ msg, color: "danger" });
      return;
    }

    // fallback: close
    setAssignedUsersModal({ show: false, routeId: null });
  };

  const handleItemCallback = (a: {
    action: string;
    data?: any;
    index?: number;
  }) => {
    if (a.action === "viewAssignedUsers") {
      setAssignedUsersModal({ show: true, routeId: a.data?._id });
      return;
    }
    if (a.action === "addUser") {
      if (a.data && a.data.isActive === false) {
        appToast.show({
          msg: "Please enable the route to add users",
          color: "warning",
        });
        return;
      }
      setUsersModal({
        show: true,
        type: "b2b",
        data: a.data,
        routeId: a.data?._id,
      });
      return;
    }

    if (a.action === "markAsActive" || a.action === "markAsInactive") {
      const willActivate = a.action === "markAsActive";
      setAppAlertDialog({
        show: true,
        title: willActivate ? "Enable Route" : "Disable Route",
        description: willActivate
          ? "Are you sure you want to enable this route?"
          : "Are you sure you want to disable this route?",
        action: willActivate ? "markAsActive" : "markAsInactive",
        data: a.data,
      });
      return;
    }
    if (a.action === "addEmployee") {
      if (a.data && a.data.isActive === false) {
        appToast.show({
          msg: "Please enable the route to add employees",
          color: "warning",
        });
        return;
      }
      setEmployeesModal({
        show: true,
        data: a.data,
        routeId: a.data?._id,
      });
      return;
    }

    if (a.action === "viewAssignedEmployees") {
      setAssignedEmployeesModal({ show: true, routeId: a.data?._id });
      return;
    }

    if (a.action === "viewLog") {
      setAuditLogModal({ show: true, routeId: a.data?._id });
      return;
    }
  };

  const handleEmployeesModalCallback = (a: { action: string; data?: any }) => {
    if (a.action === "close") {
      setEmployeesModal({ show: false, data: null });
      return;
    }

    if (a.action === "employeeAssigned") {
      const routeId = a.data?.routeId ?? employeesModal.routeId;
      if (routeId) {
        void fetchAndReplaceRoute(routeId).then(() =>
          appToast.show({
            msg: "Employee assigned to route",
            color: "success",
          }),
        );
      }
      return;
    }

    setEmployeesModal({ show: false, data: null });
  };

  const handleAssignedEmployeesModalCallback = (a: {
    action: string;
    data?: any;
  }) => {
    if (a.action === "close") {
      setAssignedEmployeesModal({ show: false, routeId: null });
      return;
    }

    if (a.action === "employeeRemoved") {
      const routeId = a.data?.routeId ?? assignedEmployeesModal.routeId;
      const user = a.data?.user;
      const userId = user?._id ?? user?.id;

      setRoutes((prev) =>
        prev.map((r) =>
          (r._id ?? r.id) === routeId
            ? {
                ...r,
                manpowerLinked: (r.manpowerLinked || []).filter(
                  (uu: any) => (uu._id ?? uu.id) !== userId,
                ),
              }
            : r,
        ),
      );

      setAssignedEmployeesModal((prev) => ({
        ...prev,
        refreshKey: (prev.refreshKey || 0) + 1,
      }));

      appToast.show({
        msg: "Employee removed from route",
        color: "success",
      });
      return;
    }

    if (a.action === "employeeRemovedFailed") {
      const msg = a.data?.message || "Failed to remove employee";
      appToast.show({ msg, color: "danger" });
      return;
    }

    setAssignedEmployeesModal({ show: false, routeId: null });
  };

  const [busyLoader, setBusyLoader] = useState<{
    show: boolean;
    message?: string;
  }>({ show: false });

  const fetchAndReplaceRoute = async (id?: string | null) => {
    if (!id) return null;
    try {
      setBusyLoader({ show: true, message: "Refreshing route..." });
      const resp: any = await DeliveryRoutesService.getRoutesList({
        filter: { _id: id },
      });
      const d = resp?.data?.data?.[0] ?? null;
      if (d) {
        setRoutes((prev) => prev.map((r) => ((r._id ?? r.id) === id ? d : r)));
      }
      return d;
    } catch (e) {
      return null;
    } finally {
      setBusyLoader({ show: false });
    }
  };

  const handleFilterChange = (a: { action?: string; data: any }) => {
    filterRef.current = { ...filterRef.current, ...(a.data || {}) };
    void applyFilter();
  };

  const alertDailogCancelCb = () => {
    setAppAlertDialog((prev) => ({ ...prev, show: false }));
  };

  const alertDailogSuccessCb = async () => {
    const action = appAlertDialog.action;
    const data = appAlertDialog.data;

    switch (action) {
      case "deleteRoute":
        setRoutes((prev) =>
          prev.filter((r) => (r._id ?? r.id) !== (data._id ?? data.id)),
        );
        setAppAlertDialog((prev) => ({ ...prev, show: false }));
        appToast.show({ msg: "Route deleted successfully", color: "success" });
        break;

      case "markAsActive":
      case "markAsInactive": {
        const willActivate = action === "markAsActive";
        const id = data?._id ?? data?.id;
        try {
          const resp: any = await DeliveryRoutesService.updateStatus(id, {
            isActive: willActivate,
          });
          if (resp?.statusCode === 200) {
            setRoutes((prev) =>
              prev.map((r) =>
                (r._id ?? r.id) === id ? { ...r, isActive: willActivate } : r,
              ),
            );
            appToast.show({
              msg: willActivate ? "Route enabled" : "Route disabled",
              color: "success",
            });
          } else {
            appToast.show({
              msg: resp?.data?.message || "Failed to update route status",
              color: "danger",
            });
          }
        } catch (e) {
          appToast.show({
            msg: "Failed to update route status",
            color: "danger",
          });
        }
        setAppAlertDialog((prev) => ({ ...prev, show: false }));
        break;
      }

      default:
        setAppAlertDialog((prev) => ({ ...prev, show: false }));
    }
  };

  return (
    <>
      <AppHeader title="Delivery / Beat Route" />
      <div className="app-page tw:p-4 page-bg">
        <div className="app-container">
          <div className="tw:flex tw:flex-col tw:lg:flex-row tw:lg:justify-between tw:lg:items-start tw:gap-4 tw:mb-4">
            <div className="tw:flex-1 tw:min-w-0">
              <AppBreadcrumbs data={defaultBreadcrumbs} />
              <div className="tw:text-gray-500 tw:text-xs">
                Manage delivery / beat routes and areas
              </div>
            </div>
            {!isMobile && (
              <div className="tw:shrink-0">
                <Rbac roles={rbacRoles.createRoute}>
                  <AppButton
                    onClick={handleCreate}
                    color="primary"
                    size="small"
                  >
                    <PlusIcon size={16} className="tw:mr-2" /> Create Route
                  </AppButton>
                </Rbac>
              </div>
            )}
          </div>

          <AppTab
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab.key)}
            className="tw:mb-4"
          />

          {activeTab === "config" && (
            <>
              <Filter callback={handleFilterChange} />
              <div className="tw:flex tw:justify-between tw:items-center tw:gap-4 tw:mb-3">
                <div className="tw:flex-1">
                  <PaginationSummary
                    paginationConfig={paginationRef.current}
                    loadingTotalRecords={loading}
                    fwSize="sm"
                    loadedCount={routes.length}
                  />
                </div>
                <div className="tw:shrink-0">
                  <ViewToggle viewType={viewType} callback={setViewType} />
                </div>
              </div>
              {isMobile || viewType === "card" ? (
                <MobileView
                  loading={loading}
                  routes={routes}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  showLoadMore={hasMoreData}
                  loadingMore={loadingMore}
                  loadMore={loadMore}
                  totalCount={paginationRef.current.totalRecords}
                  loadedCount={routes.length}
                  callback={handleItemCallback}
                />
              ) : (
                <AppCard noPadding>
                  <DesktopView
                    loading={loading}
                    routes={routes}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    showLoadMore={hasMoreData}
                    loadingMore={loadingMore}
                    loadMore={loadMore}
                    totalCount={paginationRef.current.totalRecords}
                    loadedCount={routes.length}
                    callback={handleItemCallback}
                  />
                </AppCard>
              )}
              {isMobile && (
                <div className="app-footer tw:p-4">
                  <AppButton
                    onClick={handleCreate}
                    color="primary"
                    className="tw:w-full"
                  >
                    <PlusIcon size={16} className="tw:mr-2" /> Create Route
                  </AppButton>
                </div>
              )}
            </>
          )}
          {activeTab === "customers" && (
            <>
              <div className="tw:text-gray-500 tw:text-xs tw:mb-4">
                List of B2B customers linked to delivery routes
              </div>
              <Customers />
            </>
          )}
          {activeTab === "employees" && (
            <>
              <div className="tw:text-gray-500 tw:text-xs tw:mb-4">
                List of Digital Raja/Rani linked to delivery routes
              </div>
              <Employees />
            </>
          )}
        </div>
      </div>
      <RouteManageModal
        show={modal.show}
        editId={modal.editId ?? undefined}
        data={modal.data}
        callback={handleModalCallback}
      />
      <BusyLoader show={busyLoader.show} message={busyLoader.message} />
      <AppAlertDialog
        show={appAlertDialog.show}
        title={appAlertDialog.title}
        description={appAlertDialog.description}
        onConfirm={alertDailogSuccessCb}
        onCancel={alertDailogCancelCb}
      />
      <UsersModal
        show={usersModal.show}
        type={usersModal.type}
        callback={handleUsersModalCallback}
        routeId={usersModal.routeId || ""}
      />
      <AssignedUsersModal
        show={assignedUsersModal.show}
        routeId={assignedUsersModal.routeId}
        refreshKey={assignedUsersModal.refreshKey}
        callback={handleAssignedUsersModalCallback}
      />
      <EmployeesModal
        show={employeesModal.show}
        callback={handleEmployeesModalCallback}
        routeId={employeesModal.routeId || ""}
      />
      <AssignedEmployeesModal
        show={assignedEmployeesModal.show}
        routeId={assignedEmployeesModal.routeId}
        refreshKey={assignedEmployeesModal.refreshKey}
        callback={handleAssignedEmployeesModalCallback}
      />
      <AuditLogModal
        show={auditLogModal.show}
        routeId={auditLogModal.routeId || ""}
        callback={(a) => {
          if (a.action === "close")
            setAuditLogModal({ show: false, routeId: null });
        }}
      />
    </>
  );
};

export default DeliveryRoutes;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Delivery / Beat Route"),
    },
  ];
}
