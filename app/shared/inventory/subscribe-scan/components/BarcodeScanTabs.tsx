import { ScanLine, ScanBarcode, History } from "lucide-react";
import React from "react";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import useTheme from "~/hooks/useTheme";
import type { TabItem } from "~/types/CommonTypes";

export type BarcodeScanTabKey = "single" | "bulk" | "items";

interface BarcodeScanTabsProps {
  activeTab: BarcodeScanTabKey;
  className?: string;
}

const tabItems: TabItem[] = [
  {
    key: "single",
    name: "Single Scan",
    icon: <ScanLine size={18} />,
  },
  {
    key: "bulk",
    name: "Bulk Scan",
    icon: <ScanBarcode size={18} />,
  },
  {
    key: "items",
    name: "Scan Results",
    icon: <History size={18} />,
  },
];

const routeByKey: Record<BarcodeScanTabKey, string> = {
  single: "/dashboard/inventory/barcode-scan",
  bulk: "/dashboard/inventory/barcode-scan-bulk",
  items: "/dashboard/inventory/barcode-scan-bulk-items",
};

/**
 * Sub-nav for the barcode scan surfaces, styled like the subscribe sub-nav:
 * a sticky pill chip strip on a white band on mobile, and the sticky segmented
 * tab row from md up (see `.app-nav-chips` / `.subscribe-tabs-sticky` in
 * app.css). Only one of the two is visible at a time.
 */
const BarcodeScanTabs: React.FC<BarcodeScanTabsProps> = ({
  activeTab,
  className,
}) => {
  const appNav = useAppNav();
  const { isMobile } = useScreenView();
  // theme-2 desktop reads the sub-nav as free-standing pills (the filled brand
  // chip), not the grey segmented bar the other themes use.
  const isTheme2 = useTheme() === "theme-2";

  const handleTabChange = (tab: TabItem) => {
    if (tab.key === activeTab) return;
    const path = routeByKey[tab.key as BarcodeScanTabKey];
    if (path) appNav.to(path);
  };

  return (
    <>
      {/* Mobile — chip strip pinned under the app header. It ignores the
          caller's `className`: those are the desktop row's margins, and the
          strip has to sit flush against the header (`app-nav-chips-flush`). */}
      <AppTab
        tabs={tabItems}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        variant="pills"
        className="app-nav-chips app-nav-chips-flush tw:mb-2 tw:md:hidden"
        // Mobile only: the white band has no side padding (so the track scrolls
        // edge to edge) and the swiper supplies the leading/trailing inset.
        slideOffset={isMobile ? 16 : 0}
      />

      {/* md+ — pill row in theme-2, the segmented row (matching the subscribe
          desktop sub-nav) everywhere else. */}
      <AppTab
        tabs={tabItems}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        variant={isTheme2 ? "pills" : "tabs"}
        className={`tw:hidden tw:md:block subscribe-tabs-sticky ${
          isTheme2 ? "barcode-tabs-pills" : ""
        } ${className || ""}`}
      />
    </>
  );
};

export default BarcodeScanTabs;
