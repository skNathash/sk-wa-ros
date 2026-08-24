import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import PageDescription from "~/components/core/page-description/PageDescription";
import AppTab from "~/components/core/tab/AppTab";
import AppCard from "~/components/core/card/AppCard";
import CommonService from "~/services/CommonService";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import useTheme from "~/hooks/useTheme";
import type { BreadcrumbItem, TabItem } from "~/types/CommonTypes";
import RecordPayment from "~/shared/accounts/components/record-payment/RecordPayment";
import type { RecordPaymentEntityType } from "~/shared/accounts/components/record-payment/types";
import RecentTransactions from "./components/recent-transaction/RecentTransactions";
import RecordPaymentSuccessModal from "~/shared/accounts/modals/record-payment/success/RecordPaymentSuccessModal";
import ManageExpense from "./components/expenses/manage/ManageExpense";
import RecentExpenses from "./components/expenses/recent-expenses/RecentExpenses";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import AccountsNavChips from "~/shared/accounts/components/accounts-nav-chips/AccountsNavChips";
import PayablesReceivablesSummary from "~/shared/accounts/components/payables-receivables-summary/PayablesReceivablesSummary";
import RecentEvents from "~/shared/insights/components/recent-events/RecentEvents";
import PaneTitle from "~/shared/layout/app-pane/PaneTitle";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    langKey: "dashboard",
    redirect: { path: "/dashboard" },
  },
  {
    label: "Accounts",
    langKey: "accounts",
    redirect: {
      path: "/dashboard/accounts/payables",
      params: {
        tab: "payables",
      },
    },
  },
  { label: "Record Payment", langKey: "recordPayment" },
];

const tabs: TabItem[] = [
  {
    name: "Receive Payment",
    key: "receivePayment",
    icon: <ArrowUpCircle color="green" />,
  },
  {
    name: "Make Payout",
    key: "makePayout",
    icon: <ArrowDownCircle color="red" />,
  },
  {
    name: "Expenses",
    key: "expense",
    icon: <ArrowDownCircle color="red" />,
  },
];

/** Party types the wizard can collect from / pay out to, per tab. */
const partyTypes: Record<
  string,
  { label: string; value: RecordPaymentEntityType }[]
> = {
  receivePayment: [
    { label: "B2B Retailer", value: "franchise" },
    { label: "B2C Customer", value: "customer" },
    { label: "Vendor", value: "vendor" },
  ],
  makePayout: [{ label: "Vendor", value: "vendor" }],
};

const RecordPaymentPage = () => {
  const { t } = useTranslation(["common", "menu"]);

  const appNav = useAppNav();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isMobile } = useScreenView();
  // theme-2 reads this sub-nav as free-standing pills on a white band, not the
  // cream segmented tray the other themes use.
  const isTheme2 = useTheme() === "theme-2";

  const [activeTab, setActiveTab] = useState("receivePayment");
  // Which kind of party the wizard searches. Payouts only ever go to vendors.
  const [entityType, setEntityType] =
    useState<RecordPaymentEntityType>("franchise");

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState<{
    counterpartyName?: string;
    isPayout?: boolean;
    amount?: number | string;
  }>({});
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [expenseRefreshSignal, setExpenseRefreshSignal] = useState(0);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && tabs.some((t) => t.key === tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Payouts only go to vendors — snap the party type back when the tab flips.
  useEffect(() => {
    setEntityType(activeTab === "makePayout" ? "vendor" : "franchise");
  }, [activeTab]);

  const handleTabChange = (tab: TabItem) => {
    setActiveTab(tab.key);
    appNav.to(location.pathname, { tab: tab.key });
  };

  const flow = activeTab === "makePayout" ? "out" : "in";
  const typeOptions = partyTypes[activeTab] || [];

  // The shared wizard records the payment itself and hands back the payload —
  // the page only refreshes the recent list and celebrates.
  const handleRecorded = (payload: Record<string, any>) => {
    const party = flow === "in" ? payload.fromInfo : payload.toInfo;

    setRefreshSignal((s) => s + 1);
    setSuccessModalData({
      counterpartyName: party?.name,
      isPayout: flow === "out",
      amount: Number(payload.amount) || 0,
    });
    setShowSuccessModal(true);
  };

  return (
    <>
      <AppHeader title={t("recordPayment")} />

      <div className="page-bg app-page tw:p-4">
        <div className="app-container">
          {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css). */}
          <SectionTabs
            sectionKey="business"
            activeTab="accounts"
            noShadow
            sticky
          />

          <div className="section-layout">
            {/* Desktop-only left rail — section side menu. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="business"
                  activeTab="accounts"
                  title={t("manageBusiness", { ns: "menu" })}
                />
              </div>
            </aside>

            <div className="section-content">
              {/* The chip strip below is the first block and cancels this gap
                  itself (`app-nav-chips-under-tabs`, -0.75rem), so it lands
                  flush against the sticky green section bar and doesn't jump by
                  the gap the moment it pins. */}
              <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start theme-2-mobile-gap-top">
                {/* Main column — spans the full grid in theme-2 desktop because
                    the side pane is lifted into the fixed rail panel. */}
                <AppPaneMain className="tw:lg:col-span-12 tw:space-y-0">
                  {/* Hidden in theme-2 — the app header already shows the page
                      title, so this would repeat it. */}
                  <div className="theme-2-hide tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:items-start tw:md:items-center tw:mb-4 tw:gap-4">
                    <div className="tw:flex-1">
                      <AppBreadcrumbs data={breadcrumbs} />
                      <PageDescription description="recordPayment" />
                    </div>
                  </div>

                  {/* theme-2 — pills on a white band that runs edge to edge and
                      pins as the form scrolls. Mobile is the chip strip pinned
                      under the sticky section tab bar (`app-nav-chips-under-tabs`);
                      md+ is the same pill row on the white card fill
                      (`barcode-tabs-pills`), pinned under the app header. */}
                  {isTheme2 ? (
                    <>
                      <AppTab
                        tabs={tabs}
                        activeTab={activeTab}
                        onTabChange={handleTabChange}
                        variant="pills"
                        className="app-nav-chips app-nav-chips-under-tabs tw:mb-4 tw:md:hidden"
                        // Mobile only: the white band drops its side padding so
                        // the track scrolls edge to edge, and the swiper supplies
                        // the leading/trailing inset instead.
                        slideOffset={isMobile ? 16 : 0}
                      />
                      <AppTab
                        tabs={tabs}
                        activeTab={activeTab}
                        onTabChange={handleTabChange}
                        variant="pills"
                        className="tw:hidden tw:md:block tw:mb-4 subscribe-tabs-sticky barcode-tabs-pills"
                      />
                    </>
                  ) : (
                    /* Other themes keep the segmented tray: `edge-tabs` pulls the
                       bar out to the screen edges, `app-tabs-tray` gives it the
                       white card + cream inner track, and `app-tabs-sticky` pins
                       it as the form scrolls. */
                    <AppTab
                      tabs={tabs}
                      activeTab={activeTab}
                      onTabChange={handleTabChange}
                      className="tw:mb-4 edge-tabs app-tabs-tray app-tabs-sticky"
                    />
                  )}

                  {/* Tab specific description */}
                  <div className="tw:mb-4">
                    <div className="tw:md:text-sm tw:text-xs tw:text-gray-500">
                      {activeTab === "receivePayment"
                        ? "Record incoming payments from customers. Attach reference and notes for each transaction."
                        : activeTab === "makePayout"
                          ? "Make payouts to vendors or partners. Ensure amounts and references are correct before confirming."
                          : "Create and manage expenses. Categorize and review recent expense transactions."}
                    </div>
                  </div>

                  {activeTab === "expense" ? (
                    // Expense tab: show expense form and recent expenses side-by-side
                    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
                      <div>
                        <ManageExpense
                          onSaved={() => setExpenseRefreshSignal((s) => s + 1)}
                        />
                      </div>
                      <div>
                        <RecentExpenses refreshSignal={expenseRefreshSignal} />
                      </div>
                    </div>
                  ) : (
                    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
                      <div>
                        <AppCard
                          title={
                            flow === "in" ? "Receive Payment" : "Make Payout"
                          }
                          subtitle={
                            flow === "in"
                              ? "Enter the amount, pick who paid you, then confirm."
                              : "Enter the amount, pick who you are paying, then confirm."
                          }
                        >
                          {/* Party type — the wizard searches one kind of party
                              at a time, so the choice lives outside it. Payouts
                              only go to vendors, so the row is hidden there. */}
                          {typeOptions.length > 1 ? (
                            <div className="tw:flex tw:flex-wrap tw:gap-2 tw:mb-2">
                              {typeOptions.map((option) => {
                                const isActive = entityType === option.value;
                                return (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setEntityType(option.value)}
                                    className={`tw:px-3 tw:py-1.5 tw:rounded-full tw:text-xs tw:font-medium tw:border tw:transition-colors ${
                                      isActive
                                        ? "tw:bg-teal-700 tw:text-white tw:border-teal-700"
                                        : "tw:bg-white tw:text-gray-600 tw:border-gray-300 tw:hover:bg-gray-50"
                                    }`}
                                  >
                                    {option.label}
                                  </button>
                                );
                              })}
                            </div>
                          ) : null}

                          {/* Remounting on flow/party change clears any half
                              filled wizard so figures never carry over. */}
                          <RecordPayment
                            key={`${flow}-${entityType}`}
                            flow={flow}
                            entityType={entityType}
                            onSubmit={handleRecorded}
                          />
                        </AppCard>
                      </div>

                      <div>
                        <RecentTransactions
                          activeTab={activeTab}
                          refreshSignal={refreshSignal}
                        />
                      </div>
                    </div>
                  )}
                </AppPaneMain>

                {/* Side column — only rendered while the theme-2 split layout is
                    active (lg+), where the CSS re-homes it as the fixed list
                    pane beside the icon rail. Hosts the accounts quick-nav
                    chips, a payables/receivables summary, and recent events. */}
                <AppPaneSide className="app-pane-only">
                  <PaneTitle title="Accounts" className="tw:px-1" />
                  <AccountsNavChips />
                  <PayablesReceivablesSummary />
                  <RecentEvents />
                </AppPaneSide>
              </div>
            </div>
          </div>
        </div>
      </div>
      <RecordPaymentSuccessModal
        show={showSuccessModal}
        callback={() => setShowSuccessModal(false)}
        counterpartyName={successModalData.counterpartyName}
        isPayout={successModalData.isPayout}
        amount={successModalData.amount || 0}
      />
    </>
  );
};

export default RecordPaymentPage;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Record Payment"),
    },
  ];
}
