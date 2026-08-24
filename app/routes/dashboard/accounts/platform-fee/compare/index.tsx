import { useTranslation } from "react-i18next";
import { useLocation, useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import useAppNav from "~/hooks/useAppNav";
import SectionTabService from "~/services/SectionTabService";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import CompareHeroHeader from "./components/hero-header/CompareHeroHeader";
import CompareShapesVsTable from "./components/shapes-vs-table/CompareShapesVsTable";
import PlanList from "./components/plan-list/PlanList";
import {
  BILLING_CYCLE_PARAM,
  getBillingCycle,
  type BillingCycle,
} from "./components/helper";
import CompareSidePane from "./components/side-pane/CompareSidePane";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    langKey: "dashboard",
    redirect: { path: "/dashboard" },
  },
  {
    label: "Accounts Summary",
    langKey: "accountsSummary",
    redirect: {
      path: "/dashboard/accounts/platform-fee",
      params: { tab: "commission-invoices" },
    },
  },
  {
    label: "Compare",
    langKey: "compare",
  },
];

export default function PlatformFeeCompare() {
  const { t } = useTranslation(["common", "menu"]);
  const appNav = useAppNav();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  /* The selected cycle lives in the URL so a shared/reloaded link opens on the
     same pricing the sender was looking at. */
  const billingCycle = getBillingCycle(searchParams.get(BILLING_CYCLE_PARAM));

  /** Cycle changes replace the entry so back leaves the page, not the toggle. */
  const handleBillingCycleChange = (cycle: BillingCycle) => {
    appNav.replace(
      location.pathname,
      {
        ...Object.fromEntries(searchParams.entries()),
        [BILLING_CYCLE_PARAM]: cycle,
      },
      { preventScrollReset: true },
    );
  };

  const handleAskSwa = () => {
    appNav.to("/dashboard");
  };

  return (
    <>
      <AppHeader
        title="Compare Plans"
        sectionKey="business"
        activeTab="platform-fee"
        mobileLead="menu"
      />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css).
              Carries the platform fee surfaces; switching section is the
              header title dropdown's job. */}
          <SectionTabs
            tabs={SectionTabService.getPlatformFeeTabs()}
            activeTab="compare"
            noShadow
            sticky
          />

          <div className="section-layout">
            {/* Desktop-only left rail — section side menu */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="business"
                  activeTab="platform-fee"
                  title={t("manageBusiness", { ns: "menu" })}
                />
              </div>
            </aside>

            <div className="section-content">
              <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start theme-2-mobile-gap-top">
                {/* Main Column */}
                <AppPaneMain className="tw:lg:col-span-12">
                  <AppBreadcrumbs data={breadcrumbs} />

                  <div className="tw:space-y-6 tw:mt-4 tw:pb-12">
                    {/* 1. Header & Billing Cycle Toggle */}
                    <CompareHeroHeader
                      billingCycle={billingCycle}
                      onBillingCycleChange={handleBillingCycleChange}
                    />

                    {/* 2. Side-by-Side VS Comparison Table */}
                    <CompareShapesVsTable />

                    {/* 3. Tier Section Header */}
                    <div className="tw:flex tw:flex-col tw:sm:flex-row tw:sm:items-baseline tw:justify-between tw:gap-2 tw:[&+*]:mt-0!">
                      <h2 className="tw:font-serif tw:text-2xl tw:sm:text-3xl tw:font-bold tw:text-[#183B47]">
                        Tier-by-tier ·{" "}
                        <span className="tw:font-normal tw:italic">
                          every price on one page
                        </span>
                      </h2>
                      <span className="tw:text-xs tw:font-semibold tw:tracking-wider tw:text-slate-500 tw:uppercase">
                        GST INCLUDED · SETUP ONE-TIME
                      </span>
                    </div>

                    {/* 4. Stock Tiers — swiper rail */}
                    <PlanList type="stock" billingCycle={billingCycle} />

                    {/* 5. Shop Tiers — grid */}
                    <PlanList type="shop" billingCycle={billingCycle} />
                  </div>
                </AppPaneMain>

                {/* Side Pane Column */}
                <AppPaneSide className="app-pane-only">
                  <CompareSidePane
                    billingCycle={billingCycle}
                    onAskSwa={handleAskSwa}
                  />
                </AppPaneSide>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
