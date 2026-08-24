import {
  ChartNoAxesColumn,
  ListOrdered,
  Settings,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useSearchParams } from "react-router";
import useAppNav from "~/hooks/useAppNav";
import LoyaltyPointService, {
  type CoinSectionTab,
  type CoinSectionTabKey,
} from "~/services/LoyaltyPointService";
import PaneChips, {
  type PaneChipItem,
  type PaneChipsAction,
} from "~/shared/navigation/pane-chips/PaneChips";

/** The icon names the service hands back, resolved to lucide elements. */
const ICONS: Record<string, ReactNode> = {
  chart: <ChartNoAxesColumn size={16} />,
  settings: <Settings size={16} />,
  list: <ListOrdered size={16} />,
  sparkles: <Sparkles size={16} />,
};

interface CoinsNavChipsProps {
  /**
   * Force which chip reads as active. When omitted it is derived from the
   * current route (+ the `tab` query the two coins-list tabs share).
   */
  activeKey?: CoinSectionTabKey;
  /** Render without the wrapping row, to share the host's chip strip. */
  bare?: boolean;
  className?: string;
}

/**
 * The King Coins sub-nav as a chip strip, for the theme-2 side pane — the
 * `CoinsTab` bar is hidden there, so the pane carries the same destinations in
 * the pane's own chip idiom. The tab set stays in
 * `LoyaltyPointService.getSectionTabs()`, so both renderings agree.
 */
const CoinsNavChips = ({ activeKey, bare, className }: CoinsNavChipsProps) => {
  const { t } = useTranslation();
  const appNav = useAppNav();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // The pane sits inside the coins section already, so the strip carries the
  // three sub-nav destinations only — not the section's own dashboard.
  const sectionTabs = useMemo(
    () =>
      LoyaltyPointService.getSectionTabs().filter(
        (tab) => tab.key !== "dashboard",
      ),
    [],
  );

  // Config and Transactions share one route and differ only by `tab`, so that
  // query decides between them; the standalone routes match on pathname.
  const resolvedActiveKey = useMemo(() => {
    if (activeKey) return activeKey;

    const tab = searchParams.get("tab");

    return sectionTabs.find((sectionTab) => {
      if (!location.pathname.startsWith(sectionTab.redirect.url)) return false;
      const wanted = sectionTab.redirect.params?.tab;
      return wanted ? wanted === (tab || "config") : true;
    })?.key;
  }, [activeKey, location.pathname, searchParams, sectionTabs]);

  const data: PaneChipItem[] = sectionTabs.map((tab) => ({
    key: tab.key,
    label: tab.langKey ? t(tab.langKey, { defaultValue: tab.name }) : tab.name,
    icon: tab.icon ? ICONS[tab.icon] : undefined,
    active: tab.key === resolvedActiveKey,
    tab,
  }));

  const handleCallback = ({ data: item }: PaneChipsAction) => {
    const tab = item.tab as CoinSectionTab;
    appNav.to(tab.redirect.url, tab.redirect.params);
  };

  return (
    <PaneChips
      data={data}
      callback={handleCallback}
      bare={bare}
      className={className}
    />
  );
};

export default CoinsNavChips;
