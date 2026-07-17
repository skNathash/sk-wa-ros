import { Phone, BarChart3, Zap } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppCard from "~/components/core/card/AppCard";
import AppSimpleHeader from "~/components/core/header/AppSimpleHeader";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import AppButton from "~/components/core/button/AppButton";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import AuthService from "~/services/AuthService";
import MasterEmpService from "~/services/MasterEmpService";
import PageAccessService from "~/services/PageAccessService";
import StorageService from "~/services/StorageService";
import type {
  PaginationState,
  SortProps,
  SortValue,
  ViewToggleType,
} from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import MobileView from "./components/MobileView";
import { getCount, getData, prepareParams } from "./helper";
import InventorySubscribeService from "~/services/InventorySubscribeService";

export async function clientLoader() {
  return PageAccessService.canAccessPage([], { onlyMasterLogin: true });
}

const Stores: React.FC = () => {
  const [searchParams] = useSearchParams();

  const [busyLoading, setBusyLoading] = useState<{
    show: boolean;
    msg?: string;
  }>({ show: false, msg: "" });

  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const filterRef = useRef<any>({
    search: "",
    type: "All",
    state: "",
    district: "",
  });
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 50,
    startSlNo: 1,
    endSlNo: 50,
    totalRecords: 0,
  });

  const appNav = useAppNav();
  const appToast = useAppToast();

  const { isMobile } = useScreenView();
  const [view, setView] = useState<ViewToggleType>("list");

  const sortRef = useRef<SortProps>({
    key: "name",
    value: "asc",
  });

  const masterEmployee = AuthService.getLoggedMasterEmployee();

  useEffect(() => {
    applyFilter();
  }, []);

  const handleMasterLogout = () => {
    // perform immediate logout
    AuthService.logoutMasterLogin();
    // redirect to master login page
    appNav.replace("/auth/master/login");
  };

  const [appAlertDialog, setAppAlertDialog] = useState<{
    show: boolean;
    title?: string;
    description?: string;
    okText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    show: false,
  });

  const confirmLogout = () => {
    setAppAlertDialog({
      show: true,
      title: "Confirm Logout",
      description: "Are you sure you want to logout of master session?",
      okText: "Logout",
      cancelText: "Cancel",
      onConfirm: () => {
        setAppAlertDialog((prev) => ({ ...prev, show: false }));
        AuthService.logoutMasterLogin();
        appNav.replace("/auth/master/login");
      },
      onCancel: () => setAppAlertDialog((prev) => ({ ...prev, show: false })),
    });
  };

  const applyFilter = useCallback(async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
    };
    setLoading(true);
    setStores([]);
    try {
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current
      );
      const total = await getCount(params);
      paginationRef.current.totalRecords = total;
      const data = await getData(params);
      setStores(data);
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
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current
      );
      const data = await getData(params);
      setStores((prev) => [...prev, ...data]);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  const handleSearch = (value: string) => {
    filterRef.current = { ...filterRef.current, search: value };
    applyFilter();
  };

  const handleAccessStore = useCallback(async (franchiseId: string) => {
    setBusyLoading({ show: true, msg: "Accessing franchise..." });
    try {
      const resp = await MasterEmpService.accessFranchise(franchiseId);

      if (resp?.statusCode === 200) {
        // server may return token in multiple shapes
        const r: any = resp.data?.data || {};
        const token = r.token || "";

        InventorySubscribeService.clearLocalCart();

        if (token) {
          StorageService.set("_f", r?.franchise?.details);
          StorageService.set("_t", token);
        }

        appNav.replace("/auth/init");
      } else {
        appToast.show({
          msg: resp?.data?.message || "Failed to access franchise",
          color: "danger",
        });
      }
    } catch (e: any) {
      appToast.show({
        msg: e?.message || "Failed to access franchise",
        color: "danger",
      });
    } finally {
      setBusyLoading({ show: false, msg: "" });
    }
  }, []);

  const doAccessStore = async (franchiseId: string) => {
    appNav.openInNewTab("/auth/master/stores", {
      fid: franchiseId,
    });
  };

  useEffect(() => {
    const fid = searchParams?.get("fid");
    if (fid) {
      handleAccessStore(fid);
    }
    // only run when search params change or handler changes
  }, [searchParams, handleAccessStore]);

  const tableCallback = (action: { action: string; data: any }) => {
    if (action.action === "accessStore") {
      doAccessStore(action.data._id);
    }
  };

  const handleSort = (data: { key: string; value: SortValue }) => {
    sortRef.current = data;
    applyFilter();
  };

  const handleViewDashboard = () => {
    appNav.to("/master/analytics/network/dashboard");
  };

  return (
    <div>
      <AppSimpleHeader title="Master Login - Access Store" />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          {masterEmployee ? (
            <div className="tw:mb-4">
              <InfoBlock
                size="sm"
                className="tw:flex tw:justify-between tw:items-center"
                bordered
              >
                <div>
                  {/* Explicit label to indicate the following info is the logged-in employee */}
                  <div
                    className="tw:text-xs tw:text-blue-600 tw:font-medium tw:mb-1"
                    aria-hidden
                  >
                    Logged in employee
                  </div>
                  <div className="tw:font-semibold">
                    {masterEmployee.name || "Master Employee"}
                  </div>
                  <div className="tw:text-xs tw:text-gray-500">
                    <span>{masterEmployee.email}</span>
                    {masterEmployee.mobile ? (
                      <span
                        className="tw:inline-flex tw:items-center tw:ml-2 tw:text-xs tw:text-gray-500"
                        aria-label="mobile"
                      >
                        <Phone className="tw:w-3 tw:h-3 tw:mr-1 tw:text-gray-500" />
                        <span>{masterEmployee.mobile}</span>
                      </span>
                    ) : null}
                  </div>
                </div>
                <div>
                  <button
                    className="tw:text-sm tw:font-semibold tw:text-red-600 tw:cursor-pointer"
                    onClick={confirmLogout}
                  >
                    Logout
                  </button>
                </div>
              </InfoBlock>
            </div>
          ) : null}
          <div className="tw:text-gray-500 tw:text-xs tw:mb-6">
            Select a store to manage inventory, orders, and business settings
            across your network.
          </div>

          <div className="tw:mb-6">
            <div className="tw:bg-gradient-to-r tw:from-blue-600 tw:to-blue-700 tw:rounded-lg tw:p-5 tw:flex tw:items-center tw:justify-between tw:shadow-sm tw:border tw:border-blue-500">
              <div className="tw:flex tw:items-start tw:space-x-4">
                <div className="tw:bg-blue-500 tw:rounded-full tw:p-3 tw:flex-shrink-0">
                  <BarChart3 className="tw:w-5 tw:h-5 tw:text-white" />
                </div>
                <div>
                  <div className="tw:text-white tw:text-sm tw:font-semibold tw:flex tw:items-center tw:space-x-1">
                    <Zap className="tw:w-4 tw:h-4" />
                    <span>Master Analytics Dashboard</span>
                  </div>
                  <div className="tw:text-blue-100 tw:text-xs tw:mt-1">
                    Get real-time insights into your entire network performance,
                    sales trends, and operational metrics in one unified view.
                  </div>
                </div>
              </div>
              <AppButton
                onClick={handleViewDashboard}
                size="small"
                className="tw:flex-shrink-0 tw:ml-4 tw:bg-white tw:text-blue-700 tw:font-semibold tw:hover:bg-blue-50"
              >
                Explore Now
              </AppButton>
            </div>
          </div>

          <AppCard className="tw:mb-4">
            <Filter
              callback={({ formData }) => {
                filterRef.current = { ...filterRef.current, ...formData };
                applyFilter();
              }}
            />
          </AppCard>
          {loading ? (
            <div className="tw:flex tw:items-center tw:justify-center tw:py-8">
              <AppSpinner />
            </div>
          ) : (
            <>
              <AppCard noContentPadding>
                <div className="tw:flex tw:items-center tw:mt-2 tw:mx-4 tw:mb-4">
                  <div className="tw:flex-1">
                    <PaginationSummary
                      loadingTotalRecords={loading}
                      paginationConfig={paginationRef.current}
                      loadedCount={stores.length}
                      fwSize="sm"
                    />
                  </div>
                  <div className="tw:flex tw:items-center tw:space-x-2">
                    <ViewToggle viewType={view} callback={setView} />
                  </div>
                </div>

                {isMobile || view === "card" ? (
                  <MobileView
                    data={stores}
                    loading={loading}
                    callback={tableCallback}
                    loadingMore={loadingMore}
                    loadMore={loadMore}
                    totalCount={paginationRef.current.totalRecords}
                    loadedCount={stores.length}
                  />
                ) : (
                  <DesktopView
                    data={stores}
                    loading={loading}
                    callback={tableCallback}
                    sortKey={sortRef.current?.key}
                    onSort={handleSort}
                    sortValue={sortRef.current?.value}
                    loadedCount={stores.length}
                    loadingMore={loadingMore}
                    loadMore={loadMore}
                    totalCount={paginationRef.current.totalRecords}
                    showLoadMore={hasMoreData && !loading}
                  />
                )}
              </AppCard>
            </>
          )}
        </div>
      </div>
      <BusyLoader show={busyLoading.show} message={busyLoading.msg} />
      <AppAlertDialog
        show={appAlertDialog.show}
        title={appAlertDialog.title}
        description={appAlertDialog.description}
        okText={appAlertDialog.okText}
        cancelText={appAlertDialog.cancelText}
        onConfirm={appAlertDialog.onConfirm || (() => {})}
        onCancel={appAlertDialog.onCancel || (() => {})}
      />
    </div>
  );
};

export default Stores;
