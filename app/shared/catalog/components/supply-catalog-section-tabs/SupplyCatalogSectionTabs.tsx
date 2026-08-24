import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { DEFAULT_BROWSE_DISTANCE } from "~/constants";
import useAppNav from "~/hooks/useAppNav";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import type { SectionTab } from "~/types/CommonTypes";

export type SupplyCatalogSectionTabKey = "discover" | "reorder" | "compare";

interface SupplyCatalogSectionTabsProps {
  /** Key of the active tab; omit on pages that map to none of them. */
  activeTab?: SupplyCatalogSectionTabKey | "";
  className?: string;
  /** Extra classes on the sticky wrapper — use for page-level spacing. */
  outerClassName?: string;
}

const TABS: SectionTab[] = [
  {
    label: "Discover",
    key: "discover",
    icon: "compass",
    description: "Browse products near you",
    redirect: { url: "/products/main" },
  },
  {
    label: "Reorder",
    key: "reorder",
    icon: "refresh-cw",
    description: "Buy again from your sellers",
    redirect: {
      url: "/products/buy-from-other-retailer/products/reorder",
    },
  },
  {
    label: "Compare",
    key: "compare",
    icon: "git-compare",
    description: "Compare sellers near you",
    redirect: {
      url: "/products/buy-from-other-retailer/products/feature",
      params: { from: "compare", key: "price-drops" },
    },
  },
];

/**
 * Supply-catalog tab bar (Discover / Reorder / Compare) for the buy-from-network
 * flow. Sticks under the app header in theme-2 mobile, matching
 * {@link PoSectionTabs}.
 */
const SupplyCatalogSectionTabs = ({
  activeTab = "",
  className,
  outerClassName,
}: SupplyCatalogSectionTabsProps) => {
  const appNav = useAppNav();
  const [searchParams] = useSearchParams();

  // Carry the distance filter across catalog destinations so Discover / Reorder
  // / Compare stay scoped to the same nearby radius.
  const handleTabChange = useMemo(
    () => (tab: SectionTab) => {
      const rawDistance =
        searchParams.get("distance") || DEFAULT_BROWSE_DISTANCE;
      const distance =
        rawDistance === "all" ? "all" : Number(rawDistance);

      appNav.to(tab.redirect.url, {
        ...tab.redirect.params,
        distance,
      });
    },
    [appNav, searchParams],
  );

  return (
    <SectionTabs
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      className={className}
      outerClassName={outerClassName}
      noShadow
      sticky
    />
  );
};

export default SupplyCatalogSectionTabs;
