import { Clock, Layers, Play, Plus, TimerOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import AppTab from "~/components/core/tab/AppTab";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import { ALERT_DISMISS_TIME } from "~/constants";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import BannerService from "~/services/BannerService";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import type {
  BreadcrumbItem,
  PaginationState,
  TabItem,
  ViewToggleType,
} from "~/types/CommonTypes";
import PageAccessService from "~/services/PageAccessService";
import Rbac from "~/components/core/rbac/Rbac";
import AppliedFilters from "./components/AppliedFilters";
import DesktopView from "./components/DesktopView";
import MobileView from "./components/MobileView";
import Filter from "./components/Filter";
import { getCount, getData, prepareParams } from "./helper";

export async function clientLoader() {
  return PageAccessService.canAccessPage([
    "BANNER.BANNER-VIEW",
    "BANNER.BANNER-CREATE",
  ]);
}

const rbacRoles = {
  create: ["BANNER.BANNER-CREATE"],
  update: ["BANNER.BANNER-UPDATE"],
};

const tabs: TabItem[] = [
  { key: "All", name: "All Banners", icon: <Layers size={16} /> },
  { key: "Running", name: "Running Banners", icon: <Play size={16} /> },
  { key: "Upcoming", name: "Upcoming Banners", icon: <Clock size={16} /> },
  { key: "Expired", name: "Expired Banners", icon: <TimerOff size={16} /> },
];

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    langKey: "dashboard",
    redirect: { path: "/dashboard" },
  },
  { label: "Banner Config" },
];

export default function BannerConfigList() {
  const { isMobile } = useScreenView();
  const nav = useAppNav();
  const toast = useAppToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "All";

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [view, setView] = useState<ViewToggleType>("list");
  const [busyLoading, setBusyLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    show: boolean;
    title: string;
    description: string;
    action: "active" | "inactive" | null;
    item: any | null;
  }>({ show: false, title: "", description: "", action: null, item: null });
  const [imgPreviewModal, setImgPreviewModal] = useState<{
    show: boolean;
    images: Array<{ id: string }>;
  }>({ show: false, images: [] });

  const methods = useForm({
    defaultValues: {
      search: "",
      isActive: "all",
      type: "All",
      validityDateRange: undefined as Date[] | undefined,
      createdDateRange: undefined as Date[] | undefined,
      status: "all",
    },
  });

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const handleFilterChange = (payload: { formData: any }) => {
    const { formData } = payload;
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (formData?.search) p.set("search", formData.search);
        else p.delete("search");
        if (formData?.isActive && formData.isActive !== "all")
          p.set("isActive", formData.isActive);
        else p.delete("isActive");
        if (formData?.type && formData.type !== "All")
          p.set("type", formData.type);
        else p.delete("type");
        return p;
      },
      { replace: true } as any,
    );
  };

  const handleFilterCallback = ({
    action,
    data,
  }: {
    action: string;
    data: any;
  }) => {
    if (action === "apply" || action === "reset") {
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);

          const setOrDelete = (key: string, val: any) => {
            if (val) p.set(key, val);
            else p.delete(key);
          };

          // validity date range (range picker returns [from, to])
          if (data.validityDateRange?.[0]) {
            setOrDelete(
              "validityFrom",
              new Date(data.validityDateRange[0]).toISOString(),
            );
          } else {
            p.delete("validityFrom");
          }
          if (data.validityDateRange?.[1]) {
            setOrDelete(
              "validityTo",
              new Date(data.validityDateRange[1]).toISOString(),
            );
          } else {
            p.delete("validityTo");
          }

          // created on date range (range picker returns [from, to])
          if (data.createdDateRange?.[0]) {
            setOrDelete(
              "createdFrom",
              new Date(data.createdDateRange[0]).toISOString(),
            );
          } else {
            p.delete("createdFrom");
          }
          if (data.createdDateRange?.[1]) {
            setOrDelete(
              "createdTo",
              new Date(data.createdDateRange[1]).toISOString(),
            );
          } else {
            p.delete("createdTo");
          }

          // status
          if (data.status && data.status !== "all")
            p.set("status", data.status);
          else p.delete("status");

          return p;
        },
        { replace: true } as any,
      );
    }
  };

  const handleTabChange = (tab: TabItem) => {
    methods.reset({
      search: "",
      isActive: "all",
      type: "All",
      validityDateRange: undefined,
      createdDateRange: undefined,
      status: "all",
    });
    setSearchParams(
      () => {
        const p = new URLSearchParams();
        if (tab.key !== "All") p.set("tab", tab.key);
        return p;
      },
      { replace: true } as any,
    );
  };

  const applyFilter = useCallback(async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };

    setLoading(true);
    setItems([]);

    try {
      const params = prepareParams(
        methods.getValues(),
        paginationRef.current,
        activeTab,
      );
      const total = await getCount(params);
      paginationRef.current.totalRecords = total;
      const data = await getData(params);
      setItems(data);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoading(false);
    }
  }, [methods, activeTab]);

  useEffect(() => {
    const search = searchParams.get("search") || "";
    const isActive = searchParams.get("isActive") || "all";
    const validityFrom = searchParams.get("validityFrom");
    const validityTo = searchParams.get("validityTo");
    const createdFrom = searchParams.get("createdFrom");
    const createdTo = searchParams.get("createdTo");
    const type = searchParams.get("type") || "All";
    const status = searchParams.get("status") || "all";

    // Reconstruct date range arrays [from, to] for the range picker
    const validityDateRange =
      validityFrom || validityTo
        ? [
            validityFrom ? new Date(validityFrom) : undefined,
            validityTo ? new Date(validityTo) : undefined,
          ].filter(Boolean)
        : undefined;

    const createdDateRange =
      createdFrom || createdTo
        ? [
            createdFrom ? new Date(createdFrom) : undefined,
            createdTo ? new Date(createdTo) : undefined,
          ].filter(Boolean)
        : undefined;

    const values = {
      ...methods.getValues(),
      search,
      isActive,
      type,
      validityDateRange,
      createdDateRange,
      status,
    };
    methods.reset(values as any);
    void applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString(), applyFilter, methods]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(
        methods.getValues(),
        paginationRef.current,
        activeTab,
      );
      const data = await getData(params);
      setItems((prev) => [...prev, ...data]);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMoreData, loadingMore, methods]);

  const itemCallback = ({ action, data }: { action: string; data?: any }) => {
    if (action === "view") {
      nav.to(`/configs/banner/view?id=${data?._id}`);
    }
    if (action === "rowClick") {
      nav.to(`/configs/banner/view?id=${data?._id}`);
    }
    if (action === "preview-image" && data?.bannerImage?.assetId) {
      setImgPreviewModal({
        show: true,
        images: [{ id: data.bannerImage.assetId }],
      });
    }
    if (action === "toggle-status" && data) {
      const nextAction = data.isActive ? "inactive" : "active";
      setAlertConfig({
        show: true,
        title: nextAction === "active" ? "Mark as Active" : "Mark as Inactive",
        description: `Are you sure you want to mark this banner as ${nextAction === "active" ? "Active" : "Inactive"}?`,
        action: nextAction,
        item: data,
      });
    }
  };

  const handleAlertConfirm = async () => {
    const { action, item } = alertConfig;
    setAlertConfig((prev) => ({ ...prev, show: false }));

    setTimeout(async () => {
      try {
        setBusyLoading(true);
        const payload: Record<string, any> = {
          isActive: action === "active",
        };
        if (item?.placeholderInfo?.id) {
          payload.placeholderId = item.placeholderInfo.id;
        }
        if (item?.bannerType) {
          payload.bannerType = item.bannerType;
        }
        const res = await BannerService.update(item?._id, payload);

        if (res && (res.statusCode === 200 || res.statusCode === 201)) {
          toast.show({
            msg: `Banner marked as ${action === "active" ? "Active" : "Inactive"} successfully`,
            color: "success",
          });
          setItems((prev) =>
            prev.map((i) =>
              i._id === item?._id ? { ...i, isActive: action === "active" } : i,
            ),
          );
        } else {
          toast.show({
            msg: res?.data?.message || "Something went wrong",
            color: "error",
          });
        }
      } catch {
        toast.show({ msg: "Something went wrong", color: "error" });
      } finally {
        setBusyLoading(false);
      }
    }, ALERT_DISMISS_TIME);
  };

  const handleAlertCancel = () => {
    setAlertConfig((prev) => ({ ...prev, show: false, action: null, item: null }));
  };

  return (
    <>
      <AppHeader title="Banner Config" />

      <div className="page-bg app-page tw:p-4">
        <div className="app-container">
          <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:items-start tw:md:items-center tw:mb-1 tw:gap-1">
            <div className="tw:flex-1">
              <AppBreadcrumbs data={breadcrumbs} className="tw:mb-1!" />
            </div>
            {!isMobile && (
              <Rbac roles={rbacRoles.create}>
                <AppButton
                  onClick={() => nav.to("/configs/banner/manage-slide")}
                  size="small"
                  color="primary"
                >
                  <Plus className="tw:w-4 tw:h-4" />
                  Create Banner
                </AppButton>
              </Rbac>
            )}
          </div>

          <div className="tw:mt-4">
            <div>
              <div className="tw:mb-3">
                <h2 className="tw:text-base tw:font-semibold tw:text-slate-800">
                  Banner Configurations
                </h2>
                <p className="tw:text-xs tw:text-slate-500 tw:mt-0.5">
                  Manage banner placeholders and their slide configurations
                  across platforms
                </p>
              </div>

              <div className="tw:mb-3">
                <AppTab
                  tabs={tabs}
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                />
              </div>

              <FormProvider {...methods}>
                <Filter
                  callback={handleFilterChange}
                  filterCallback={handleFilterCallback}
                />
                <AppliedFilters />
              </FormProvider>

              <div className="tw:mb-3 tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:md:items-center tw:flex-wrap tw:gap-2">
                <div className="tw:flex-1 tw:hidden tw:md:block">
                  <PaginationSummary
                    paginationConfig={paginationRef.current}
                    loadingTotalRecords={loading}
                    loadedCount={items.length}
                    fwSize="sm"
                  />
                </div>

                <div className="tw:flex tw:gap-2 tw:items-center">
                  <ViewToggle viewType={view} callback={setView} />
                </div>
              </div>
            </div>

            {isMobile || view === "card" ? (
              <MobileView
                loading={loading}
                data={items}
                callback={itemCallback}
                showLoadMore={hasMoreData}
                loadingMore={loadingMore}
                loadMore={loadMore}
                totalCount={paginationRef.current.totalRecords}
                loadedCount={items.length}
              />
            ) : (
              <AppCard noPadding={true}>
                <DesktopView
                  loading={loading}
                  data={items}
                  callback={itemCallback}
                  showLoadMore={hasMoreData}
                  loadingMore={loadingMore}
                  loadMore={loadMore}
                  totalCount={paginationRef.current.totalRecords}
                  loadedCount={items.length}
                />
              </AppCard>
            )}
          </div>
        </div>
      </div>

      {isMobile && (
        <div className="app-footer tw:p-4 tw:text-end">
          <Rbac roles={rbacRoles.create}>
            <AppButton
              onClick={() => nav.to("/configs/banner/manage-slide")}
              size="large"
              color="primary"
            >
              <Plus className="tw:w-4 tw:h-4" />
              Create Banner
            </AppButton>
          </Rbac>
        </div>
      )}

      <ImgPreviewModal
        show={imgPreviewModal.show}
        callback={() => setImgPreviewModal({ show: false, images: [] })}
        images={imgPreviewModal.images}
      />

      <AppAlertDialog
        show={alertConfig.show}
        title={alertConfig.title}
        description={alertConfig.description}
        onConfirm={handleAlertConfirm}
        onCancel={handleAlertCancel}
      />

      <BusyLoader show={busyLoading} />
    </>
  );
}
