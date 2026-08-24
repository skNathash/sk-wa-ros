import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { useLocation, useSearchParams } from "react-router";
import useAppNav from "~/hooks/useAppNav";
import SearchModeSelector, {
  type SearchMode,
} from "~/shared/catalog/components/search-mode-selector/SearchModeSelector";
import InventoryActivityLog from "~/shared/inventory/components/activity-log/InventoryActivityLog";
import SubscribeMenuList from "~/shared/inventory/components/subscribe-menu-list/SubscribeMenuList";
import SubscribePaneChips from "~/shared/inventory/components/subscribe-pane-chips/SubscribePaneChips";
import SubscribeCartCard from "./SubscribeCartCard";
import SectionTabService from "~/services/SectionTabService";
import PaneTitle from "~/shared/layout/app-pane/PaneTitle";

const DISCOVER_PATH = "/dashboard/inventory/subscribe/discover";
const BARCODE_SCAN_PATH = "/dashboard/inventory/barcode-scan";

export interface SubscribeSidePaneProps {
  /**
   * Pane header title. Defaults to the catalog section-menu label these pages
   * sit under ("SK Library"), so the pane names the same place the rail marks.
   */
  title?: string;
  /** Small muted label shown beside the title. */
  scopeLabel?: string;
  /** Render the search-mode tiles that launch Discover. Defaults to true. */
  showSearchModes?: boolean;
  /** Render the browse-by-menu list. Defaults to true. */
  showMenus?: boolean;
  /** Render the recent-activity feed. Defaults to true. */
  showActivityLog?: boolean;
  className?: string;
}

/**
 * Side-pane contents for the subscribe ("Create My Catalog") views in theme-2
 * desktop. Bundles the pane header, the subscribe quick-nav chips (which stand
 * in for the tab row theme-2 hides), so every subscribe page renders the same
 * pane without duplicating the layout.
 */
const SubscribeSidePane = ({
  title,
  scopeLabel,
  showSearchModes = true,
  showMenus = true,
  showActivityLog = true,
  className,
}: SubscribeSidePaneProps) => {
  const { t } = useTranslation("inventorySubscribe");
  const appNav = useAppNav();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // The tiles only launch Discover, so they show a selection just for the page
  // that owns the mode — anywhere else in the pane nothing reads as active.
  const activeMode = location.pathname.includes(DISCOVER_PATH)
    ? ((searchParams.get("mode") as SearchMode) ?? "text")
    : null;

  const handleModeSelect = (mode: SearchMode) => {
    // Barcode has a scanner page of its own; the rest are captured on Discover.
    if (mode === "barcode") {
      appNav.to(BARCODE_SCAN_PATH);
      return;
    }

    appNav.to(DISCOVER_PATH, { tab: "discover", mode });
  };

  return (
    <div className={clsx("tw:flex tw:flex-col tw:gap-4", className)}>
      {/* Pane header — section title + scope label. */}
      <div className="tw:flex tw:items-baseline tw:justify-between tw:px-1">
        <PaneTitle
          title={
            title ||
            SectionTabService.getTab("catalog", "library")?.label ||
            t("subscribeMain.headerTitle")
          }
        />
        {/* Scope label removed — the pane header carries the title alone.
        <span className="tw:text-sm tw:text-slate-400">
          {scopeLabel ||
            t("subscribeMain.paneScopeLabel", { defaultValue: "Catalog" })}
        </span>
        */}
      </div>

      {/* How to search the catalog — each tile hands the mode to Discover,
          which owns the input for it. */}
      {showSearchModes && (
        <SearchModeSelector
          template={2}
          value={activeMode}
          onChange={handleModeSelect}
        />
      )}

      {/* Quick-nav chips over the subscribe views. */}
      <SubscribePaneChips />

      {/* What's staged for subscribing — hides itself when the cart is empty. */}
      <SubscribeCartCard />

      {/* Browse by menu — the catalog's top-level shelves, so the pane offers a
          way in as well as a way to add. */}
      {showMenus && <SubscribeMenuList />}
    </div>
  );
};

export default SubscribeSidePane;
