import {
  ArrowRight,
  ClipboardCheck,
  IndianRupee,
  Package,
  PackagePlus,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import Rbac from "~/components/core/rbac/Rbac";
import useAppNav from "~/hooks/useAppNav";
import useTheme from "~/hooks/useTheme";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import InventoryTab from "../components/tab/InventoryTab";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import CatalogSidePane from "~/shared/inventory/components/catalog-side-pane/CatalogSidePane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    langKey: "dashboard",
    redirect: { path: "/dashboard" },
  },
  { label: "Inventory", langKey: "inventory" },
  { label: "Bulk Update", langKey: "bulkUpdate" },
];

const BulkUpdate = () => {
  const appNav = useAppNav();
  const { t } = useTranslation(["common"]);
  const theme = useTheme();
  const isTheme2 = theme === "theme-2";

  const bulkOptions = [
    {
      title: "Sell By (Unit/Innercase/Case/Ladi)",
      description: "Change case and inner-case packing for products.",
      hint: "For pack setup",
      icon: <Package className="tw:w-5 tw:h-5 tw:text-blue-500" />,
      accent: "tw:from-blue-50 tw:to-sky-50",
      iconWrap: "tw:bg-blue-100 tw:text-blue-600",
      feature: "PackUpdate",
      path: "/configs/product-select?feature=PackUpdate&source=bulk-update",
      rbacKey: "INVENTORY.PACKTYPE-CONFIG",
    },
    {
      title: "Add Stock",
      description: "Upload stock for many products at once.",
      hint: "Add stock quickly",
      icon: <PackagePlus className="tw:w-5 tw:h-5 tw:text-emerald-500" />,
      accent: "tw:from-emerald-50 tw:to-teal-50",
      iconWrap: "tw:bg-emerald-100 tw:text-emerald-600",
      feature: "AddStock",
      path: "/dashboard/bulk-upload/add-stock?from=bulk-update",
      rbacKey: "CONFIGS.BULK-UPLOAD",
    },
    {
      title: "Update Price",
      description: "Change product prices for many items at once.",
      hint: "For price changes",
      icon: <IndianRupee className="tw:w-5 tw:h-5 tw:text-orange-500" />,
      accent: "tw:from-orange-50 tw:to-amber-50",
      iconWrap: "tw:bg-orange-100 tw:text-orange-600",
      feature: "Pricing",
      path: "/dashboard/bulk-upload/pricing?from=bulk-update",
      rbacKey: "CONFIGS.BULK-UPLOAD",
    },
    {
      title: "Stock Correction",
      description: "Correct stock counts for many products together.",
      hint: "For adjustments",
      icon: <ClipboardCheck className="tw:w-5 tw:h-5 tw:text-violet-500" />,
      accent: "tw:from-violet-50 tw:to-fuchsia-50",
      iconWrap: "tw:bg-violet-100 tw:text-violet-600",
      feature: "StockCorrection",
      path: "/dashboard/bulk-upload/stock-correction?from=bulk-update",
      rbacKey: "CONFIGS.BULK-UPLOAD",
    },
    // {
    //   title: "Stock Reservation",
    //   description:
    //     "Configure and manage stock reservation rules for your items.",
    //   icon: <ShieldCheck className="tw:w-5 tw:h-5 tw:text-emerald-500" />,
    //   bgColor: "tw:bg-emerald-50",
    //   borderColor: "tw:border-emerald-100",
    //   feature: "ReserveConfig",
    //   path: "/configs/product-select?feature=ReserveConfig&source=bulk-update",
    //   rbacKey: "INVENTORY.RESERVE-STOCK",
    // },
    // {
    //   title: "Promotional Deals",
    //   description:
    //     "Set up and manage promotional deals for your product catalog.",
    //   icon: <Tag className="tw:w-5 tw:h-5 tw:text-orange-500" />,
    //   bgColor: "tw:bg-orange-50",
    //   borderColor: "tw:border-orange-100",
    //   feature: "PromotionDealUpdate",
    //   path: "/configs/product-select?feature=PromotionDealUpdate&source=bulk-update",
    //   rbacKey: "INVENTORY.PROMOTIONAL-DEAL",
    // },
  ];

  const handleOptionClick = (path: string) => {
    appNav.to(path);
  };

  return (
    <>
      <AppHeader title="Bulk Update" />
      <div className="page-bg app-page page-padding">
        {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css). */}
        <SectionTabs
          sectionKey="catalog"
          activeTab="my-catalog"
          noShadow
          sticky
        />

        <div className="section-layout section-layout--tight">
          {/* Desktop-only left rail — catalog section side menu. */}
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="catalog"
                activeTab="my-catalog"
                title={t("manageCatalog", { ns: "menu" })}
              />
            </div>
          </aside>

          <div className="section-content app-container">
            <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start theme-2-mobile-gap-top">
              {/* Main column — spans the full grid (the side pane only exists
                  in theme-2 desktop, where the CSS lifts it out of the grid
                  into the fixed list pane; see AppPane / theme-2.css). */}
              <AppPaneMain className="tw:lg:col-span-12">
                <div className="tw:space-y-3">
                  {/* Breadcrumb + page hint — the theme-2 pane header carries
                      this context instead, so it's dropped there. */}
                  {!isTheme2 && (
                    <div className="tw:space-y-1.5">
                      <AppBreadcrumbs data={breadcrumbs} className="tw:!mb-0" />
                      <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
                        <span className="tw:inline-block tw:max-w-2xl tw:text-xs tw:leading-5 tw:text-slate-500">
                          Choose a task and open the right bulk screen right
                          away.
                        </span>
                      </div>
                    </div>
                  )}

                  <InventoryTab
                    activeTab="bulk-update"
                    className="hide-in-theme-2"
                  />
                  <div className="tw:grid tw:grid-cols-1 tw:gap-3 tw:lg:grid-cols-2">
                    {bulkOptions.map((option) => (
                      <Rbac roles={[option.rbacKey]} key={option.title}>
                        <button
                          type="button"
                          onClick={() => handleOptionClick(option.path)}
                          aria-label={`Open ${option.title}`}
                          className={`tw:group tw:relative tw:flex tw:h-full tw:w-full tw:cursor-pointer tw:flex-col tw:overflow-hidden tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-gradient-to-br ${option.accent} tw:p-3.5 tw:text-left tw:shadow-sm tw:transition-all tw:duration-200 tw:hover:-translate-y-0.5 tw:hover:border-sky-200 tw:hover:shadow-md tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-sky-500 tw:focus-visible:ring-offset-2`}
                        >
                          <div className="tw:flex tw:w-full tw:items-start tw:gap-3">
                            <div
                              className={`tw:flex tw:h-10 tw:w-10 tw:flex-shrink-0 tw:items-center tw:justify-center tw:rounded-xl tw:shadow-sm tw:transition-transform tw:duration-200 tw:group-hover:scale-105 ${option.iconWrap}`}
                            >
                              {option.icon}
                            </div>

                            <div className="tw:min-w-0 tw:flex-1">
                              <h3 className="tw:truncate tw:text-sm tw:font-semibold tw:text-slate-900">
                                {option.title}
                              </h3>
                              <p className="tw:mt-1 tw:text-xs tw:leading-5 tw:text-slate-600">
                                {option.description}
                              </p>
                            </div>

                            <ArrowRight className="tw:mt-0.5 tw:h-[18px] tw:w-[18px] tw:flex-shrink-0 tw:text-slate-300 tw:transition-transform tw:duration-200 tw:group-hover:translate-x-1 tw:group-hover:text-slate-500" />
                          </div>

                          <span className="tw:mt-3 tw:inline-flex tw:w-fit tw:items-center tw:gap-1 tw:rounded-full tw:border tw:border-slate-200 tw:bg-white/80 tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-500">
                            {option.hint}
                          </span>
                        </button>
                      </Rbac>
                    ))}
                  </div>
                </div>
              </AppPaneMain>

              {/* Side column — only rendered while the theme-2 split layout is
                  active (lg+), where the CSS re-homes it as the fixed catalog
                  list pane beside the icon rail. */}
              <AppPaneSide className="app-pane-only">
                <CatalogSidePane
                  scopeLabel="Bulk Update"
                  showInventoryValue={false}
                  showStockAlerts={false}
                />
              </AppPaneSide>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BulkUpdate;
