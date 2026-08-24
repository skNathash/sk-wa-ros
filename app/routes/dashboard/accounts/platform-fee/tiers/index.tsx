import { useEffect, useMemo, useState } from "react";
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
import CommonService from "~/services/CommonService";
import {
  BILLING_CYCLE_PARAM,
  getBillingCycle,
  getData,
  getTierType,
  prepareParams,
  TIER_TYPE_PARAM,
  type BillingCycle,
  type TierCardData,
  type TierType,
} from "./components/helper";
import { toSidePaneTiers } from "./components/side-pane/helper";
import TiersGrid from "./components/TiersGrid";
import TiersHeroHeader from "./components/TiersHeroHeader";
import TiersRolloverBanner from "./components/TiersRolloverBanner";
import TiersSidePane from "./components/side-pane/TiersSidePane";

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
    label: "Tiers",
    langKey: "tiers",
  },
];

export default function PlatformFeeTiers() {
  const { t } = useTranslation(["common", "menu", "platformFee"]);
  const appNav = useAppNav();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [tiers, setTiers] = useState<Record<TierType, TierCardData[]>>({
    stock: [],
    shop: [],
  });
  const [loading, setLoading] = useState(true);

  /* Both the shape and the billing cycle live in the URL so a shared or
     reloaded link opens on the same tiers the sender was looking at. */
  const billingCycle = getBillingCycle(searchParams.get(BILLING_CYCLE_PARAM));
  const type = getTierType(searchParams.get(TIER_TYPE_PARAM));

  /* Both shapes are read together — the grid needs the selected one, the side
     pane pills need the tier count of the other. */
  useEffect(() => {
    let active = true;

    const fetchTiers = async () => {
      setLoading(true);
      try {
        const [stock, shop] = await Promise.all([
          getData("stock", billingCycle, prepareParams("stock", billingCycle)),
          getData("shop", billingCycle, prepareParams("shop", billingCycle)),
        ]);
        if (active) setTiers({ stock, shop });
      } catch (error) {
        console.error("Error fetching tiers:", error);
        if (active) setTiers({ stock: [], shop: [] });
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchTiers();

    return () => {
      active = false;
    };
  }, [billingCycle]);

  const currentTiers = tiers[type];

  const sidePaneTiers = useMemo(
    () => toSidePaneTiers(currentTiers, type),
    [currentTiers, type],
  );

  const counts = { stock: tiers.stock.length, shop: tiers.shop.length };

  /** Selection changes replace the entry so back leaves the page, not the tab. */
  const replaceParams = (patch: Record<string, string>) => {
    appNav.replace(
      location.pathname,
      { ...Object.fromEntries(searchParams.entries()), ...patch },
      { preventScrollReset: true },
    );
  };

  const handleBillingCycleChange = (cycle: BillingCycle) =>
    replaceParams({ [BILLING_CYCLE_PARAM]: cycle });

  const handleTypeChange = (nextType: TierType) =>
    replaceParams({ [TIER_TYPE_PARAM]: nextType });

  const handlePickTier = (tier: TierCardData) => {
    appNav.to(`/dashboard/accounts/platform-fee/buy-plan?planId=${tier.id}`);
  };

  const handleScrollToTier = (tierId: string) => {
    const el = document.getElementById(tierId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleAskSwa = () => {
    appNav.to("/dashboard");
  };

  return (
    <>
      <AppHeader
        title="Platform Fee Tiers"
        sectionKey="business"
        activeTab="platform-fee"
        mobileLead="menu"
      />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css).
              Carries the platform fee surfaces (Overview / Tiers / Compare / Statement);
              switching section is the header title dropdown's job. */}
          <SectionTabs
            tabs={SectionTabService.getPlatformFeeTabs()}
            activeTab="tiers"
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
                {/* Main Content Column */}
                <AppPaneMain className="tw:lg:col-span-12">
                  <AppBreadcrumbs data={breadcrumbs} />

                  <div className="tw:space-y-6 tw:mt-4 tw:pb-12">
                    {/* 1. Hero Header Banner with Title and 6mo/1yr Toggle */}
                    <TiersHeroHeader
                      billingCycle={billingCycle}
                      onBillingCycleChange={handleBillingCycleChange}
                      type={type}
                      tierCount={currentTiers.length}
                    />

                    {/* 2. Responsive 5-Tier / 3-Tier Grid */}
                    <TiersGrid
                      tiers={currentTiers}
                      loading={loading}
                      onPickTier={handlePickTier}
                    />

                    {/* 3. Mascot Rollover Banner */}
                    <TiersRolloverBanner onAskSwa={handleAskSwa} />
                  </div>
                </AppPaneMain>

                {/* Side Pane Column */}
                <AppPaneSide className="app-pane-only">
                  <TiersSidePane
                    tiers={sidePaneTiers}
                    counts={counts}
                    loading={loading}
                    selectedType={type}
                    onSelectType={handleTypeChange}
                    onSelectTier={handleScrollToTier}
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

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Platform Fee Tiers"),
    },
  ];
}
