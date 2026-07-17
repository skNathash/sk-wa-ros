import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import ListSummary from "../components/ListSummary";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import ListTab from "../components/ListTab";
import AnalyticsSummary from "./components/AnalyticsSummary";
import TopPerformers from "./components/TopPerformers";
import FinancialOverview from "./components/FinancialOverview";
import AttentionRequired from "./components/AttentionRequired";
import AppButton from "~/components/core/button/AppButton";
import { Plus } from "lucide-react";
import useAppNav from "~/hooks/useAppNav";
import { useTranslation } from "react-i18next";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    langKey: "dashboard",
    redirect: { path: "/dashboard" },
  },
  { label: "Vendor Analytics", langKey: "vendorAnalytics" },
];

const Analytics = () => {
  const appNav = useAppNav();
  const { t } = useTranslation(["common"]);

  return (
    <>
      <AppHeader title={t("vendorAnalytics")} />
      <div className="page-bg tw:p-4 app-page">
        <div className="app-container">
          <div className="tw:flex tw:justify-between tw:items-center tw:mb-4">
            <div>
              <AppBreadcrumbs data={breadcrumbs} />
              <div className="tw:text-sm tw:text-gray-500">
                {t("vendorAnalyticsDescription")}
              </div>
            </div>
            <AppButton
              color="primary"
              className="tw:text-white"
              onClick={() => appNav.to("/dashboard/vendor/manage")}
            >
              <Plus className="tw:w-4 tw:h-4" />
              {t("addVendor")}
            </AppButton>
          </div>

          <ListSummary className="tw:mb-4" />
          {/* <ListTab activeTab="analytics" className="tw:mb-4" /> */}
          <AnalyticsSummary className="tw:mb-4" />

          <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
            <TopPerformers />
            <FinancialOverview />
            <AttentionRequired />
          </div>
        </div>
      </div>
    </>
  );
};

export default Analytics;
