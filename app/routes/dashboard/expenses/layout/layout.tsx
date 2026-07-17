import AppHeader from "~/components/core/header/AppHeader";
import AppTab from "~/components/core/tab/AppTab";
import type { BreadcrumbItem, TabItem } from "~/types/CommonTypes";
import useAppNav from "~/hooks/useAppNav";
import { Outlet, useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import Summary from "./components/summary/Summary";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";

const tabs: TabItem[] = [
  { name: "Expense Records", key: "records", icon: "list" },
  // { name: "Statement of Accounts", key: "statements", icon: "file-text" },
  { name: "Analytics", key: "analytics", icon: "chart-line" },
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
  const activeTab = searchParams.get("tab") || "records";

  const handleTabChange = (tab: TabItem) => {
    // route to named sub-route where possible
    if (tab.key === "records") {
      appNav.to(`/dashboard/expenses/list`, { tab: tab.key });
    } else if (tab.key === "statements") {
      appNav.to(`/dashboard/expenses/statement-of-accounts`, { tab: tab.key });
    } else if (tab.key === "analytics") {
      appNav.to(`/dashboard/expenses/analytics`, { tab: tab.key });
    } else if (tab.key === "categories") {
      appNav.to(`/dashboard/expenses/categories`, { tab: tab.key });
    } else {
      appNav.to(`/dashboard/expenses?tab=${tab.key}`);
    }
  };

  return (
    <>
      <AppHeader title="Expenses" />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css). */}
          <SectionTabs
            sectionKey="business"
            activeTab="expenses"
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
          <div className="tw:flex tw:items-start tw:justify-between tw:gap-4 tw:mb-4 tw:flex-col tw:md:flex-row">
            <div className="tw:flex-1">
              <AppBreadcrumbs data={breadcrumbs} />
              <div className="tw:text-sm tw:text-gray-500 tw:mt-1">
                Manage expense records, statements and categories.
              </div>
            </div>

            {/* <div className="tw:mt-3 tw:md:mt-0">
              <AppButton
                color="primary"
                size="small"
                onClick={() => appNav.to("/dashboard/expenses/manage")}
                className="tw:flex tw:items-center tw:justify-center tw:md:justify-end"
              >
                <Plus />
                Add Expense
              </AppButton>
            </div> */}
          </div>
          <Summary />
          <AppTab
            activeTab={activeTab}
            tabs={tabs}
            onTabChange={handleTabChange}
            className="tw:mb-4"
          />
          <Outlet />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExpensesLayout;
