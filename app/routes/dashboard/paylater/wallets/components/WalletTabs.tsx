import { Building2, Users, Wallet } from "lucide-react";
import React from "react";
import { useSearchParams } from "react-router";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import useTheme from "~/hooks/useTheme";
import type { TabItem } from "~/types/CommonTypes";

export type WalletTabKey = "all" | "b2b" | "b2c";

interface WalletTabsProps {
  activeTab: WalletTabKey;
  className?: string;
}

const tabItems: TabItem[] = [
  { key: "all", name: "All", icon: <Wallet size={18} /> },
  { key: "b2b", name: "B2B", icon: <Building2 size={18} /> },
  { key: "b2c", name: "B2C", icon: <Users size={18} /> },
];

// Which layout tab each wallet slice belongs to, so the PayLater sub-nav above
// keeps pointing at the right section after a switch.
const layoutTabByKey: Record<WalletTabKey, string> = {
  all: "all-wallets",
  b2b: "b2b-wallets",
  b2c: "b2c-wallets",
};

/**
 * Sub-nav for the wallet list — All / B2B / B2C — styled like the barcode scan
 * sub-nav: a segmented row from md up, pills in theme-2. Desktop only.
 */
const WalletTabs: React.FC<WalletTabsProps> = ({ activeTab, className }) => {
  const appNav = useAppNav();
  const isTheme2 = useTheme() === "theme-2";
  const [searchParams] = useSearchParams();

  const handleTabChange = (tab: TabItem) => {
    const key = tab.key as WalletTabKey;
    if (key === activeTab) return;

    // The status filter is part of what the seller is looking at (it arrives
    // from the analytics/pane chips), so carry it across the switch.
    const status = searchParams.get("status");
    appNav.to(`/dashboard/paylater/wallets/${key}`, {
      tab: layoutTabByKey[key],
      ...(status ? { status } : {}),
    });
  };

  return (
    // md+ only — on mobile the layout's own chip band already carries the
    // section sub-nav, so a second strip under it just eats screen.
    <AppTab
      tabs={tabItems}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      variant={isTheme2 ? "pills" : "tabs"}
      className={`tw:hidden tw:md:block ${
        isTheme2 ? "barcode-tabs-pills" : ""
      } ${className || ""}`}
    />
  );
};

export default WalletTabs;
