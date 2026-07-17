import { format, subMonths } from "date-fns";
import {
  ClipboardList,
  ClipboardPlus,
  Inbox,
  Network,
  PackageCheck,
  PackageSearch,
  ScanText,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppBadge from "~/components/core/badge/AppBadge";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import Rbac from "~/components/core/rbac/Rbac";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import useAppNav from "~/hooks/useAppNav";
import AuthService from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import { getNetworkPendingCount, getVendorPendingCount } from "./helper";

const rbacRoles = {
  createPO: ["PURCHASE-ORDER.CREATE"],
  viewVendors: ["VENDOR.VIEW"],
};

type PrimaryTile = {
  key: string;
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  gradient: string;
  iconColor: string;
  ring: string;
  aiPowered?: boolean;
  rbac?: string[];
  disabled?: boolean;
};

const PurchaseOrderMain = () => {
  const { t } = useTranslation(["common", "menu"]);
  const appNav = useAppNav();

  const canHandleB2B = AuthService.canHandleB2B();

  const [vendorPending, setVendorPending] = useState(0);
  const [networkPending, setNetworkPending] = useState(0);
  const [isCheckingPlan, setIsCheckingPlan] = useState(false);
  const [planAlertDialog, setPlanAlertDialog] = useState({
    show: false,
    title: "",
    description: "",
    onConfirm: () => {},
    onCancel: () => {},
  });

  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: "Dashboard",
      redirect: { path: "/dashboard" },
      langKey: "dashboard",
    },
    { label: "Purchase Orders", langKey: "purchaseOrders" },
  ];

  useEffect(() => {
    getVendorPendingCount().then(setVendorPending);
    if (canHandleB2B) {
      getNetworkPendingCount().then(setNetworkPending);
    }
  }, [canHandleB2B]);

  const handleCreatePurchaseOrder = async () => {
    setIsCheckingPlan(true);
    try {
      const planResp = await FranchiseService.getActivePlan();

      if (
        !planResp ||
        !planResp.isPlanActive ||
        planResp.availableAmount <= 0
      ) {
        setPlanAlertDialog({
          show: true,
          title: "Buy Platform Fee Plan",
          description:
            "You need an active platform fee plan to create a purchase order. Please subscribe to a plan to continue.",
          onConfirm: () => {
            setPlanAlertDialog((prev) => ({ ...prev, show: false }));
            appNav.to(FranchiseService.getBuyPlanLink());
          },
          onCancel: () => {
            setPlanAlertDialog((prev) => ({ ...prev, show: false }));
          },
        });
        return;
      }

      appNav.to("/dashboard/purchase-order/vendors", { from: "po" });
    } finally {
      setIsCheckingPlan(false);
    }
  };

  const goToAllPo = () => {
    const today = new Date();
    appNav.to("/dashboard/purchase-order/summary-po", {
      dateFrom: format(subMonths(today, 6), "yyyy-MM-dd"),
      dateTo: format(today, "yyyy-MM-dd"),
      groupByType: "total",
    });
  };

  const primaryTiles: PrimaryTile[] = [
    {
      key: "invoiceAi",
      icon: ScanText,
      title: t("invoiceAiTitle"),
      description: t("invoiceAiDescription"),
      onClick: () => appNav.to("/dashboard/scan/invoice-scan"),
      gradient: "tw:from-violet-50 tw:to-fuchsia-100/50",
      iconColor:
        "tw:bg-linear-to-br tw:from-fuchsia-500 tw:to-violet-600 tw:text-white",
      ring: "tw:hover:ring-violet-400/40",
      aiPowered: true,
    },
    {
      key: "createPo",
      icon: ClipboardPlus,
      title: t("createPO"),
      description: t("createPoDescription"),
      onClick: handleCreatePurchaseOrder,
      gradient: "tw:from-blue-50 tw:to-blue-100/50",
      iconColor: "tw:bg-blue-600 tw:text-white",
      ring: "tw:hover:ring-blue-400/40",
      rbac: rbacRoles.createPO,
      disabled: isCheckingPlan,
    },
    {
      key: "vendors",
      icon: Users,
      title: t("vendors"),
      description: t("vendorsDescription"),
      onClick: () => appNav.to("/dashboard/vendor/list", { from: "po" }),
      gradient: "tw:from-amber-50 tw:to-amber-100/50",
      iconColor: "tw:bg-amber-600 tw:text-white",
      ring: "tw:hover:ring-amber-400/40",
      rbac: rbacRoles.viewVendors,
    },
  ];

  type QuickLink = {
    key: string;
    icon: LucideIcon;
    title: string;
    description: string;
    onClick: () => void;
    accent: string;
    badge?: number;
    gated?: boolean;
  };

  const quickLinks: QuickLink[] = [
    {
      key: "vendorPurchase",
      icon: PackageSearch,
      title: t("vendorPurchase"),
      description: t("vendorPurchaseDesc"),
      onClick: () => appNav.to("/dashboard/purchase-order/summary"),
      accent:
        "tw:text-emerald-700 tw:bg-emerald-50 tw:group-hover:bg-emerald-100",
      badge: vendorPending,
    },
    {
      key: "networkPurchase",
      icon: Network,
      title: t("networkPurchase"),
      description: t("networkPurchaseDesc"),
      onClick: () => appNav.to("/dashboard/purchase-order/seller-summary"),
      accent: "tw:text-indigo-700 tw:bg-indigo-50 tw:group-hover:bg-indigo-100",
      badge: networkPending,
      gated: true,
    },
    {
      key: "allPo",
      icon: ClipboardList,
      title: t("allPurchaseOrders"),
      description: t("allPurchaseOrdersDesc"),
      onClick: goToAllPo,
      accent: "tw:text-sky-700 tw:bg-sky-50 tw:group-hover:bg-sky-100",
    },
    {
      key: "notReceived",
      icon: Inbox,
      title: t("notReceivedOrders"),
      description: t("notReceivedDesc"),
      onClick: () => appNav.to("/dashboard/purchase-order/not-received"),
      accent: "tw:text-rose-700 tw:bg-rose-50 tw:group-hover:bg-rose-100",
      badge: vendorPending,
    },
    {
      key: "recentlyReceived",
      icon: PackageCheck,
      title: t("recentlyReceived"),
      description: t("recentlyReceivedDesc"),
      onClick: () => appNav.to("/dashboard/purchase-order/recently-received"),
      accent: "tw:text-teal-700 tw:bg-teal-50 tw:group-hover:bg-teal-100",
    },
  ];

  const tileClassName = (tile: PrimaryTile) =>
    `tw:group tw:relative tw:flex tw:flex-col tw:text-left tw:cursor-pointer tw:bg-linear-to-br ${tile.gradient} tw:border tw:border-white tw:rounded-2xl tw:p-4 tw:md:p-5 tw:shadow-sm tw:ring-1 tw:ring-slate-200/70 tw:transition-all tw:hover:-translate-y-0.5 tw:hover:shadow-lg tw:hover:ring-2 tw:disabled:opacity-60 tw:disabled:cursor-not-allowed tw:disabled:hover:translate-y-0 ${tile.ring}`;

  const renderPrimaryTile = (tile: PrimaryTile) => {
    const { icon: Icon } = tile;
    const inner = (
      <button
        type="button"
        onClick={tile.onClick}
        disabled={tile.disabled}
        aria-label={tile.title}
        className={tileClassName(tile)}
      >
        {tile.aiPowered && (
          <span className="tw:absolute tw:top-2 tw:right-2 tw:inline-flex tw:items-center tw:gap-1 tw:rounded-full tw:bg-linear-to-r tw:from-fuchsia-600 tw:to-violet-600 tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:text-white tw:shadow-sm">
            <Sparkles className="tw:w-3 tw:h-3" />
            {t("new")}
          </span>
        )}
        <div
          className={`tw:flex tw:items-center tw:justify-center tw:w-11 tw:h-11 tw:md:w-12 tw:md:h-12 tw:rounded-xl tw:shadow-md tw:transition-transform tw:group-hover:scale-110 tw:group-hover:rotate-3 ${tile.iconColor}`}
        >
          <Icon className="tw:w-5 tw:h-5 tw:md:w-6 tw:md:h-6" />
        </div>
        <div className="tw:mt-3 tw:text-sm tw:md:text-base tw:font-semibold tw:text-slate-900">
          {tile.title}
        </div>
        <div className="tw:mt-0.5 tw:text-xs tw:md:text-sm tw:text-slate-600">
          {tile.description}
        </div>
      </button>
    );

    if (tile.rbac) {
      return (
        <Rbac key={tile.key} roles={tile.rbac}>
          {inner}
        </Rbac>
      );
    }
    return <div key={tile.key}>{inner}</div>;
  };

  return (
    <>
      <AppHeader
        title={t("purchaseOrders")}
        showAudioNote={true}
        audioNoteTitle={t("purchaseOrders")}
        audioFeature="po"
      />
      <div className="app-page page-bg page-padding">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} />

          {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css).
              `sticky` pins them under the header and breaks out of the page
              padding so the bottom border runs edge to edge. */}
          <SectionTabs
            sectionKey="supply"
            activeTab="supply"
            variant="chips"
            sticky
          />

          <div className="section-layout">
            {/* Desktop-only left rail — section side menu. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="supply"
                  activeTab="supply"
                  title={t("manageSupply", { ns: "menu" })}
                />
              </div>
            </aside>

            {/* Main content */}
            <div className="section-content">
              {/* Hero */}
              <div className="tw:relative tw:overflow-hidden tw:mt-2 tw:mb-6 tw:rounded-2xl tw:bg-primary tw:p-5 tw:md:p-7 tw:shadow-sm">
                <div className="tw:absolute tw:-right-12 tw:-top-12 tw:w-48 tw:h-48 tw:rounded-full tw:bg-white/10 tw:blur-2xl" />
                <div className="tw:absolute tw:-right-20 tw:bottom-0 tw:w-64 tw:h-64 tw:rounded-full tw:bg-white/10 tw:blur-3xl" />
                <div className="tw:relative">
                  <h1 className="tw:text-xl tw:md:text-2xl tw:font-bold tw:text-primary-foreground">
                    {t("poHubHeroTitle")}
                  </h1>
                  <p className="tw:mt-1.5 tw:text-sm tw:text-primary-foreground/80 tw:max-w-2xl">
                    {t("poHubHeroSubtitle")}
                  </p>
                </div>
              </div>

              {/* Primary tiles */}
              <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-3 tw:gap-3 tw:md:gap-4">
                {primaryTiles.map(renderPrimaryTile)}
              </div>

              {/* Manage & track */}
              <div className="tw:mt-8">
                <div className="tw:flex tw:items-center tw:gap-3 tw:mb-3">
                  <h2 className="tw:text-sm tw:md:text-base tw:font-semibold tw:text-slate-700">
                    {t("poHubManageHeading")}
                  </h2>
                  <div className="tw:flex-1 tw:h-px tw:bg-linear-to-r tw:from-slate-200 tw:to-transparent" />
                </div>
                <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:lg:grid-cols-3 tw:gap-3">
                  {quickLinks
                    .filter((link) => !link.gated || canHandleB2B)
                    .map(
                      ({
                        key,
                        icon: Icon,
                        title,
                        description,
                        onClick,
                        accent,
                        badge,
                      }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={onClick}
                          aria-label={title}
                          className="tw:group tw:relative tw:flex tw:items-center tw:gap-3 tw:cursor-pointer tw:bg-white tw:border tw:border-slate-200 tw:rounded-xl tw:p-3 tw:md:p-4 tw:text-left tw:hover:shadow-sm tw:hover:border-slate-300 tw:transition-all"
                        >
                          <div
                            className={`tw:relative tw:flex tw:items-center tw:justify-center tw:w-10 tw:h-10 tw:rounded-lg tw:transition-colors ${accent}`}
                          >
                            <Icon className="tw:w-5 tw:h-5" />
                            {badge && badge > 0 ? (
                              <AppBadge
                                variant="danger"
                                className="tw:absolute tw:-top-2 tw:-right-2"
                              >
                                <span className="tw:text-[10px] tw:font-bold">
                                  {badge}
                                </span>
                              </AppBadge>
                            ) : null}
                          </div>
                          <div className="tw:min-w-0 tw:flex-1">
                            <div className="tw:text-sm tw:font-semibold tw:text-slate-800 tw:leading-tight">
                              {title}
                            </div>
                            <div className="tw:mt-0.5 tw:text-xs tw:text-slate-500 tw:leading-tight">
                              {description}
                            </div>
                          </div>
                        </button>
                      ),
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AppAlertDialog
        title={planAlertDialog.title}
        description={planAlertDialog.description}
        show={planAlertDialog.show}
        onConfirm={planAlertDialog.onConfirm}
        onCancel={planAlertDialog.onCancel}
      />
    </>
  );
};

export default PurchaseOrderMain;
