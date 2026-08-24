import {
  Award,
  Clock,
  Compass,
  LayoutGrid,
  ListTree,
  MapPin,
  Package,
  Search,
} from "lucide-react";
import React, { useMemo } from "react";
import { useLocation, useSearchParams } from "react-router";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import type { TabItem } from "~/types/CommonTypes";

/** Keys of the fixed chip set — one per subscribe/catalog browse surface. */
export type SubscribeNavChipKey =
  | "discover"
  | "search"
  | "un-brands"
  | "in-and-around"
  | "menus"
  | "categories"
  | "brands"
  | "history";

interface SubscribeNavChipsProps {
  className?: string;
}

/** `version=old` keeps the legacy "Create My Catalog" flow's breadcrumb intact. */
const SUBSCRIBE_VERSION_OLD = "old";

const BASE = "/dashboard/inventory/subscribe";

/**
 * Destination for each chip. The `tab` query param is kept because the
 * subscribe layout / side pane still resolve their own active state from it.
 */
const CHIP_PATHS: Record<SubscribeNavChipKey, string> = {
  discover: `${BASE}/discover?tab=discover`,
  search: `${BASE}/search?tab=search`,
  "un-brands": `${BASE}/un-brands?tab=un-brands`,
  "in-and-around": `${BASE}/search?tab=top&sortType=popular&radiusKms=5`,
  menus: `${BASE}/menus?tab=menus`,
  categories: `${BASE}/browse-category?tab=categories`,
  brands: `${BASE}/browse-brands?tab=brands`,
  history: `${BASE}/approval-history/products?tab=history`,
};

const items: TabItem[] = [
  { key: "discover", name: "Discover", icon: <Compass /> },
  { key: "search", name: "Search", icon: <Search /> },
  { key: "un-brands", name: "Unbranded", icon: <Package /> },
  { key: "in-and-around", name: "In & Around", icon: <MapPin /> },
  { key: "menus", name: "Menus", icon: <ListTree /> },
  { key: "categories", name: "Category", icon: <LayoutGrid /> },
  { key: "brands", name: "Brands", icon: <Award /> },
  { key: "history", name: "History", icon: <Clock /> },
];

/**
 * A horizontal strip of pill buttons for quick navigation between the subscribe
 * (Create My Catalog) browse surfaces. The chip set is fixed and owned by this
 * component; the active chip is resolved from the current URL, so pages only
 * have to render it. Mirrors the inventory `NavChips` strip.
 *
 * Mobile only — it replaces the section tab bar on these pages, pinning under
 * the app header on a white band as the page scrolls (see `.subscribe-nav-chips`
 * in app.css). From md up the section menu / side pane carry the same links.
 */
const SubscribeNavChips: React.FC<SubscribeNavChipsProps> = ({ className }) => {
  const appNav = useAppNav();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isMobile } = useScreenView();

  // Carry the active flow across chip navigation so the breadcrumb keeps
  // resolving back to the right "Create My Catalog" landing.
  const version = searchParams.get("version");
  const versionSuffix =
    version === SUBSCRIBE_VERSION_OLD ? `&version=${version}` : "";

  const tab = searchParams.get("tab");

  const activeKey = useMemo<SubscribeNavChipKey | "">(() => {
    const path = location.pathname;
    // The "Create My Catalog" landing (`/main`) has no chip of its own — it is
    // the entry point into the same browse surfaces, so it reads as Discover.
    if (path.includes(`${BASE}/discover`) || path.includes(`${BASE}/main`))
      return "discover";
    if (path.includes(`${BASE}/un-brands`)) return "un-brands";
    if (path.includes(`${BASE}/menus`)) return "menus";
    if (path.includes(`${BASE}/browse-category`)) return "categories";
    if (path.includes(`${BASE}/browse-brands`)) return "brands";
    if (path.includes(`${BASE}/approval-history`)) return "history";
    // The search route backs both the plain search and the "near me" view; the
    // `tab` param is the only thing that separates them.
    if (path.includes(`${BASE}/search`)) {
      return tab === "top" ? "in-and-around" : "search";
    }
    return "";
  }, [location.pathname, tab]);

  const handleTabChange = (item: TabItem) => {
    const path = CHIP_PATHS[item.key as SubscribeNavChipKey];
    if (path) {
      appNav.to(`${path}${versionSuffix}`);
    }
  };

  return (
    <AppTab
      tabs={items}
      activeTab={activeKey}
      onTabChange={handleTabChange}
      variant="pills"
      className={`subscribe-nav-chips ${className || ""}`}
      // Mobile only: the white band has no side padding (so the track scrolls
      // edge to edge), and the swiper supplies the leading/trailing inset
      // instead, keeping the first chip aligned with the page gutter while
      // chips scroll under it. From md up the strip is hidden anyway.
      slideOffset={isMobile ? 16 : 0}
    />
  );
};

export default SubscribeNavChips;
