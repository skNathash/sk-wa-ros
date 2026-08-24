import AppHeader from "~/components/core/header/AppHeader";
import AppTab from "~/components/core/tab/AppTab";
import type { BreadcrumbItem, TabItem } from "~/types/CommonTypes";
import useAppNav from "~/hooks/useAppNav";
import { Outlet, useLocation, useSearchParams } from "react-router";
import PageHeader from "~/shared/page-header/PageHeader";
import AppButton from "~/components/core/button/AppButton";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import useTheme from "~/hooks/useTheme";
import {
  accountsSectionTabs,
  getPaneView,
  getPaneViewByPath,
} from "~/shared/accounts/components/accounts-side-pane/helper";
import type { SectionTab } from "~/types/CommonTypes";

const tabs: TabItem[] = [
  { name: "Expense Records", key: "records", icon: "list" },
  // { name: "Statement of Accounts", key: "statements", icon: "file-text" },
  { name: "Categories", key: "categories", icon: "tag" },
];

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    redirect: {
      path: "/dashboard",
    },
  },
  {
    label: "Expenses",
  },
];

const ExpensesLayout = () => {
  const { t } = useTranslation(["menu"]);
  const appNav = useAppNav();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const isTheme2 = useTheme() === "theme-2";
  const activeTab = searchParams.get("tab") || "records";

  /* Mobile segmented bar carries the accounts views (the same list the desktop
     side pane chips use) rather than the business section tabs — expenses is
     one of those views, and switching section is the header title dropdown's
     job now. Pages no view points at (categories, statement of accounts) leave
     every tab unselected rather than mis-highlighting one. */
  const paneView = getPaneViewByPath(location.pathname) ?? "";

  const handleSectionTabChange = (tab: SectionTab) => {
    const view = getPaneView(tab.key);
    appNav.to(view.path, view.params);
  };

  const handleTabChange = (tab: TabItem) => {
    // route to named sub-route where possible
    if (tab.key === "records") {
      appNav.to(`/dashboard/expenses/list`, { tab: tab.key });
    } else if (tab.key === "statements") {
      appNav.to(`/dashboard/expenses/statement-of-accounts`, { tab: tab.key });
    } else if (tab.key === "categories") {
      appNav.to(`/dashboard/expenses/categories`, { tab: tab.key });
    } else {
      appNav.to(`/dashboard/expenses?tab=${tab.key}`);
    }
  };

  return (
    <>
      <AppHeader
        title="Expenses"
        subtitle="What the store spends, month by month"
        /* Expenses is a top-level business page — the title becomes the
           tappable section switcher on theme-2 mobile, and the lead button is
           the account-menu hamburger instead of a back arrow. */
        sectionKey="business"
        activeTab="expenses"
        mobileLead="menu"
      />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css).
              Carries the accounts views, same as the accounts section. */}
          <SectionTabs
            tabs={accountsSectionTabs}
            activeTab={paneView}
            onTabChange={handleSectionTabChange}
            noShadow
            sticky
          />

          <div className="section-layout">
            {/* Desktop-only left rail — section side menu. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="business"
                  activeTab="expenses"
                  title={t("manageBusiness", { ns: "menu" })}
                />
              </div>
            </aside>

            <div className="section-content">
              {/* Page header + CTA — hidden on theme-2 mobile (sticky footer CTA)
              and on theme-2 desktop, where the side pane carries the section
              heading and the "Add Expense" button. Still shown in the theme-2
              md–lg band, which has neither. */}
              <div className="theme-2-mobile-hide app-pane-hide tw:flex tw:items-start tw:justify-between tw:gap-4 tw:mb-4 tw:flex-col tw:md:flex-row">
                <div className="tw:flex-1">
                  <PageHeader
                    breadcrumbs={breadcrumbs}
                    title={t("expenses", { ns: "menu" })}
                    description="manageExpense"
                  />
                </div>

                {/* Desktop CTA — mobile uses the sticky footer below. */}
                <div className="tw:mt-3 tw:md:mt-0 tw:hidden tw:md:block">
                  <AppButton
                    color="primary"
                    size="small"
                    onClick={() => appNav.to("/dashboard/expenses/manage")}
                    className="tw:flex tw:items-center tw:justify-center tw:md:justify-end"
                  >
                    <Plus />
                    Add Expense
                  </AppButton>
                </div>
              </div>
              {/* Same sub-nav treatment as the accounts section's page tabs
              (money-in lanes, money-out views): underlined tabs on a sticky
              white strip. Mobile renders it as the full-bleed tray
              (`edge-tabs app-tabs-tray`) pinned below the section pill bar
              (`app-tabs-sticky`); on lg desktop, where the section tabs have
              moved into the icon rail, `app-tabs-bleed` runs the same strip
              from the side-pane border to the right viewport edge. Other
              themes keep the segmented tray. */}
              <AppTab
                activeTab={activeTab}
                tabs={tabs}
                onTabChange={handleTabChange}
                variant={isTheme2 ? "underline" : "tabs"}
                className={
                  isTheme2
                    ? "tw:mb-4 edge-tabs app-tabs-tray app-tabs-sticky app-tabs-bleed"
                    : "tw:mb-4 edge-tabs app-tabs-tray app-tabs-sticky"
                }
                scrollable
              />
              <Outlet />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky mobile CTA — mirrors the reference's "Add expense" button. */}
      <div className="app-footer tw:md:hidden">
        <div className="app-container">
          <AppButton
            className="tw:w-full"
            onClick={() => appNav.to("/dashboard/expenses/manage")}
          >
            <Plus />
            Add Expense
          </AppButton>
        </div>
      </div>
    </>
  );
};

export default ExpensesLayout;
