import {
  ArrowRight,
  ClipboardCheck,
  IndianRupee,
  Package,
  PackagePlus,
  CheckCircle2,
} from "lucide-react";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import Rbac from "~/components/core/rbac/Rbac";
import useAppNav from "~/hooks/useAppNav";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import InventoryTab from "../components/tab/InventoryTab";

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

  const bulkOptions = [
    {
      title: "Packaging",
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
      <div className="page-bg app-page tw:px-3 tw:pt-3 tw:pb-2 sm:tw:px-4 sm:tw:pt-4 sm:tw:pb-3">
        <div className="app-container tw:space-y-3">
          <div className="tw:space-y-1.5">
            <AppBreadcrumbs data={breadcrumbs} className="tw:!mb-0" />
            <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
              <span className="tw:inline-block tw:max-w-2xl tw:text-xs tw:leading-5 tw:text-slate-500">
                Choose a task and open the right bulk screen right away.
              </span>
            </div>
          </div>

          <InventoryTab activeTab="bulk-update" />

          <div className="tw:space-y-2">
            <div className="tw:grid tw:grid-cols-1 tw:gap-3 lg:tw:grid-cols-2">
              {bulkOptions.map((option) => (
                <Rbac roles={[option.rbacKey]} key={option.title}>
                  <button
                    type="button"
                    onClick={() => handleOptionClick(option.path)}
                    aria-label={`Open ${option.title}`}
                    className={`tw:group tw:flex tw:cursor-pointer tw:flex-col tw:overflow-hidden tw:rounded-xl tw:border tw:border-slate-200 tw:bg-gradient-to-br ${option.accent} tw:p-2.5 tw:text-left tw:shadow-sm tw:transition-all tw:duration-200 hover:tw:-translate-y-0.5 hover:tw:border-sky-200 hover:tw:shadow-md focus-visible:tw:outline-none focus-visible:tw:ring-2 focus-visible:tw:ring-sky-500 focus-visible:tw:ring-offset-2 sm:tw:p-3`}
                  >
                    <div className="tw:flex tw:items-start tw:gap-3">
                      <div className="tw:flex tw:min-w-0 tw:flex-1 tw:items-start tw:gap-3">
                        <div
                          className={`tw:flex tw:h-10 tw:w-10 tw:flex-shrink-0 tw:items-center tw:justify-center tw:rounded-xl tw:shadow-sm tw:transition-transform tw:group-hover:tw:scale-105 ${option.iconWrap}`}
                        >
                          {option.icon}
                        </div>

                        <div className="tw:min-w-0 tw:flex-1 tw:space-y-1">
                          <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-1.5">
                            <h3 className="tw:text-sm tw:font-semibold tw:text-slate-900">
                              {option.title}
                            </h3>
                            <span className="tw:inline-flex tw:items-center tw:rounded-full tw:border tw:border-slate-200 tw:bg-white/80 tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-500">
                              {option.hint}
                            </span>
                          </div>
                          <p className="tw:text-xs tw:leading-5 tw:text-slate-600">
                            {option.description}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="tw:h-[18px] tw:w-[18px] tw:flex-shrink-0 tw:text-slate-300 tw:transition-transform tw:duration-200 tw:group-hover:tw:translate-x-1 tw:group-hover:tw:text-slate-500" />
                    </div>
                  </button>
                </Rbac>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BulkUpdate;
