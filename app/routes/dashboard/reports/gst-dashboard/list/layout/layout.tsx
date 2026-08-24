import { format, startOfMonth, sub } from "date-fns";
import { useEffect, useState } from "react";
import type { DayPickerProps } from "react-day-picker";
import {
  Outlet,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppDateInput from "~/components/core/form/AppDateInput";
import AppHeader from "~/components/core/header/AppHeader";
import AppTab from "~/components/core/tab/AppTab";
import type { BreadcrumbItem, TabItem } from "~/types/CommonTypes";
import Summary from "./components/Summary";
import { defaultSummaryData } from "./helper";
import ReportService from "~/services/ReportService";
import AuthService from "~/services/AuthService";
import MiscService from "~/services/MiscService";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import AccountsTabs from "~/shared/accounts/components/accounts-tabs/AccountsTabs";
import AccountsNavChips from "~/shared/accounts/components/accounts-nav-chips/AccountsNavChips";
import PayablesReceivablesSummary from "~/shared/accounts/components/payables-receivables-summary/PayablesReceivablesSummary";
import RecentEvents from "~/shared/insights/components/recent-events/RecentEvents";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import useTheme from "~/hooks/useTheme";
import { useTranslation } from "react-i18next";
import PaneTitle from "~/shared/layout/app-pane/PaneTitle";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    redirect: {
      path: "/dashboard",
    },
  },
  {
    label: "Reports",
    redirect: {
      path: "/dashboard/reports",
    },
  },
  {
    label: "GST Dashboard",
  },
];

const tabs: TabItem[] = [
  {
    name: "Products Level",
    key: "products-level",
  },
  {
    name: "HSN Summary",
    key: "hsn-summary",
  },
  {
    name: "Rate Summary",
    key: "rate-summary",
  },
  {
    name: "Party Wise",
    key: "party-wise",
  },
  {
    name: "Reports",
    key: "reports",
  },
];

const dateConfig: DayPickerProps = {
  mode: "range",
  disabled: { after: new Date() },
  endMonth: new Date(),
  startMonth: sub(new Date(), { years: 10 }),
  numberOfMonths: MiscService.isMobile() ? 1 : 2,
};

const defaultDateRange = [startOfMonth(new Date()), new Date()];

const Layout = () => {
  const { t } = useTranslation(["common", "menu"]);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isTheme2 = useTheme() === "theme-2";

  const [selectedDate, setSelectedDate] = useState<Date | Date[]>(
    defaultDateRange,
  );

  const [summary, setSummary] = useState<any[]>([...defaultSummaryData]);

  const dateFrom = searchParams?.get("dateFrom");
  const dateTo = searchParams?.get("dateTo");

  // Only show the accounts tabs here when the user navigated in from the
  // accounts section (see getAccountsTabLink's `from: "accounts"`).
  const fromAccounts = searchParams?.get("from") === "accounts";

  useEffect(() => {
    if (!dateFrom && !dateTo) {
      setSearchParams({
        dateFrom: defaultDateRange[0].toISOString(),
        dateTo: defaultDateRange[1].toISOString(),
      });
    }

    if (dateFrom && dateTo) {
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);
      setSelectedDate([fromDate, toDate]);

      loadSummary();
    }
  }, [dateFrom, dateTo]);

  let activeTab = "products-level";
  if (location.pathname.includes("hsn-summary")) {
    activeTab = "hsn-summary";
  } else if (location.pathname.includes("rate-summary")) {
    activeTab = "rate-summary";
  } else if (location.pathname.includes("party-wise")) {
    activeTab = "party-wise";
  } else if (location.pathname.includes("gst-dashboard/reports")) {
    activeTab = "reports";
  } else {
    activeTab = "products-level";
  }

  // `preventScrollReset` keeps ScrollRestoration from jumping to the top: these
  // tabs swap the content under a shared header, so the scroll position should
  // stay put.
  const onTabChange = (tab: TabItem) => {
    const params = new URLSearchParams({
      dateFrom: dateFrom || "",
      dateTo: dateTo || "",
    });
    // Keep the accounts context so the accounts tabs stay visible while
    // switching between GST sub-tabs.
    if (fromAccounts) {
      params.set("from", "accounts");
    }
    const paths: Record<string, string> = {
      "products-level": "/dashboard/reports/gst-dashboard/products-level",
      "hsn-summary": "/dashboard/reports/gst-dashboard/hsn-summary",
      "rate-summary": "/dashboard/reports/gst-dashboard/rate-summary",
      "party-wise": "/dashboard/reports/gst-dashboard/party-wise",
      reports: "/dashboard/reports/gst-dashboard/reports",
    };
    const path = paths[tab.key];
    if (!path) return;

    navigate(`${path}?${params.toString()}`, { preventScrollReset: true });
  };

  const dateLabel =
    dateFrom && dateTo
      ? `${format(new Date(dateFrom), "d MMM")} – ${format(new Date(dateTo), "d MMM yyyy")}`
      : undefined;

  const handleDateChange = (value: Date[] | Date) => {
    if (!Array.isArray(value) || value.length !== 2) return;
    setSearchParams({
      dateFrom: format(value[0], "yyyy-MM-dd"),
      dateTo: format(value[1], "yyyy-MM-dd"),
    });
  };

  const loadSummary = async () => {
    if (!dateFrom || !dateTo) {
      return;
    }

    const fid = AuthService.getLoggedInUserId();
    const params = {
      startDate: format(new Date(dateFrom), "yyyy-MM-dd"),
      endDate: format(new Date(dateTo), "yyyy-MM-dd"),
    };
    const r = await ReportService.getGstDashboardCardSummary(fid, params);
    const d = r?.data?.data || {};
    const formatted: Record<string, number> = {
      gstCollected: d.TotalGSTCollected || 0,
      gstInwarded: d.TotalGSTInwarded || 0,
      gstPayable: d.NetGSTLiable || 0,
      finalGstToPay: d.NetGSTPayable || 0,
      uniqueHsnCodes: d.TotalHSNCodes || 0,
    };
    setSummary(
      defaultSummaryData.map((item) => ({
        ...item,
        value: formatted[item.valueKey] || 0,
      })),
    );
  };

  return (
    <>
      <AppHeader title="GST Dashboard" />
      <div className="app-page page-bg page-padding">
        <div className="app-container">
          {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css). */}
          <SectionTabs
            sectionKey="business"
            activeTab={fromAccounts ? "accounts" : "reports"}
            noShadow
            sticky
          />

          <div className="section-layout">
            {/* Desktop-only left rail — section side menu. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="business"
                  activeTab={fromAccounts ? "accounts" : "reports"}
                  title={t("manageBusiness", { ns: "menu" })}
                />
              </div>
            </aside>

            <div className="section-content">
              <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
                <AppPaneMain className="tw:lg:col-span-12">
                  {/* `app-tabs-tray` + `app-tabs-sticky` match the accounts section
                      tab bar: white edge-to-edge card with a cream inner track,
                      pinned below the sticky section bar on theme-2 mobile. */}
                  {fromAccounts && (
                    <AccountsTabs
                      activeTab="gst-reports"
                      className="tw:mb-4 edge-tabs app-tabs-tray app-tabs-sticky"
                    />
                  )}

                  {/* The theme-2 mobile top gap only applies when this row is the
                      first block; with the accounts tab tray above, its own bottom
                      margin already provides the separation. */}
                  <div
                    className={`tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:md:items-center tw:mb-4 ${
                      fromAccounts ? "" : "theme-2-mobile-gap-top"
                    }`}
                  >
                    <div>
                      <AppBreadcrumbs data={breadcrumbs} />
                    </div>

                    <div>
                      <AppDateInput
                        callback={handleDateChange}
                        value={selectedDate}
                        dateConfig={dateConfig}
                        size="sm"
                        hideClose={true}
                      />
                    </div>
                  </div>

                  <Summary
                    summary={summary}
                    dateLabel={dateLabel}
                    onFileGstr1={() =>
                      onTabChange({ name: "Reports", key: "reports" })
                    }
                  />

                  {/* GST sub-nav. theme-2 uses the segmented tray (white card +
                      cream track, same as the subscribe sub-nav); other themes keep
                      the underline bar. */}
                  <AppTab
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={onTabChange}
                    className={
                      isTheme2
                        ? "edge-tabs app-tabs-tray tw:mb-4"
                        : "edge-tabs tw:mb-4"
                    }
                    variant={isTheme2 ? "tabs" : "underline"}
                  />
                  <Outlet />
                </AppPaneMain>

                {/* Side column — only rendered while the theme-2 split layout
                    is active (lg+), where the CSS re-homes it as the fixed list
                    pane beside the icon rail. Mirrors the accounts section side
                    pane with quick-nav chips, payables/receivables snapshot and
                    recent events. */}
                <AppPaneSide className="app-pane-only">
                  <PaneTitle title="Reports" className="tw:px-1" />
                  <AccountsNavChips />
                  <PayablesReceivablesSummary />
                  <RecentEvents />
                </AppPaneSide>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Layout;
