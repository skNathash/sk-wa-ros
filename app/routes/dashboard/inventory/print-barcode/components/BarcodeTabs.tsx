import { Boxes, Package } from "lucide-react";
import { useLocation } from "react-router";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import useTheme from "~/hooks/useTheme";
import type { TabItem } from "~/types/CommonTypes";

export type BarcodeTabKey = "single" | "bulk";

const TABS: (TabItem & { key: BarcodeTabKey; path: string })[] = [
  {
    key: "single",
    name: "Single Product",
    icon: <Package />,
    path: "/dashboard/inventory/print-barcode",
  },
  {
    key: "bulk",
    name: "Bulk Product",
    icon: <Boxes />,
    path: "/dashboard/inventory/print-barcode/bulk",
  },
];

type Props = {
  /** Explicitly mark the active tab. Falls back to the current route. */
  active?: BarcodeTabKey;
  className?: string;
};

const BarcodeTabs = ({ active, className }: Props) => {
  const appNav = useAppNav();
  const location = useLocation();
  const theme = useTheme();
  const isTheme2 = theme === "theme-2";

  const activeKey: BarcodeTabKey =
    active ??
    (location.pathname.includes("/print-barcode/bulk") ? "bulk" : "single");

  const handleTabChange = (tab: TabItem) => {
    const target = TABS.find((t) => t.key === tab.key);
    if (target && target.key !== activeKey) appNav.to(target.path);
  };

  return (
    <AppTab
      tabs={TABS}
      activeTab={activeKey}
      onTabChange={handleTabChange}
      variant={isTheme2 ? "pills" : "tabs"}
      // theme-2 takes the shared pill band (`barcode-tabs-pills`) — the pills
      // paint no ground of their own, so the class gives the row the flat card
      // fill + hairline the other sub-navs use.
      className={`${className ?? ""} ${isTheme2 ? "barcode-tabs-pills" : ""}`}
    />
  );
};

export default BarcodeTabs;
