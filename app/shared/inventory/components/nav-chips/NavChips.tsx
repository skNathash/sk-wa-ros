import clsx from "clsx";
import { useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import type { SwiperOptions } from "swiper/types";
import AppSwiper from "~/components/core/swiper";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import type { TabItem } from "~/types/CommonTypes";

export interface NavChipItem {
  /** Stable key for React and selection tracking. */
  key: string;
  /** Already-translated label shown on the chip. */
  label: string;
  /** Route pushed via appNav when the chip is tapped. */
  path: string;
  /** Optional leading icon (e.g. a lucide element). */
  icon?: ReactNode;
  /** Marks the chip as the current view — filled with the brand tone. */
  active?: boolean;
}

interface NavChipsProps {
  className?: string;
}

const swiperConfig: SwiperOptions = {
  spaceBetween: 8,
  freeMode: true,
  slidesPerView: "auto",
};

/**
 * A horizontal strip of small pill buttons for quick navigation between the
 * inventory/catalog views (All Items / Menus / Brands / Categories). The chip
 * set is fixed and owned by this component; the active chip is resolved from
 * the current URL. Resting chips are neutral; the `active` chip fills with the
 * brand tone. Inactive products are filtered via StockChips on the list page.
 */
const NavChips = ({ className }: NavChipsProps) => {
  const appNav = useAppNav();
  const { t } = useTranslation();
  const location = useLocation();
  const isMenusPage = location.pathname === "/dashboard/inventory/menus";
  const isBrandsPage =
    location.pathname === "/dashboard/inventory/browse-brand";
  const isCategoriesPage =
    location.pathname === "/dashboard/inventory/browse-category";
  const isProductsListPage =
    location.pathname === "/dashboard/inventory/products/list";

  const items: TabItem[] = [
    {
      key: "all-items",
      name: t("allItems", { defaultValue: "All Items" }),
    },
    {
      key: "menus",
      name: t("menus"),
    },
    {
      key: "brands",
      name: t("brands"),
    },
    {
      key: "categories",
      name: t("categories"),
    },
  ];

  const handleTabChange = (tab: TabItem) => {
    if (tab.key === "all-items") {
      appNav.to("/dashboard/inventory/products/list");
    } else if (tab.key === "menus") {
      appNav.to("/dashboard/inventory/menus");
    } else if (tab.key === "brands") {
      appNav.to("/dashboard/inventory/browse-brand");
    } else if (tab.key === "categories") {
      appNav.to("/dashboard/inventory/browse-category");
    }
  };

  const activeTabKey = useMemo(() => {
    if (isProductsListPage) {
      return "all-items";
    } else if (isMenusPage) {
      return "menus";
    } else if (isBrandsPage) {
      return "brands";
    } else if (isCategoriesPage) {
      return "categories";
    }
  }, [isBrandsPage, isCategoriesPage, isMenusPage, isProductsListPage]);

  if (1) {
    return (
      <AppTab
        tabs={items}
        activeTab={activeTabKey || ""}
        onTabChange={handleTabChange}
        variant="pills"
      />
    );
  }

  return (
    <AppSwiper config={swiperConfig} className={className}>
      {items.map((item) => (
        <AppSwiper.Slide key={item.key} isAutoWidth>
          <button
            type="button"
            onClick={() => appNav.to(item.path)}
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
        </AppSwiper.Slide>
      ))}
    </AppSwiper>
  );
};

export default NavChips;
