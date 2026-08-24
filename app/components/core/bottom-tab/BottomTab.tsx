import clsx from "clsx";
import {
  House,
  LayoutGrid,
  ReceiptText,
  Store,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";

type TabItem = {
  key: string;
  label: string;
  path: string;
  icon: LucideIcon;
  /** Center elevated action button (FAB style) */
  primary?: boolean;
};

/** Top-level app sections. Shared with the desktop header nav chips
 *  ({@link HeaderNavChips}) so both navs stay in sync. */
export const TABS: TabItem[] = [
  { key: "home", label: "Home", path: "/dashboard/main", icon: House },
  {
    key: "catalog",
    label: "Catalog",
    path: "/dashboard/inventory/dashboard",
    icon: LayoutGrid,
  },
  {
    key: "bill",
    label: "Bill",
    path: "/pos/billing",
    icon: ReceiptText,
    primary: true,
  },
  {
    key: "business",
    label: "Business",
    path: "/dashboard/network/management/b2c-customers?tab=b2c-customers",
    icon: Store,
  },
  {
    key: "supply",
    label: "Supply",
    path: "/dashboard/insight",
    icon: Truck,
  },
];

export const isTabActive = (pathname: string, path: string) =>
  pathname === path || pathname.startsWith(`${path}/`);

const BottomTab = () => {
  const { t } = useTranslation();
  const location = useLocation();

  // z-40, not z-50: dialogs/sheets render their overlay at z-50, and an equal
  // z-index would leave this opaque bar sitting undimmed on top of it.
  return (
    <nav className="bottom-tab tw:sticky tw:bottom-0 tw:left-0 tw:right-0 tw:z-40 tw:bg-white tw:border-t tw:border-gray-200 tw:pb-[env(safe-area-inset-bottom)]">
      <ul className="tw:flex tw:items-end tw:justify-between tw:px-2 tw:h-16">
        {TABS.map((tab) => {
          const active = isTabActive(location.pathname, tab.path);
          const Icon = tab.icon;

          if (tab.primary) {
            return (
              <li key={tab.key} className="tw:flex-1">
                <Link
                  to={tab.path}
                  className="tw:flex tw:flex-col tw:items-center tw:-mt-6"
                >
                  <span className="tw:flex tw:items-center tw:justify-center tw:w-14 tw:h-14 tw:rounded-full tw:bg-green-500 tw:text-white tw:shadow-lg tw:shadow-green-500/40 tw:ring-4 tw:ring-green-100">
                    <Icon className="tw:w-6 tw:h-6" />
                  </span>
                  <span className="tw:mt-1 tw:text-xs tw:font-medium tw:text-green-600">
                    {t(tab.label, tab.label)}
                  </span>
                </Link>
              </li>
            );
          }

          return (
            <li key={tab.key} className="tw:flex-1">
              <Link
                to={tab.path}
                className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-1 tw:py-2"
              >
                <Icon
                  className={clsx("tw:w-6 tw:h-6", {
                    "tw:text-green-600": active,
                    "tw:text-gray-500": !active,
                  })}
                />
                <span
                  className={clsx("tw:text-xs", {
                    "tw:font-semibold tw:text-green-600": active,
                    "tw:font-medium tw:text-gray-500": !active,
                  })}
                >
                  {t(tab.label, tab.label)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default BottomTab;
