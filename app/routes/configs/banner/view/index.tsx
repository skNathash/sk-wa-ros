import { CircleCheck, CircleX, ImageOff, Pencil } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppBadge from "~/components/core/badge/AppBadge";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import ImgRender from "~/components/core/img/ImgRender";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppTab from "~/components/core/tab/AppTab";
import { ALERT_DISMISS_TIME } from "~/constants";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import BannerService from "~/services/BannerService";
import type { BreadcrumbItem, TabItem } from "~/types/CommonTypes";
import AuditLogTab from "./components/AuditLogTab";
import DetailsTab from "./components/DetailsTab";
import EditBannerModal from "./modals/EditBannerModal";
import PageAccessService from "~/services/PageAccessService";
import Rbac from "~/components/core/rbac/Rbac";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["BANNER.BANNER-VIEW"]);
}

const rbacRoles = {
  update: ["BANNER.BANNER-UPDATE"],
};

const bannerTypeToRedirectionType: Record<string, string> = {
  NoAction: "no_action",
  Brand: "brand",
  Category: "category",
  Product: "product",
  BrandCategory: "brand_category",
  Keywords: "keywords",
  Menu: "menu",
};

const breadcrumbs: BreadcrumbItem[] = [
  { label: "Dashboard", langKey: "dashboard", redirect: { path: "/dashboard" } },
  { label: "Banner Config", redirect: { path: "/configs/banner" } },
  { label: "View" },
];

const viewTabs: TabItem[] = [
  { key: "details", name: "Details" },
  { key: "audit-log", name: "Audit Log" },
];

export default function BannerView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useAppToast();
  const { isMobile } = useScreenView();
  const id = searchParams.get("id") || "";

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busyLoading, setBusyLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    show: boolean;
    title: string;
    description: string;
    action: "active" | "inactive" | null;
  }>({ show: false, title: "", description: "", action: null });
  const [showEditModal, setShowEditModal] = useState(false);

  const activeTab = searchParams.get("viewTab") || "details";

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await BannerService.detail(id);
      setData(res.data?.data || res.data || null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusAction = (action: "active" | "inactive") => {
    setAlertConfig({
      show: true,
      title: action === "active" ? "Mark as Active" : "Mark as Inactive",
      description: `Are you sure you want to mark this banner as ${action === "active" ? "Active" : "Inactive"}?`,
      action,
    });
  };

  const handleAlertConfirm = async () => {
    const action = alertConfig.action;
    setAlertConfig((prev) => ({ ...prev, show: false }));

    setTimeout(async () => {
      try {
        setBusyLoading(true);
        const payload: Record<string, any> = {
          isActive: action === "active",
        };
        if (data?.placeholderInfo?.id) {
          payload.placeholderId = data.placeholderInfo.id;
        }
        if (data?.bannerType) {
          payload.bannerType = data.bannerType;
        }
        const res = await BannerService.update(id, payload);

        if (res && (res.statusCode === 200 || res.statusCode === 201)) {
          toast.show({
            msg: `Banner marked as ${action === "active" ? "Active" : "Inactive"} successfully`,
            color: "success",
          });
          fetchData();
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
    setAlertConfig((prev) => ({ ...prev, show: false, action: null }));
  };

  const renderActionButtons = () => (
    <Rbac roles={rbacRoles.update}>
      {data.isActive ? (
        <AppButton
          color="danger"
          size="small"
          fill="outline"
          onClick={() => handleStatusAction("inactive")}
        >
          <CircleX size={15} />
          Mark as Inactive
        </AppButton>
      ) : (
        <AppButton
          color="success"
          size="small"
          fill="outline"
          onClick={() => handleStatusAction("active")}
        >
          <CircleCheck size={15} />
          Mark as Active
        </AppButton>
      )}
      <AppButton
        color="primary"
        size="small"
        fill="outline"
        onClick={() => setShowEditModal(true)}
      >
        <Pencil size={15} />
        Edit
      </AppButton>
    </Rbac>
  );

  const handleEditCallback = (result: { action: string; data: any }) => {
    setShowEditModal(false);
    if (result.action === "success") {
      fetchData();
    }
  };

  const handleTabChange = (tab: TabItem) => {
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (tab.key === "details") p.delete("viewTab");
        else p.set("viewTab", tab.key);
        return p;
      },
      { replace: true } as any,
    );
  };

  if (loading) {
    return (
      <>
        <AppHeader title="Banner Details" />
        <div className="app-page page-bg tw:p-4">
          <div className="app-container tw:flex tw:justify-center tw:py-20">
            <AppSpinner />
          </div>
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <AppHeader title="Banner Details" />
        <div className="app-page page-bg tw:p-4">
          <div className="app-container">
            <AppBreadcrumbs data={breadcrumbs} className="tw:mb-4" />
            <AppCard>
              <NoData />
            </AppCard>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader title="Banner Details" />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          <div className="tw:flex tw:items-center tw:justify-between tw:mb-4">
            <AppBreadcrumbs data={breadcrumbs} />
            {!isMobile && (
              <div className="tw:flex tw:items-center tw:gap-2">
                {renderActionButtons()}
              </div>
            )}
          </div>

          {/* Header */}
          <AppCard className="tw:mb-4">
            <div className={`tw:flex tw:gap-4 ${isMobile ? "tw:flex-col tw:items-center tw:text-center" : "tw:items-start"}`}>
              <div className={`tw:rounded-md tw:overflow-hidden tw:bg-slate-100 tw:flex tw:items-center tw:justify-center tw:shrink-0 ${isMobile ? "tw:w-full tw:h-32" : "tw:w-24 tw:h-16"}`}>
                {data.bannerImage?.assetId ? (
                  <ImgRender
                    assetId={data.bannerImage.assetId}
                    className="tw:w-full tw:h-full tw:object-cover"
                    alt={data.title}
                  />
                ) : (
                  <ImageOff className="tw:w-6 tw:h-6 tw:text-slate-400" />
                )}
              </div>
              <div className="tw:flex-1 tw:min-w-0">
                <div className={`tw:flex tw:gap-2 tw:flex-wrap ${isMobile ? "tw:justify-center" : "tw:items-center"}`}>
                  <h2 className="tw:text-lg tw:font-semibold tw:text-slate-900">
                    {data.title}
                  </h2>
                  <AppBadge variant={BannerService.getStatusBadgeColor(data.status) as any}>
                    {data.status}
                  </AppBadge>
                  <AppBadge variant={data.isActive ? "success" : "danger"}>
                    {data.isActive ? "Active" : "Inactive"}
                  </AppBadge>
                </div>
                <div className={`tw:flex tw:items-center tw:gap-3 tw:text-xs tw:text-slate-500 tw:mt-1 ${isMobile ? "tw:justify-center tw:flex-wrap" : ""}`}>
                  <span>{data.bannerId}</span>
                  <span>|</span>
                  <span>{data.type}</span>
                  <span>|</span>
                  <span>Priority: {data.priority}</span>
                </div>
              </div>
            </div>
          </AppCard>

          {/* Tabs */}
          <div className="tw:mb-4">
            <AppTab
              tabs={viewTabs}
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          </div>

          {activeTab === "details" ? (
            <DetailsTab data={data} />
          ) : (
            <AuditLogTab logs={data.auditLog || []} />
          )}
        </div>
      </div>

      {isMobile && (
        <div className="app-footer tw:p-4">
          <div className="tw:flex tw:items-center tw:gap-2">
            {renderActionButtons()}
          </div>
        </div>
      )}

      <AppAlertDialog
        show={alertConfig.show}
        title={alertConfig.title}
        description={alertConfig.description}
        onConfirm={handleAlertConfirm}
        onCancel={handleAlertCancel}
      />

      <EditBannerModal
        show={showEditModal}
        callback={handleEditCallback}
        bannerId={id}
        initialData={{
          validityFrom: data?.validFrom,
          validityTo: data?.validTo,
          priority: data?.priority,
          type: data?.type,
          placeholderId: data?.placeholderInfo?.id,
          bannerType: data?.bannerType,
          redirectionType: bannerTypeToRedirectionType[data?.bannerType] || "no_action",
          brands: (data?.bannerForCondition?.brands || []).map((b: any) => ({
            label: b.name,
            value: { id: b.id, brandId: b.brandId, name: b.name },
          })),
          categories: (data?.bannerForCondition?.categories || []).map((c: any) => ({
            label: c.name,
            value: { id: c.id, name: c.name },
          })),
          products: (data?.bannerForCondition?.deals || []).map((p: any) => ({
            label: p.name,
            value: { id: p.id, name: p.name },
          })),
          menus: (data?.bannerForCondition?.menus || []).map((m: any) => ({
            label: m.name,
            value: { id: m.id, name: m.name },
          })),
          keywords: data?.bannerForCondition?.keyword || "",
        }}
      />

      <BusyLoader show={busyLoading} />
    </>
  );
}
