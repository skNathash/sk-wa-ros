import InventoryActivityLog from "~/shared/inventory/components/activity-log/InventoryActivityLog";
import InventoryPaneChips, {
  type InventoryChipType,
} from "~/shared/inventory/components/inventory-pane-chips/InventoryPaneChips";
import InventoryValue from "~/shared/inventory/components/inventory-value/InventoryValue";
import StockAlerts from "~/shared/inventory/components/stock-alerts/StockAlerts";
import CatalogMenuList from "../catalog-menu-list/CatalogMenuList";
import DealSearchInput from "~/shared/catalog/components/search-input/deal/DealSearchInput";
import useAppNav from "~/hooks/useAppNav";
import SectionTabService from "~/services/SectionTabService";
import PaneTitle from "~/shared/layout/app-pane/PaneTitle";
import PaneChips, {
  type PaneChipItem,
} from "~/shared/navigation/pane-chips/PaneChips";
import InventoryInsightChips from "~/shared/inventory/components/inventory-pane-chips/InventoryInsightChips";

export interface CatalogSidePaneProps {
  /**
   * Pane header title. Defaults to the label of the catalog section-menu entry
   * this page sits under ({@link activeTab}), so the pane names the same place
   * the left rail highlights.
   */
  title?: string;
  /** Catalog section-menu key the page belongs to. Defaults to "my-catalog". */
  activeTab?: string;
  /** Small muted label shown beside the title (e.g. "Store", "Catalog"). */
  scopeLabel?: string;
  /**
   * Called when a headline total tile is tapped. When omitted
   * {@link InventoryValue} navigates to the products list itself.
   */
  onValueSelect?: (key: "totalItems" | "inventoryValue") => void;
  /** Key of the currently active stock-alert filter, for highlight state. */
  activeStockAlertKey?: string;
  /**
   * Which quick-nav chip set the pane shows. Defaults to the analytics
   * dashboard's tabs on the dashboard page and the catalog views elsewhere.
   */
  chipsType?: InventoryChipType;
  /** Render the inventory-value totals panel. Defaults to true. */
  showInventoryValue?: boolean;
  /** Render the stock-health alerts panel. Defaults to true. */
  showStockAlerts?: boolean;
  /** Render the recent-activity feed. Defaults to true. */
  showActivityLog?: boolean;
  /** Render the menu (category) list. Defaults to true. */
  showMenuList?: boolean;
  /**
   * A page-owned chip set (e.g. the dashboard's own views) rendered above the
   * fixed inventory quick-nav chips. The host owns the active state and the
   * tap behaviour via {@link onChipSelect}.
   */
  chips?: PaneChipItem[];
  /** Tap handler for {@link chips}. */
  onChipSelect?: (chip: PaneChipItem) => void;
  /** Render the quick-nav chips strip. Defaults to true. */
  showChips?: boolean;
  className?: string;
}

/**
 * Reusable catalog side-pane contents used by the inventory/catalog views in
 * theme-2 desktop. Bundles the pane header, quick-view chips, inventory totals,
 * stock-health alerts and recent activity log so every catalog page renders the
 * same pane without duplicating the layout.
 */
const CatalogSidePane = ({
  title,
  activeTab = "my-catalog",
  scopeLabel,
  onValueSelect,
  activeStockAlertKey,
  chipsType,
  showInventoryValue = true,
  showStockAlerts = true,
  showActivityLog = true,
  showMenuList = true,
  chips,
  onChipSelect,
  showChips = true,
  className,
}: CatalogSidePaneProps) => {
  const appNav = useAppNav();

  // The rail and the pane should agree on where you are, so the heading falls
  // back to the section-menu label instead of a per-page name.
  const paneTitle =
    title || SectionTabService.getTab("catalog", activeTab)?.label || "";
  const handleSearch = (value: Record<string, any>) => {
    const id = value?.value?.id;
    if (id) {
      appNav.to(`/dashboard/inventory/products/view/${id}`);
    }
  };

  return (
    <div className={className + " tw:flex tw:flex-col tw:gap-4"}>
      {/* Pane header — section title + scope label. */}
      <div className="tw:flex tw:items-baseline tw:justify-between tw:px-1">
        <PaneTitle title={paneTitle} />
        {/* Scope label removed — the pane header carries the title alone.
        {scopeLabel ? (
          <span className="tw:text-sm tw:text-slate-400">{scopeLabel}</span>
        ) : null}
        */}
      </div>

      {/* search */}
      {/* <DealSearchInput placeholder="Search products" callback={handleSearch} /> */}

      {/* Quick-nav chips over the inventory views. */}
      <InventoryPaneChips type={chipsType} />

      {/* Headline totals — item count + stock value. */}
      {showInventoryValue && (
        <InventoryValue title={null} onSelect={onValueSelect} />
      )}

      {showStockAlerts && <StockAlerts activeKey={activeStockAlertKey} />}

      {/* Catalogue split by menu — taps open the filtered products list. */}
      {showMenuList && <CatalogMenuList />}

      {/* Seller-wide inventory activity feed. */}
      {showActivityLog && <InventoryActivityLog className="tw:mb-4" />}
    </div>
  );
};

export default CatalogSidePane;
