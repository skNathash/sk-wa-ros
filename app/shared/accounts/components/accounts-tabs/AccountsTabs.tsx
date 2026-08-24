import { format, startOfMonth, sub } from "date-fns";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useSearchParams } from "react-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart2,
  CreditCard,
  FileText,
  IndianRupee,
  TrendingUp,
} from "lucide-react";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import useTheme from "~/hooks/useTheme";
import FranchiseService from "~/services/FranchiseService";
import type { TabItem } from "~/types/CommonTypes";
import {
  ACCOUNTS_SUB_TAB_PARAM,
  getAccountsSubTabConfig,
  getAccountsSubTabKey,
  isAccountsTabsHidden,
  type AccountsSubTab,
} from "./helper";

export const accountsTabs: TabItem[] = [
  {
    langKey: "overallStatement",
    name: "Overall Statement",
    icon: <BarChart2 />,
    key: "overall-statement",
  },
  {
    langKey: "moneyIn",
    name: "Money In",
    icon: <ArrowDownLeft />,
    key: "money-in",
  },
  {
    langKey: "moneyOut",
    name: "Money Out",
    icon: <ArrowUpRight />,
    key: "money-out",
  },
  {
    langKey: "payablesSlashReceivables",
    name: "Payables",
    icon: <IndianRupee />,
    key: "payables",
  },
  {
    langKey: "profitAndLoss",
    name: "Profit & Loss",
    icon: <TrendingUp />,
    key: "profit-loss",
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
];

// `from: "accounts"` tells the GST dashboard the user arrived via the accounts
// section, so it can keep showing these tabs there.
export const getAccountsTabLink = (tab: TabItem) => {
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
  } else if (tab.key === "money-in") {
    path = `/dashboard/accounts/money-in`;
    params = {
      tab: tab.key,
    };
  } else if (tab.key === "money-out") {
    path = `/dashboard/accounts/money-out`;
    params = {
      tab: tab.key,
    };
  } else if (tab.key === "profit-loss") {
    path = `/dashboard/accounts/profit-loss`;
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
    params = {
      from: "accounts",
    };
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

type AccountsTabsProps = {
  activeTab: string;
  className?: string;
  variant?: "tabs" | "pills" | "underline" | "chips";
};

const AccountsTabs = ({
  activeTab,
  className,
  variant,
}: AccountsTabsProps) => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const isTheme2 = useTheme() === "theme-2";

  /* Theme-2 hands this tray over to the current page: the section is already
     switched by the side pane chips (desktop) and the section tab bar (mobile),
     so the tray carries that page's own views instead. Pages with no tray
     configured (payables, balance statement, commission invoices) keep the
     section tabs, which are the only way back out of them. */
  const subTabConfig = isTheme2
    ? getAccountsSubTabConfig(location.pathname)
    : undefined;
  const activeSubTab = getAccountsSubTabKey(
    location.pathname,
    searchParams.get(ACCOUNTS_SUB_TAB_PARAM),
  );

  const handleSubTabChange = (tab: TabItem) => {
    const subTab = tab as AccountsSubTab;

    if (subTab.redirect) {
      appNav.to(subTab.redirect.path, subTab.redirect.params);
      return;
    }

    if (subTab.key === activeSubTab) return;

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set(ACCOUNTS_SUB_TAB_PARAM, subTab.key);
        return next;
      },
      { replace: true },
    );
  };

  // With an active plan: platform fee tab stays 3rd with an "Active" badge.
  // Without a plan: move the platform fee tab to the first position.
  const orderedTabs = useMemo(() => {
    if (FranchiseService.isActivePlanAvailable()) {
      return accountsTabs.map((tab) =>
        tab.key === "commission-invoices"
          ? { ...tab, badge: t("active", "Active") }
          : tab,
      );
    }
    const platformFeeTab = accountsTabs.find(
      (tab) => tab.key === "commission-invoices",
    );
    const otherTabs = accountsTabs.filter(
      (tab) => tab.key !== "commission-invoices",
    );
    return platformFeeTab ? [platformFeeTab, ...otherTabs] : accountsTabs;
  }, [t]);

  const handleTabChange = (tab: TabItem) => {
    const { path, params } = getAccountsTabLink(tab);

    /* Theme-2 P&L reads its period off its own tab tray, so carrying the shared
       range over would only leave dead params in the URL for the layout to
       strip again. */
    if (isTheme2 && tab.key === "profit-loss") {
      appNav.to(path, params);
      return;
    }

    const now = new Date();
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    appNav.to(path, {
      ...params,
      dateFrom:
        dateFrom || format(startOfMonth(sub(now, { months: 3 })), "yyyy-MM-dd"),
      dateTo: dateTo || format(now, "yyyy-MM-dd"),
    });
  };

  // Overview is the section's landing page — it has nothing to sub-divide, and
  // the section nav already has it selected.
  if (isTheme2 && isAccountsTabsHidden(location.pathname)) return null;

  if (subTabConfig) {
    return (
      <AppTab
        activeTab={activeSubTab}
        tabs={subTabConfig.tabs}
        onTabChange={handleSubTabChange}
        className={className}
        variant={variant ?? (isTheme2 ? "underline" : "tabs")}
        scrollable
      />
    );
  }

  return (
    <AppTab
      activeTab={activeTab}
      tabs={orderedTabs}
      onTabChange={handleTabChange}
      className={className}
      variant={variant}
    />
  );
};

export default AccountsTabs;
