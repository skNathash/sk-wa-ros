import { useState } from "react";
import { useTranslation } from "react-i18next";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import PageDescription from "~/components/core/page-description/PageDescription";
import useScreenView from "~/hooks/useScreenView";
import useTheme from "~/hooks/useTheme";
import CommonService from "~/services/CommonService";
import CoinsTab from "~/shared/coins/components/CoinsTab";
import CoinStorePane from "~/shared/coins/components/coin-store-pane/CoinStorePane";
import type { CoinChipKey } from "~/shared/coins/components/coin-store-pane/helper";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import CirculationHero from "./components/circulation-hero/CirculationHero";
import CoinStats from "./components/coin-stats/CoinStats";
import RewardFunnel from "./components/reward-funnel/RewardFunnel";
import TopCoinHolders from "./components/top-coin-holders/TopCoinHolders";
import VelocityChart from "./components/velocity-chart/VelocityChart";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Products",
    redirect: { path: "/products/sk" },
  },
  {
    label: "Coin Economy",
  },
];

/**
 * King Coins economy — the book read top to bottom: what is in circulation,
 * the four headline numbers, how coins moved week by week beside how holders
 * split across the reward bands, then every holder with a nudge beside them.
 *
 * The theme-2 side pane carries the search and band chips that narrow the
 * holder list, so the page owns that selection and hands it down.
 */
const CoinEconomy = () => {
  const { t } = useTranslation(["common"]);
  const { isMobile } = useScreenView();
  const isTheme2 = useTheme() === "theme-2";

  const [search, setSearch] = useState("");
  const [band, setBand] = useState<CoinChipKey>("all");

  return (
    <>
      <AppHeader
        title="King Coins · Economy"
        // theme-2 mobile: the header carries the business section switcher
        // (eyebrow + tappable title) with the account-menu hamburger leading
        // it — the same treatment the customer detail layout uses. The page's
        // own sub-nav lives in the sticky CoinsTab below. Desktop is
        // unaffected.
        sectionKey="business"
        activeTab="loyalty"
        mobileLead="menu"
        // Only the switcher shows a subtitle line; elsewhere it would repeat
        // the title.
        subtitle={isTheme2 && isMobile ? "Economy" : undefined}
      />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          {/* Theme-2 phone: the coins sub-nav rides the sticky section-tab bar
              at the top of the screen (the same treatment the customer detail
              layout uses). Hidden outside theme-2 mobile. */}
          <CoinsTab activeTab="dashboard" sticky />

          <div className="section-layout">
            {/* Desktop-only left rail — section side menu. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="business"
                  activeTab="loyalty"
                  title={t("manageBusiness", { ns: "menu" })}
                />
              </div>
            </aside>

            <div className="section-content">
              <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
                <AppPaneMain className="tw:lg:col-span-12">
                  {/* theme-2 hides both the breadcrumbs and the page
                      description; drop the band there rather than leave an
                      empty row paying its bottom margin. */}
                  <div className="tw:mb-4 theme-2-hide">
                    <AppBreadcrumbs data={breadcrumbs} className="tw:!mb-0" />
                    <PageDescription description="coinStore" />
                  </div>

                  {/* The coins sub-nav — hidden in theme-2 desktop, where the
                      pane's quick actions cover the same ground. */}
                  <CoinsTab
                    activeTab="dashboard"
                    className="tw:mb-4 app-pane-hide theme-2-mobile-hide"
                  />

                  <CirculationHero />

                  <CoinStats />

                  <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:lg:grid-cols-5 tw:items-stretch">
                    <div className="tw:lg:col-span-3">
                      <VelocityChart />
                    </div>
                    <div className="tw:lg:col-span-2">
                      <RewardFunnel />
                    </div>
                  </div>

                  <TopCoinHolders search={search} band={band} />
                </AppPaneMain>

                {/* Side column — only rendered while the theme-2 split layout
                    is active (lg+), where the CSS re-homes it as the fixed
                    list pane beside the section icon rail. */}
                <AppPaneSide className="app-pane-only">
                  <CoinStorePane
                    title="Coin Economy"
                    searchPlaceholder="Search customer · coins"
                    chipType="bands"
                    activeChipKey={band}
                    onChipSelect={(key) => setBand(key as CoinChipKey)}
                    onSearch={setSearch}
                    showTierPhilosophy={false}
                    showRecentRedemptions={false}
                  />
                </AppPaneSide>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CoinEconomy;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Coin Economy"),
    },
  ];
}
