import { endOfMonth, format, startOfMonth, sub } from "date-fns";
import { useMemo, useEffect } from "react";
import type { DayPickerProps } from "react-day-picker";
import { useTranslation } from "react-i18next";
import { Outlet, useSearchParams, useLocation } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppDateInput from "~/components/core/form/AppDateInput";
import AppSelect from "~/components/core/form/AppSelect";
import AppButton from "~/components/core/button/AppButton";
import AppHeader from "~/components/core/header/AppHeader";
import PageDescription from "~/components/core/page-description/PageDescription";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import PageAccessService from "~/services/PageAccessService";
import type { BreadcrumbItem, TabItem } from "~/types/CommonTypes";
import {
  Plus,
  BarChart2,
  FileText,
  CreditCard,
  DollarSign,
  ClipboardList,
  IndianRupee,
} from "lucide-react";
import MiscService from "~/services/MiscService";
import FranchiseService from "~/services/FranchiseService";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";

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

const tabs: TabItem[] = [
  {
    langKey: "payablesSlashReceivables",
    name: "Payables",
    icon: <IndianRupee />,
    key: "payables",
  },
  {
    langKey: "overallStatement",
    name: "Overall Statement",
    icon: <BarChart2 />,
    key: "overall-statement",
  },
  {
    langKey: "platformFee",
    name: "Commission Invoices",
    icon: <FileText />,
    key: "commission-invoices",
  },
  {
    langKey: "myBalanceStatement",
    name: "My Balance Statement",
    icon: <CreditCard />,
    key: "sk-statement",
  },
  {
    langKey: "gstReports",
    name: "GST Reports",
    icon: <FileText />,
    key: "gst-reports",
  },
  // {
  //   langKey: "revenue",
  //   name: "Revenue",
  //   key: "revenue",
  // },
  // {
  //   langKey: "transactions",
  //   name: "Transactions",
  //   key: "transactions",
  // },
];

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    langKey: "dashboard",
    redirect: {
      path: "/dashboard",
    },
  },
  {
    label: "Accounts Summary",
    langKey: "accountsSummary",
  },
];

const getLink = (tab: TabItem, dateFrom: string, dateTo: string) => {
  let path = "";
  let params = {};
  if (tab.key === "revenue") {
    path = `/dashboard/accounts/revenue`;
    params = {
      tab: tab.key,
    };
  } else if (tab.key === "payables") {
    path = `/dashboard/accounts/payables`;
    params = {
      tab: tab.key,
    };
  } else if (tab.key === "transactions") {
    path = `/dashboard/accounts/transactions`;
    params = {
      tab: tab.key,
    };
  } else if (tab.key === "overall-statement") {
    path = `/dashboard/accounts/overall-statement`;
    params = {
      tab: tab.key,
    };
  } else if (tab.key === "summary") {
    path = `/dashboard/accounts/summary`;
    params = {
      tab: tab.key,
    };
  } else if (tab.key === "sk-statement") {
    path = `/dashboard/accounts/sk-statement`;
    params = {
      tab: tab.key,
    };
  } else if (tab.key === "commission-invoices") {
    path = `/dashboard/accounts/platform-fee`;
    params = {
      tab: tab.key,
    };
  } else if (tab.key === "gst-reports") {
    path = `/dashboard/reports/gst-dashboard/products-level`;
  } else {
    path = `/dashboard/accounts/overview`;
    params = {
      tab: tab.key,
    };
  }
  return {
    path,
    params,
  };
};

const AccountsLayout = () => {
  const { t } = useTranslation(["common", "menu"]);
  const appNav = useAppNav();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const hideDateSelect = location.pathname === "/dashboard/accounts/payables";
  const hideDepositMoney =
    location.pathname === "/dashboard/accounts/platform-fee/statement";
  const activeTab = searchParams.get("tab") || "revenue";

  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  // With an active plan: platform fee tab stays 3rd with an "Active" badge.
  // Without a plan: move the platform fee tab to the first position.
  const orderedTabs = useMemo(() => {
    if (FranchiseService.isActivePlanAvailable()) {
      return tabs.map((tab) =>
        tab.key === "commission-invoices"
          ? { ...tab, badge: t("active", "Active") }
          : tab,
      );
    }
    const platformFeeTab = tabs.find((t) => t.key === "commission-invoices");
    const otherTabs = tabs.filter((t) => t.key !== "commission-invoices");
    return platformFeeTab ? [platformFeeTab, ...otherTabs] : tabs;
  }, [t]);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const defaultStart = startOfMonth(sub(now, { months: 3 }));

  const dateRange = [
    dateFrom ? new Date(dateFrom) : defaultStart,
    dateTo ? new Date(dateTo) : today,
  ];

  const handleTabChange = (tab: TabItem) => {
    const { path, params } = getLink(tab);

    appNav.to(path, {
      ...params,
      dateFrom: format(dateRange[0], "yyyy-MM-dd"),
      dateTo: format(dateRange[1], "yyyy-MM-dd"),
    });
  };

  const handleDateChange = (value: Date | Date[]) => {
    const currentTab = tabs.find((t) => t.key === activeTab);

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
    const currentTab = tabs.find((t) => t.key === activeTab);
    const { path, params } = getLink(currentTab as TabItem);

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
  }, [dateFrom, dateTo, activeTab, setSearchParams, today, now]);

  return (
    <>
      <AppHeader
        title={t("accountsSummary")}
        showAudioNote={true}
        audioFeature="accountSummary"
        audioNoteTitle="Learn about account Summary"
      />
      <div className="app-page page-bg tw:p-4">
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
          <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:md:items-center tw:mb-4">
            <div>
              <AppBreadcrumbs data={breadcrumbs} />
              <PageDescription description="accountSummary" />
            </div>
            {!hideDateSelect && (
              <div className="tw:flex tw:items-center tw:md:justify-end tw:gap-2 tw:mt-2 tw:md:mt-0">
                {/* <div className="tw:w-auto">
                  <AppSelect
                    options={presetOptions}
                    onChange={handlePresetChange}
                    placeholder={t("select")}
                    size="sm"
                    value={selectedPreset}
                  />
                </div> */}
                <div>
                  <AppDateInput
                    callback={handleDateChange}
                    value={dateRange}
                    dateConfig={dateConfig}
                    size="sm"
                    hideClose={true}
                  />
                </div>
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
              </div>
            )}
          </div>
          {/* <Summary /> */}
          <AppTab
            activeTab={activeTab}
            tabs={orderedTabs}
            onTabChange={handleTabChange}
            className="tw:mb-4"
          />
          <Outlet />
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
