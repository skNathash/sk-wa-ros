import { useState } from "react";
import BottomTab from "~/components/core/bottom-tab/BottomTab";
import type { TabItem } from "~/types/CommonTypes";
import AccountsHeader from "./components/AccountsHeader";
import ChatFeed from "./components/ChatFeed";
import Composer from "./components/Composer";
import SummaryStrip from "./components/SummaryStrip";
import { accountsSummary } from "./data";

const TABS: TabItem[] = [
  { key: "home", name: "Home" },
  { key: "in", name: "In", count: 8 },
  { key: "out", name: "Out", count: 5 },
  { key: "reports", name: "Reports" },
];

/** Which direction each tab narrows the feed to. Tabs not listed show it all. */
const FEED_FILTER: Record<string, "all" | "in" | "out"> = {
  home: "all",
  in: "in",
  out: "out",
};

/**
 * Accounts ledger as a WhatsApp-style chat: money in arrives as green "sent"
 * bubbles on the right, money out as white bubbles on the left, over the
 * theme-2 chat wallpaper. Static UI for now.
 *
 * This is a standalone full-screen route (outside the sidebar layout) — it
 * carries its own header and a composer where the bottom tab bar would sit.
 */
const OsAccountsMain = () => {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <div className="tw:flex tw:h-dvh tw:flex-col tw:overflow-hidden tw:bg-[color:var(--wa-paper)]">
      <AccountsHeader
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        title="My Accounts"
        dateLabel={accountsSummary.dateLabel}
      />
      <SummaryStrip />
      <ChatFeed filter={FEED_FILTER[activeTab] ?? "all"} />
      <Composer />
      {/* App-wide theme-2 navigation. `.bottom-tab` is display:none outside
          theme-2, so it self-gates — no theme check needed here. */}
      <BottomTab />
    </div>
  );
};

export default OsAccountsMain;
