import { useRef } from "react";
import { useTranslation } from "react-i18next";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import useAppNav from "~/hooks/useAppNav";
import SectionTabService from "~/services/SectionTabService";
import PlatformFeeSidePane from "~/shared/accounts/platform-fee/side-pane/PlatformFeeSidePane";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import BenefitsComboBanner from "./components/BenefitsComboBanner";
import BenefitsHeroSection from "./components/BenefitsHeroSection";
import BenefitsSwaMatcher from "./components/BenefitsSwaMatcher";
import BenefitsPerksBreakdown from "./components/perks-breakdown/BenefitsPerksBreakdown";
import BenefitsPlanShapes from "./components/plan-shapes/BenefitsPlanShapes";

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
    label: "Benefits",
    langKey: "benefits",
  },
];

export default function PlatformFeeBenefits() {
  const { t } = useTranslation(["common", "menu"]);
  const appNav = useAppNav();
  const matcherRef = useRef<HTMLDivElement>(null);

  const navigateToPlans = (category?: string) =>
    appNav.to("/dashboard/accounts/platform-fee", {
      tab: "commission-invoices",
      subtab: "available-plans",
      skipBenefits: "true",
      ...(category ? { category } : {}),
    });

  const scrollToMatcher = () => {
    matcherRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <AppHeader
        title="Platform Fee Benefits"
        sectionKey="business"
        activeTab="platform-fee"
        mobileLead="menu"
      />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css). */}
          <SectionTabs
            tabs={SectionTabService.getPlatformFeeTabs()}
            activeTab="overview"
            noShadow
            sticky
          />

          <div className="section-layout">
            {/* Desktop-only left rail — section side menu. */}
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
                {/* Main column */}
                <AppPaneMain className="tw:lg:col-span-12">
                  <AppBreadcrumbs data={breadcrumbs} />

                  <div className="tw:space-y-8 tw:mt-4 tw:pb-12">
                    {/* 1. Hero Banner */}
                    <BenefitsHeroSection
                      onShowMatch={scrollToMatcher}
                      onCompareTiers={() => navigateToPlans()}
                      onAskSwa={scrollToMatcher}
                    />

                    {/* 2. Pick the shape that fits your shop */}
                    <BenefitsPlanShapes
                      onExploreStock={() => navigateToPlans("stock")}
                      onExploreShop={() => navigateToPlans("shop")}
                    />

                    {/* 3. Combo Discount Banner */}
                    {/* <BenefitsComboBanner /> */}

                    {/* 4. Two Sliders / Matcher */}
                    <div ref={matcherRef}>
                      <BenefitsSwaMatcher
                        onCheckout={() => navigateToPlans()}
                        onAskSwa={scrollToMatcher}
                      />
                    </div>

                    {/* 5. What actually comes in the box / Perks breakdown */}
                    <BenefitsPerksBreakdown onAskSwa={scrollToMatcher} />
                  </div>
                </AppPaneMain>

                {/* Side column */}
                <AppPaneSide className="app-pane-only">
                  <PlatformFeeSidePane />
                </AppPaneSide>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* <div className="app-footer tw:flex tw:justify-end">
        <AppButton
          color="success"
          size="large"
          onClick={() => navigateToPlans()}
          className="tw:w-full tw:md:w-auto"
        >
          View All Plans
          <ArrowRight className="tw:w-4 tw:h-4" />
        </AppButton>
      </div> */}
    </>
  );
}
