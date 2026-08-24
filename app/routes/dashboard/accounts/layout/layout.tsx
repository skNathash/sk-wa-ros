import { endOfMonth, format, startOfMonth, sub } from "date-fns";
import { useMemo, useEffect } from "react";
import type { DayPickerProps } from "react-day-picker";
import { useTranslation } from "react-i18next";
import { Outlet, useSearchParams, useLocation } from "react-router";
import AppDateInput from "~/components/core/form/AppDateInput";
import AppSelect from "~/components/core/form/AppSelect";
import AppButton from "~/components/core/button/AppButton";
import AppHeader from "~/components/core/header/AppHeader";
import useAppNav from "~/hooks/useAppNav";
import useTheme from "~/hooks/useTheme";
import PageAccessService from "~/services/PageAccessService";
import type { TabItem } from "~/types/CommonTypes";
import { Plus, DollarSign, ClipboardList } from "lucide-react";
import MiscService from "~/services/MiscService";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import SectionTabService from "~/services/SectionTabService";
import AccountsTabs, {
  accountsTabs,
  getAccountsTabLink,
} from "~/shared/accounts/components/accounts-tabs/AccountsTabs";
import {
  ACCOUNTS_SUB_TAB_PARAM,
  getAccountsSubTabConfig,
  getAccountsSubTabKey,
  isAccountsTabsHidden,
} from "~/shared/accounts/components/accounts-tabs/helper";
import AccountsSidePane from "~/shared/accounts/components/accounts-side-pane/AccountsSidePane";
import {
  accountsSectionTabs,
  getPaneView,
  getPaneViewByPath,
  type PaneBlock,
} from "~/shared/accounts/components/accounts-side-pane/helper";
import PlatformFeeSidePane from "~/shared/accounts/platform-fee/side-pane/PlatformFeeSidePane";
import type { SectionTab } from "~/types/CommonTypes";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["ACCOUNTS.VIEW-STATEMENT"], {
    allowNoSubscribe: true,
  });
}

const dateConfig: DayPickerProps = {
  mode: "range",
  disabled: { after: new Date() },
  endMonth: new Date(),
  startMonth: sub(new Date(), { years: 10 }),
  numberOfMonths: MiscService.isMobile() ? 1 : 2,
};

const presetOptions = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7days", label: "Last 7 days" },
  { value: "15days", label: "Last 15 days" },
  { value: "last3Months", label: "Last 3 months" },
  { value: "thisMonth", label: "This month" },
  { value: "lastMonth", label: "Last month" },
];

/* One-liners under the header title, keyed by accounts tab. Kept beside the tab
   config rather than in each page so the header can be resolved from the route
   alone, before the page renders. */
const accountsHeaderSubtitles: Record<string, string> = {
  "overall-statement": "Money in, money out and closing balance",
  "money-in": "Collections, receivables and who owes you",
  "money-out": "Payments, payables and vendors you owe",
  payables: "What you owe and what is due to you",
  "profit-loss": "Revenue, COGS, expenses and net profit",
  "commission-invoices": "Platform fee invoices and payouts",
  "sk-statement": "Your balance ledger with StoreKing",
};

const AccountsLayout = () => {
  const { t } = useTranslation(["common", "menu"]);
  const appNav = useAppNav();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const isTheme2 = useTheme() === "theme-2";
  /* Theme-2 overall statement folds its own toolbar into this row: the date
     picker moves to the far left of the row, and the page portals its Download
     button into the action slot beside Deposit Money. */
  const isOverview =
    location.pathname === "/dashboard/accounts/overall-statement";
  const compactStatementHeader = isTheme2 && isOverview;
  const isProfitLoss = location.pathname === "/dashboard/accounts/profit-loss";
  /* Platform fee pages (tiers, statement) render inside this layout but belong
     to the rail's own "Platform Fee" entry, not to "Accounts". */
  const isPlatformFee = location.pathname.startsWith(
    "/dashboard/accounts/platform-fee",
  );
  const isPlatformFeeStatement =
    location.pathname === "/dashboard/accounts/platform-fee/statement";
  /* Theme-2 pages that own the tab tray as their own sub-nav (see the tabs
     helper). It then has to survive on desktop too, where the section tabs it
     replaced had moved into the side rail — so it drops `app-pane-hide` and
     picks up the sticky white strip treatment instead. */
  const hasSubTabs =
    isTheme2 && Boolean(getAccountsSubTabConfig(location.pathname));
  /* Overview renders no tray at all, so the page's first block is the header
     row — which the sticky section bar (pinned 1rem below its own flow
     position) would otherwise cover. */
  const hasNoTabs = isTheme2 && isAccountsTabsHidden(location.pathname);
  /* Paylater is a live outstanding book, not a period report — it lists every
     open due regardless of when it was raised, so the shared range picker has
     nothing to drive there either. */
  const isPaylater =
    location.pathname === "/dashboard/accounts/money-in" &&
    getAccountsSubTabKey(
      location.pathname,
      searchParams.get(ACCOUNTS_SUB_TAB_PARAM),
    ) === "paylater";
  /* Same for the money-out vendors and aging tabs: both read the live payables
     book — every open vendor balance as of today, regardless of when the bill
     was raised — so a period range would only mislead. */
  const isMoneyOut = location.pathname === "/dashboard/accounts/money-out";
  const isLivePayables =
    isTheme2 &&
    isMoneyOut &&
    ["vendors", "aging"].includes(
      getAccountsSubTabKey(
        location.pathname,
        searchParams.get(ACCOUNTS_SUB_TAB_PARAM),
      ),
    );
  /* Blocks the page already carries in its own main column, dropped from the
     pane so the same numbers/list don't show up twice: money out repeats both
     the summary and the vendor list, money in only the who-owes-you list. */
  const paneHiddenBlocks: PaneBlock[] | undefined = isMoneyOut
    ? ["summary", "vendors"]
    : location.pathname === "/dashboard/accounts/money-in"
      ? ["parties"]
      : undefined;
  /* Theme-2 P&L picks its period from its own tab tray (this month, quarter,
     YTD, FY), so the shared range picker has nothing to drive there. */
  const hideDateSelect =
    location.pathname === "/dashboard/accounts/payables" ||
    isPaylater ||
    isLivePayables ||
    (isTheme2 && isProfitLoss);
  /* Theme-2 keeps Deposit Money on the overview page alone: it tops up the
     StoreKing balance the overview reports, and repeating it on every tab
     crowded toolbars that already carry their own actions. */
  const hideDepositMoney = isTheme2
    ? !isOverview
    : location.pathname === "/dashboard/accounts/platform-fee/statement" ||
      isProfitLoss;
  const activeTab = searchParams.get("tab") || "revenue";

  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const defaultStart = startOfMonth(sub(now, { months: 3 }));

  const dateRange = [
    dateFrom ? new Date(dateFrom) : defaultStart,
    dateTo ? new Date(dateTo) : today,
  ];

  const handleDateChange = (value: Date | Date[]) => {
    const currentTab = accountsTabs.find((t) => t.key === activeTab);

    let fromDateValue = "";
    let toDateValue = "";

    if (value) {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          fromDateValue = format(value[0], "yyyy-MM-dd");
          toDateValue = value[1]
            ? format(value[1], "yyyy-MM-dd")
            : fromDateValue;
        }
      } else {
        fromDateValue = format(value, "yyyy-MM-dd");
        toDateValue = fromDateValue;
      }
    }

    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev);
        if (currentTab?.key) newParams.set("tab", currentTab.key);
        if (fromDateValue) newParams.set("dateFrom", fromDateValue);
        else newParams.delete("dateFrom");
        if (toDateValue) newParams.set("dateTo", toDateValue);
        else newParams.delete("dateTo");
        return newParams;
      },
      {
        replace: true,
      },
    );
  };

  const handlePresetChange = (value: any) => {
    const currentTab = accountsTabs.find((t) => t.key === activeTab);
    const { path, params } = getAccountsTabLink(currentTab as TabItem);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let fromDateValue = "";
    let toDateValue = "";

    if (value === "today") {
      fromDateValue = format(today, "yyyy-MM-dd");
      toDateValue = format(today, "yyyy-MM-dd");
    } else if (value === "yesterday") {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      fromDateValue = format(y, "yyyy-MM-dd");
      toDateValue = format(y, "yyyy-MM-dd");
    } else if (value === "7days") {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      fromDateValue = format(start, "yyyy-MM-dd");
      toDateValue = format(today, "yyyy-MM-dd");
    } else if (value === "15days") {
      const start = new Date(today);
      start.setDate(start.getDate() - 14);
      fromDateValue = format(start, "yyyy-MM-dd");
      toDateValue = format(today, "yyyy-MM-dd");
    } else if (value === "last3Months") {
      const start = startOfMonth(sub(now, { months: 3 }));
      fromDateValue = format(start, "yyyy-MM-dd");
      toDateValue = format(today, "yyyy-MM-dd");
    } else if (value === "thisMonth") {
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      fromDateValue = format(start, "yyyy-MM-dd");
      toDateValue = format(end, "yyyy-MM-dd");
    } else if (value === "lastMonth") {
      const start = startOfMonth(sub(now, { months: 1 }));
      const end = endOfMonth(sub(now, { months: 1 }));
      fromDateValue = format(start, "yyyy-MM-dd");
      toDateValue = format(end, "yyyy-MM-dd");
    }

    appNav.to(path, {
      ...params,
      tab: currentTab?.key,
      dateFrom: fromDateValue,
      dateTo: toDateValue,
    });
  };

  // determine selected preset based on the dateFrom/dateTo in URL
  const selectedPreset = useMemo(() => {
    if (!dateFrom && !dateTo) return "last3Months";
    if (!dateFrom || !dateTo) return undefined;
    const df = new Date(dateFrom);
    const dt = new Date(dateTo);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const start7 = new Date(today);
    start7.setDate(today.getDate() - 6);
    const start15 = new Date(today);
    start15.setDate(today.getDate() - 14);
    const start3Months = startOfMonth(sub(now, { months: 3 }));

    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(sub(now, { months: 1 }));
    const lastMonthEnd = endOfMonth(sub(now, { months: 1 }));

    const fmt = (d: Date) => format(d, "yyyy-MM-dd");

    if (fmt(df) === fmt(today) && fmt(dt) === fmt(today)) return "today";
    if (fmt(df) === fmt(yesterday) && fmt(dt) === fmt(yesterday))
      return "yesterday";
    if (fmt(df) === fmt(start7) && fmt(dt) === fmt(today)) return "7days";
    if (fmt(df) === fmt(start15) && fmt(dt) === fmt(today)) return "15days";
    if (fmt(df) === fmt(start3Months) && fmt(dt) === fmt(today))
      return "last3Months";
    if (fmt(df) === fmt(thisMonthStart) && fmt(dt) === fmt(thisMonthEnd))
      return "thisMonth";
    if (fmt(df) === fmt(lastMonthStart) && fmt(dt) === fmt(lastMonthEnd))
      return "lastMonth";

    return undefined;
  }, [dateFrom, dateTo]);

  useEffect(() => {
    /* Theme-2 P&L picks its period from its own tab tray, so the shared range
       means nothing there: don't stamp the default, and drop a range carried
       in from whichever tab the user arrived from. */
    if (isTheme2 && isProfitLoss) {
      if (dateFrom || dateTo) {
        setSearchParams(
          (prev) => {
            const newParams = new URLSearchParams(prev);
            newParams.delete("dateFrom");
            newParams.delete("dateTo");
            return newParams;
          },
          {
            replace: true,
          },
        );
      }
      return;
    }

    if (!dateFrom && !dateTo) {
      const defaultStart = startOfMonth(sub(now, { months: 3 }));
      const defaultEnd = today;

      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev);
          newParams.set("dateFrom", format(defaultStart, "yyyy-MM-dd"));
          newParams.set("dateTo", format(defaultEnd, "yyyy-MM-dd"));
          if (!newParams.get("tab")) {
            newParams.set("tab", activeTab);
          }
          return newParams;
        },
        {
          replace: true,
        },
      );
    }
    // only run when url params or activeTab change
  }, [
    dateFrom,
    dateTo,
    activeTab,
    setSearchParams,
    today,
    now,
    isTheme2,
    isProfitLoss,
  ]);

  /* The header names the page being read, not the section — the section is
     already spelled out by the tab tray / side rail. Matched off the tab config
     so a new tab only has to be added in one place. */
  const headerTab = useMemo(
    () =>
      accountsTabs.find((tab) => {
        const { path } = getAccountsTabLink(tab);
        return (
          location.pathname === path || location.pathname.startsWith(`${path}/`)
        );
      }),
    [location.pathname],
  );

  const headerTitle = headerTab
    ? t(headerTab.langKey as string, { defaultValue: headerTab.name })
    : t("accountsSummary");
  const headerSubtitle = headerTab
    ? accountsHeaderSubtitles[headerTab.key]
    : undefined;

  /* Mobile segmented bar. Pages no view points at (payables, sk-statement,
     commission invoices) leave every tab unselected rather than mis-highlighting
     one. */
  const paneView = getPaneViewByPath(location.pathname) ?? "";

  const handleSectionTabChange = (tab: SectionTab) => {
    const view = getPaneView(tab.key);
    appNav.to(view.path, {
      ...view.params,
      /* Only the pages driven by the shared range picker want the range carried
         over; the rest would just be left with dead params in the URL. */
      ...(view.carryRange && dateFrom && dateTo ? { dateFrom, dateTo } : {}),
    });
  };

  const dateInput = (
    <AppDateInput
      callback={handleDateChange}
      value={dateRange}
      dateConfig={dateConfig}
      size="sm"
      hideClose={true}
      inputClassName="accounts-date-btn"
    />
  );

  return (
    <>
      <AppHeader
        title={headerTitle}
        subtitle={headerSubtitle}
        /* Accounts is a top-level business page — the title becomes the
           tappable section switcher on theme-2 mobile, and the lead button is
           the account-menu hamburger instead of a back arrow. The platform fee
           pages sit under the rail's own "Platform Fee" entry, so the switcher
           opens on that tab there (same as the side menu below). */
        sectionKey="business"
        activeTab={isPlatformFee ? "platform-fee" : "accounts"}
        mobileLead="menu"
        showAudioNote={true}
        audioFeature="accountSummary"
        audioNoteTitle="Learn about account Summary"
      />
      <div
        className={`app-page page-bg ${
          isTheme2 ? "tw:px-4 tw:py-0" : "tw:p-4"
        } ${isProfitLoss ? "has-footer" : ""}`}
      >
        <div className="app-container">
          {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css).
              Carries the accounts views (the same list the desktop side pane
              chips use) rather than the business section tabs: switching
              section is now the header title dropdown's job. */}
          {isPlatformFeeStatement ? (
            /* The statement is one of the Platform Fee surfaces, not an
               accounts view — it carries that strip (Overview / Tiers /
               Compare / Statement) so the sticky bar matches the benefits and
               tiers pages, and navigates through each tab's own redirect. */
            <SectionTabs
              tabs={SectionTabService.getPlatformFeeTabs()}
              activeTab="statement"
              noShadow
              sticky
            />
          ) : (
            <SectionTabs
              tabs={accountsSectionTabs}
              activeTab={paneView}
              onTabChange={handleSectionTabChange}
              noShadow
              sticky
            />
          )}

          <div className="section-layout">
            {/* Desktop-only left rail — section side menu. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="business"
                  activeTab={isPlatformFee ? "platform-fee" : "accounts"}
                  title={t("manageBusiness", { ns: "menu" })}
                />
              </div>
            </aside>

            <div className="section-content">
              {/* No `theme-2-mobile-gap-top` here: the edge-to-edge tab tray
                  below is the first block, so the grid's theme-2 mobile top
                  margin would show as a page-bg band between the sticky green
                  section bar and the white tray. On the pages that render no
                  tray (overview) there is nothing to sit under the bar, so
                  `accounts-no-tabs-gap` puts the missing clearance back. */}
              <div
                className={`tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start ${
                  hasNoTabs ? "accounts-no-tabs-gap" : ""
                }`}
              >
                <AppPaneMain className="tw:lg:col-span-12">
                  {/* Section tabs are hidden on theme-2 desktop
                      (`app-pane-hide`), where navigation moves into the side
                      pane nav chips. They stay visible on mobile and in every
                      other theme. `app-tabs-tray` + `app-tabs-sticky` give the
                      same white card / cream track look as the subscribe
                      sub-nav, pinned below the sticky section tab bar on
                      theme-2 mobile.
                      On the theme-2 pages that own the tray as page sub-nav it
                      is the same strip, kept on desktop as well — and the tray
                      renders nothing at all on overview. */}
                  {/* The theme-2 statement already carries the Platform Fee
                      strip above, so the accounts tray would only repeat a
                      second row of tabs there. Other themes keep it — it is
                      their only way back to the other accounts views. */}
                  {!(isTheme2 && isPlatformFeeStatement) && (
                    <AccountsTabs
                      activeTab={activeTab}
                      variant={isTheme2 ? "underline" : undefined}
                      className={
                        hasSubTabs
                          ? "tw:mb-8 edge-tabs app-tabs-tray app-tabs-sticky accounts-tabs-sticky"
                          : "tw:mb-6 edge-tabs app-tabs-sticky app-pane-hide tw:border-t"
                      }
                    />
                  )}
                  {/* Skipped entirely when the date select is hidden: every
                      child below is gated on the same flag, so the row would
                      render empty — and the column's `space-y-4` would still
                      bill it a 1rem gap above the page's first real block. */}
                  {!hideDateSelect && (
                    <div
                      className={`accounts-header-row tw:flex tw:md:flex-row tw:md:items-center tw:md:justify-between tw:mb-3 ${
                        /* Theme-2 statement keeps its one row on mobile too:
                           the range picker takes the space it needs and the
                           Download action rides beside it. */
                        compactStatementHeader
                          ? "tw:flex-row tw:items-center tw:gap-2"
                          : "tw:flex-col"
                      }`}
                    >
                      {compactStatementHeader && (
                        /* Theme-2 statement: the range picker leads the row,
                         actions stay pinned to the right. */
                        <div className="tw:flex-1 tw:md:flex-none tw:min-w-0 tw:mt-2 tw:md:mt-0">
                          {dateInput}
                        </div>
                      )}
                      <div
                        className={`tw:flex tw:items-center tw:md:justify-end tw:gap-2 tw:mt-2 tw:md:mt-0 ${
                          compactStatementHeader
                            ? "tw:w-auto tw:shrink-0 tw:justify-end"
                            : "tw:w-full tw:md:w-auto"
                        }`}
                      >
                        {/* <div className="tw:w-auto">
                  <AppSelect
                    options={presetOptions}
                    onChange={handlePresetChange}
                    placeholder={t("select")}
                    size="sm"
                    value={selectedPreset}
                  />
                </div> */}
                        {!compactStatementHeader && (
                          <div className="tw:flex-1 tw:md:flex-none">
                            {dateInput}
                          </div>
                        )}
                        {!hideDepositMoney && (
                          <AppButton
                            onClick={() =>
                              appNav.replace("/dashboard/deposit-money/options")
                            }
                            size="small"
                            color="primary"
                            fill="solid"
                            className="tw:hidden tw:md:inline-flex"
                          >
                            <Plus />
                            Deposit Money
                          </AppButton>
                        )}
                        {/* Portal target for page-owned header actions (see
                            overall-statement in theme-2). */}
                        <div
                          id="accounts-header-actions"
                          className="tw:flex tw:items-center tw:gap-2 tw:empty:hidden"
                        />
                      </div>
                    </div>
                  )}
                  {/* <Summary /> */}
                  <Outlet />
                </AppPaneMain>

                {/* Side column — only rendered while the theme-2 split layout
                    is active (lg+), where the CSS re-homes it as the fixed list
                    pane beside the icon rail. The pane owns its own chip
                    switcher and blocks (summary, parties, categories, events). */}
                {isPlatformFeeStatement ? (
                  <AppPaneSide className="app-pane-only">
                    <PlatformFeeSidePane />
                  </AppPaneSide>
                ) : (
                  <AccountsSidePane
                    hideBlocks={paneHiddenBlocks}
                    hideSummary={true}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeTab !== "commission-invoices" && !hideDepositMoney && (
        <div className="app-footer tw:md:hidden">
          <div className="app-container">
            <AppButton
              className="tw:w-full"
              onClick={() => appNav.replace("/dashboard/deposit-money/options")}
            >
              <Plus />
              Deposit Money
            </AppButton>
          </div>
        </div>
      )}
    </>
  );
};

export default AccountsLayout;
