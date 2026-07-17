import { Boxes, Package } from "lucide-react";
import { useLocation } from "react-router";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
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
      className={className}
    />
  );
};

export default BarcodeTabs;
