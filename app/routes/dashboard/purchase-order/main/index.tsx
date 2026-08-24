import { format, subMonths } from "date-fns";
import {
  ChevronRight,
  ClipboardList,
  ClipboardPlus,
  // FileText,
  Inbox,
  Network,
  PackageCheck,
  PackageSearch,
  ScanText,
  Sparkles,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import Rbac from "~/components/core/rbac/Rbac";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import PoSectionTabs from "~/shared/purchase-order/components/PoSectionTabs";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import PurchaseOrderSidePane from "~/shared/purchase-order/components/purchase-order-side-pane/PurchaseOrderSidePane";
import useAppNav from "~/hooks/useAppNav";
import AuthService from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import {
  // getActivePoCount,
  // getArrivingTodayPoCount,
  getNetworkPendingCount,
  // getReorderSkuCount,
  getSkWalletBalance,
  getVendorPendingCount,
} from "./helper";

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
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  // const [reorderSkuCount, setReorderSkuCount] = useState(0);
  // const [activePoCount, setActivePoCount] = useState(0);
  // const [arrivingTodayCount, setArrivingTodayCount] = useState(0);
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
    getSkWalletBalance().then(setWalletBalance);
    // getReorderSkuCount().then(setReorderSkuCount);
    // getActivePoCount().then(setActivePoCount);
    // getArrivingTodayPoCount().then(setArrivingTodayCount);
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
      gradient: "tw:from-emerald-50 tw:to-emerald-100/50",
      iconColor: "tw:bg-primary tw:text-primary-foreground",
      ring: "tw:hover:ring-emerald-400/40",
      rbac: rbacRoles.createPO,
      disabled: isCheckingPlan,
    },
    {
      key: "vendors",
      icon: Users,
      title: t("vendors"),
      description: t("vendorsDescription"),
      onClick: () => appNav.to("/dashboard/vendor/list", { from: "po" }),
      gradient: "tw:from-orange-50 tw:to-orange-100/50",
      iconColor: "tw:bg-orange-600 tw:text-white",
      ring: "tw:hover:ring-orange-400/40",
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
      key: "allPo",
      icon: ClipboardList,
      title: t("allPurchaseOrders"),
      description: t("allPurchaseOrdersDesc"),
      onClick: goToAllPo,
      accent: "tw:text-slate-600 tw:bg-slate-100 tw:group-hover:bg-slate-200",
    },
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
      accent: "tw:text-blue-700 tw:bg-blue-50 tw:group-hover:bg-blue-100",
      badge: networkPending,
      gated: true,
    },
    {
      key: "notReceived",
      icon: Inbox,
      // Matches the "Inward" header/tab wording used on the not-received page.
      title: "Inward",
      description: t("notReceivedDesc"),
      onClick: () => appNav.to("/dashboard/purchase-order/not-received"),
      accent: "tw:text-orange-700 tw:bg-orange-50 tw:group-hover:bg-orange-100",
      badge: vendorPending,
    },
    {
      key: "recentlyReceived",
      icon: PackageCheck,
      title: t("recentlyReceived"),
      description: t("recentlyReceivedDesc"),
      onClick: () => appNav.to("/dashboard/purchase-order/recently-received"),
      accent:
        "tw:text-emerald-700 tw:bg-emerald-50 tw:group-hover:bg-emerald-100",
    },
  ];

  const tileClassName = (tile: PrimaryTile) =>
    `tw:group tw:relative tw:flex tw:items-center tw:gap-3 tw:cursor-pointer tw:bg-linear-to-br ${tile.gradient} tw:border tw:border-white/70 tw:rounded-xl tw:p-3 tw:md:p-4 tw:text-left tw:shadow-sm tw:ring-1 tw:ring-slate-200/60 tw:transition-all tw:hover:shadow-md tw:hover:ring-2 tw:disabled:opacity-60 tw:disabled:cursor-not-allowed tw:disabled:hover:translate-y-0 ${tile.ring}`;

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
        <div
          className={`tw:flex tw:shrink-0 tw:items-center tw:justify-center tw:w-10 tw:h-10 tw:rounded-lg tw:shadow-sm tw:transition-transform tw:group-hover:scale-110 ${tile.iconColor}`}
        >
          <Icon className="tw:w-5 tw:h-5" />
        </div>
        <div className="tw:min-w-0 tw:flex-1">
          <div className="tw:flex tw:items-center tw:gap-2">
            <div className="tw:text-sm tw:font-semibold tw:text-slate-900">
              {tile.title}
            </div>
            {tile.aiPowered && (
              <span className="tw:inline-flex tw:shrink-0 tw:items-center tw:gap-1 tw:rounded-full tw:bg-linear-to-r tw:from-fuchsia-600 tw:to-violet-600 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:text-white tw:shadow-sm">
                <Sparkles className="tw:w-3 tw:h-3" />
                {t("new")}
              </span>
            )}
          </div>
          <div className="tw:mt-0.5 tw:text-xs tw:text-slate-500 tw:leading-tight tw:line-clamp-1">
            {tile.description}
          </div>
        </div>
        <ChevronRight className="tw:shrink-0 tw:w-5 tw:h-5 tw:text-slate-400 tw:transition-transform tw:group-hover:translate-x-0.5" />
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
        sectionKey="supply"
        activeTab="purchase-orders"
        mobileLead="menu"
        title={t("purchaseOrders")}
        showAudioNote={true}
        audioNoteTitle={t("purchaseOrders")}
        audioFeature="po"
      />
      <div className="app-page page-bg page-padding">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} />

          {/* PO tab bar — theme-2 mobile only (see theme-2.css). */}
          <PoSectionTabs />

          <div className="section-layout">
            {/* Desktop-only left rail — section side menu. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="supply"
                  activeTab="purchase-orders"
                  title={t("manageSupply", { ns: "menu" })}
                />
              </div>
            </aside>

            {/* Main content */}
            <div className="section-content">
              <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
                <AppPaneMain className="tw:lg:col-span-12">
                  {/* Hero */}
                  <div className="tw:relative tw:overflow-hidden tw:mt-2 tw:mb-4 tw:rounded-2xl tw:bg-primary tw:p-5 tw:md:p-7 tw:shadow-sm">
                    <div className="tw:absolute tw:-right-12 tw:-top-12 tw:w-48 tw:h-48 tw:rounded-full tw:bg-white/10 tw:blur-2xl" />
                    <div className="tw:absolute tw:-right-20 tw:bottom-0 tw:w-64 tw:h-64 tw:rounded-full tw:bg-white/10 tw:blur-3xl" />
                    <div className="tw:relative tw:flex tw:flex-wrap tw:items-start tw:justify-between tw:gap-4">
                      <div className="tw:min-w-0">
                        <h1 className="app-heading-serif tw:text-2xl tw:md:text-3xl tw:font-bold tw:text-primary-foreground">
                          {t("poHubHeroTitle")}
                        </h1>
                        <p className="tw:mt-1.5 tw:text-sm tw:text-primary-foreground/80 tw:max-w-2xl">
                          {t("poHubHeroSubtitle")}
                        </p>
                      </div>
                      {walletBalance !== null && (
                        <button
                          type="button"
                          onClick={() =>
                            appNav.to("/dashboard/accounts/sk-statement")
                          }
                          aria-label={t("skWallet")}
                          className="tw:flex tw:cursor-pointer tw:items-center tw:gap-2.5 tw:rounded-xl tw:bg-white/10 tw:px-3.5 tw:py-2.5 tw:ring-1 tw:ring-white/25 tw:transition-colors tw:hover:bg-white/15"
                        >
                          <Wallet className="tw:w-5 tw:h-5 tw:text-primary-foreground/80" />
                          <span className="tw:text-left">
                            <span className="app-label tw:block tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-primary-foreground/70">
                              {t("skWallet")}
                            </span>
                            <Amount
                              value={walletBalance}
                              className="tw:block tw:text-base tw:font-bold tw:leading-tight tw:text-primary-foreground"
                            />
                          </span>
                          <ChevronRight className="tw:w-4 tw:h-4 tw:text-primary-foreground/60" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Reorder banner — only when SKUs actually need restocking */}
                  {/* {reorderSkuCount > 0 && (
                    <button
                      type="button"
                      onClick={() => appNav.to("/dashboard/inventory/dashboard")}
                      aria-label={t("reorderToday")}
                      className="tw:group tw:mb-6 tw:flex tw:w-full tw:items-center tw:gap-3 tw:cursor-pointer tw:rounded-2xl tw:border tw:border-amber-200 tw:bg-amber-50 tw:p-3.5 tw:md:p-4 tw:text-left tw:transition-all tw:hover:border-amber-300 tw:hover:shadow-sm"
                    >
                      <div className="tw:flex tw:shrink-0 tw:items-center tw:justify-center tw:w-10 tw:h-10 tw:rounded-xl tw:bg-amber-400 tw:text-white tw:shadow-sm">
                        <Zap className="tw:w-5 tw:h-5" />
                      </div>
                      <div className="tw:min-w-0 tw:flex-1">
                        <div className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wider tw:text-amber-700">
                          {t("reorderToday")}
                        </div>
                        <div className="tw:mt-0.5 tw:text-sm tw:font-semibold tw:text-amber-900">
                          {t("skusRunOutThisWeek", { count: reorderSkuCount })}
                        </div>
                      </div>
                      <span className="tw:inline-flex tw:shrink-0 tw:items-center tw:gap-1 tw:text-xs tw:font-semibold tw:text-amber-800">
                        {t("view")}
                        <ArrowRight className="tw:w-3.5 tw:h-3.5 tw:transition-transform tw:group-hover:translate-x-0.5" />
                      </span>
                    </button>
                  )} */}

                  {/* Purchase orders status row */}
                  {/* <div className="tw:mb-8">
                    <button
                      type="button"
                      onClick={goToAllPo}
                      aria-label={t("purchaseOrders")}
                      className="tw:group tw:flex tw:w-full tw:items-center tw:gap-3 tw:cursor-pointer tw:bg-white tw:border tw:border-slate-200 tw:rounded-2xl tw:p-3.5 tw:md:p-4 tw:text-left tw:hover:border-slate-300 tw:hover:shadow-sm tw:transition-all"
                    >
                      <div className="tw:flex tw:shrink-0 tw:items-center tw:justify-center tw:w-11 tw:h-11 tw:rounded-xl tw:bg-emerald-100 tw:text-emerald-700 tw:transition-transform tw:group-hover:scale-105">
                        <FileText className="tw:w-5 tw:h-5" />
                      </div>
                      <div className="tw:min-w-0 tw:flex-1">
                        <div className="tw:text-sm tw:font-bold tw:text-slate-900">
                          {t("purchaseOrders")}
                        </div>
                        <div className="tw:mt-0.5 tw:text-xs tw:text-slate-500">
                          {t("poActiveArriving", {
                            active: activePoCount,
                            arriving: arrivingTodayCount,
                          })}
                        </div>
                      </div>
                      <ChevronRight className="tw:w-4 tw:h-4 tw:shrink-0 tw:text-slate-400 tw:transition-transform tw:group-hover:translate-x-0.5" />
                    </button>
                  </div> */}

                  {/* Primary tiles */}
                  <div className="tw:mt-6 tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-3">
                    {primaryTiles.map(renderPrimaryTile)}
                  </div>

                  {/* Manage & track */}
                  <div className="tw:mt-8 tw:mb-4">
                    <div className="tw:flex tw:items-center tw:gap-3 tw:mb-3">
                      <h2 className="app-label tw:text-xs tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-500">
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
                                <div className="tw:text-sm tw:font-bold tw:text-slate-800 tw:leading-tight">
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
                </AppPaneMain>

                <AppPaneSide className="app-pane-only">
                  <PurchaseOrderSidePane />
                </AppPaneSide>
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
