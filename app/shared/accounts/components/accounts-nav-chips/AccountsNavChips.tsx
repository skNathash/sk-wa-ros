import clsx from "clsx";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart2,
  CreditCard,
  FileText,
  IndianRupee,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { ReactNode } from "react";
import { useLocation, useSearchParams } from "react-router";
import useAppNav from "~/hooks/useAppNav";

interface AccountsNavChipItem {
  /** Stable key for React and selection tracking. */
  key: string;
  /** Label shown on the chip. */
  label: string;
  /** Route pushed via appNav when the chip is tapped. */
  path: string;
  /** Optional query params appended to the route. */
  params?: Record<string, any>;
  /** Leading icon. */
  icon: ReactNode;
  /** Marks the chip as the current view — filled with the brand tone. */
  active: boolean;
}

interface AccountsNavChipsProps {
  className?: string;
}

/**
 * Quick-nav chips over the accounts sub-sections (Overview, Payables,
 * Receivables, Profit & Loss, Platform Fee, SK Wallet, GST Reports). The chip
 * set is fixed and owned by this component; the active chip is resolved from
 * the current URL. Resting chips are neutral; the active chip fills with the
 * brand tone (shared `app-nav-chip` styling — see theme-2.css).
 *
 * Rendered inside the accounts side pane (`AppPaneSide`) on theme-2 desktop,
 * where it replaces the horizontal tab bar hidden by `app-pane-hide`.
 */
const AccountsNavChips = ({ className }: AccountsNavChipsProps) => {
  const appNav = useAppNav();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const path = location.pathname;
  const isPayablesPage = path === "/dashboard/accounts/payables";
  const isReceivablesView = searchParams.get("view") === "receivables";

  const items: AccountsNavChipItem[] = [
    {
      key: "overview",
      label: "Overview",
      path: "/dashboard/accounts/overall-statement",
      icon: <BarChart2 size={16} />,
      active: path === "/dashboard/accounts/overall-statement",
    },
    {
      key: "money-in",
      label: "Money in",
      path: "/dashboard/accounts/money-in",
      icon: <ArrowDownLeft size={16} />,
      active: path === "/dashboard/accounts/money-in",
    },
    {
      key: "money-out",
      label: "Money out",
      path: "/dashboard/accounts/money-out",
      icon: <ArrowUpRight size={16} />,
      active: path === "/dashboard/accounts/money-out",
    },
    {
      key: "payables",
      label: "Payables",
      path: "/dashboard/accounts/payables",
      params: { view: "payables" },
      icon: <IndianRupee size={16} />,
      active: isPayablesPage && !isReceivablesView,
    },
    {
      key: "receivables",
      label: "Receivables",
      path: "/dashboard/accounts/payables",
      params: { view: "receivables" },
      icon: <IndianRupee size={16} />,
      active: isPayablesPage && isReceivablesView,
    },
    {
      key: "profit-loss",
      label: "Profit & Loss",
      path: "/dashboard/accounts/profit-loss",
      icon: <TrendingUp size={16} />,
      active: path === "/dashboard/accounts/profit-loss",
    },
    {
      key: "platform-fee",
      label: "Platform Fee",
      path: "/dashboard/accounts/platform-fee",
      icon: <FileText size={16} />,
      active: path.startsWith("/dashboard/accounts/platform-fee"),
    },
    {
      key: "sk-wallet",
      label: "SK Wallet",
      path: "/dashboard/accounts/sk-statement",
      icon: <Wallet size={16} />,
      active: path === "/dashboard/accounts/sk-statement",
    },
    {
      key: "gst-reports",
      label: "GST Reports",
      path: "/dashboard/reports/gst-dashboard/products-level",
      params: { from: "accounts" },
      icon: <CreditCard size={16} />,
      active: path.startsWith("/dashboard/reports/gst-dashboard"),
    },
  ];

  return (
    <div className={clsx("tw:flex tw:flex-wrap tw:gap-2", className)}>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => appNav.to(item.path, item.params)}
          className={clsx(
            "app-nav-chip tw:inline-flex tw:cursor-pointer tw:items-center tw:gap-1.5 tw:whitespace-nowrap tw:rounded-lg tw:border tw:px-2.5 tw:py-1.5 tw:text-xs tw:font-medium tw:transition-colors",
            item.active
              ? "app-nav-chip-active tw:bg-slate-900 tw:text-white tw:border-slate-900 tw:shadow-sm"
              : "tw:border-slate-200 tw:bg-white tw:text-slate-700 tw:hover:bg-slate-50",
          )}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
};

export default AccountsNavChips;
