import { useTranslation } from "react-i18next";
import AppHeader from "~/components/core/header/AppHeader";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import DueSummary from "./components/due-summary/DueSummary";
import LocalKhata from "./components/local-khata/LocalKhata";
import PaymentCalendar from "./components/payment-calendar/PaymentCalendar";
import PeerPaylater from "./components/peer-paylater/PeerPaylater";
import RecentEvents from "~/shared/insights/components/recent-events/RecentEvents";
import SpendSummary from "./components/spend-summary/SpendSummary";
import TopSellers from "./components/top-sellers/TopSellers";
import TopVendors from "./components/top-vendors/TopVendors";
import WalletPrepaid from "./components/wallet-prepaid/WalletPrepaid";
import WeekSummary from "./components/week-summary/WeekSummary";
import useScreenView from "~/hooks/useScreenView";
import { useState } from "react";
import PaneTitle from "~/shared/layout/app-pane/PaneTitle";

const InsightPage = () => {
  const { t } = useTranslation(["common", "menu"]);
  const { isMobile } = useScreenView();

  const [paymentCalendarDate, setPaymentCalendarDate] = useState<{
    startDate: string;
    endDate: string;
  } | null>(null);

  const handlePaymentCalendarCallback = (arg: {
    startDate: string;
    endDate: string;
  }) => {
    setPaymentCalendarDate(arg);
  };

  return (
    <>
      <AppHeader
        sectionKey="supply"
        activeTab="insight"
        title="Insights"
        showNavChips
        mobileLead="menu"
      />
      <div className="app-page page-bg page-bg-muted tw:p-4">
        <div className="app-container">
          {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css). */}
          {/* <SectionTabs
            sectionKey="supply"
            activeTab="insight"
            noShadow
            sticky
          /> */}

          <div className="section-layout">
            {/* Desktop-only left rail — supply section side menu. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="supply"
                  activeTab="insight"
                  title={t("manageSupply", { ns: "menu" })}
                />
              </div>
            </aside>

            <div className="section-content">
              <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
                {/* Main column — same order as the mobile feed. */}
                <AppPaneMain>
                  {/* <SaveOfTheWeek className="theme-2-mobile-gap-top" /> */}
                  <SpendSummary />

                  <div className="tw:grid tw:grid-cols-3 tw:gap-3">
                    <WalletPrepaid />
                    <PeerPaylater />
                    <LocalKhata />
                  </div>

                  <WeekSummary />
                  {isMobile && (
                    <>
                      <PaymentCalendar
                        callback={handlePaymentCalendarCallback}
                      />
                      <RecentEvents
                        startDate={paymentCalendarDate?.startDate ?? ""}
                        endDate={paymentCalendarDate?.endDate ?? ""}
                      />
                    </>
                  )}
                  <TopSellers />
                  <TopVendors />
                </AppPaneMain>

                {/* Side column — due actions, calendar, events. In theme-2
                    desktop this becomes the fixed list pane beside the rail. */}
                <AppPaneSide>
                  <PaneTitle title="Insights" className="tw:px-1" />
                  <DueSummary />
                  <PaymentCalendar callback={handlePaymentCalendarCallback} />
                  <RecentEvents
                    startDate={paymentCalendarDate?.startDate ?? ""}
                    endDate={paymentCalendarDate?.endDate ?? ""}
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

export default InsightPage;
