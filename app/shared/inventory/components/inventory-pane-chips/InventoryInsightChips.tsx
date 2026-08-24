import {
  CalendarClock,
  PackageX,
  PauseCircle,
  TrendingDown,
  Zap,
} from "lucide-react";
import { useLocation, useSearchParams } from "react-router";
import useAppNav from "~/hooks/useAppNav";
import PaneChips, {
  type PaneChipItem,
  type PaneChipsAction,
} from "~/shared/navigation/pane-chips/PaneChips";

const PRODUCTS_PATH = "/dashboard/inventory/products/list";

interface InsightChip {
  key: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  /** Products-list filter the chip applies. */
  query: Record<string, string>;
}

/**
 * The dashboard's headline views. Movement chips drive the products list's
 * `velocity` filter, stock-health chips its `stockStatus` filter — the same
 * values `SellerCatalogService` exposes, so the list picks them up from the URL.
 */
const CHIPS: InsightChip[] = [
  {
    key: "fast_moving",
    label: "Fast Moving",
    icon: <Zap size={14} />,
    path: PRODUCTS_PATH,
    query: { velocity: "Fast Moving" },
  },
  {
    key: "slow_moving",
    label: "Slow Moving",
    icon: <TrendingDown size={14} />,
    path: PRODUCTS_PATH,
    query: { velocity: "Slow Moving" },
  },
  {
    key: "non_moving",
    label: "Non Moving",
    icon: <PauseCircle size={14} />,
    path: PRODUCTS_PATH,
    query: { velocity: "Non-Moving" },
  },
  {
    key: "near_expiry",
    label: "Near Expiry",
    icon: <CalendarClock size={14} />,
    path: PRODUCTS_PATH,
    query: { stockStatus: "Near Expiry" },
  },
  {
    key: "out_of_stock",
    label: "Out of Stock",
    icon: <PackageX size={14} />,
    path: PRODUCTS_PATH,
    query: { stockStatus: "Out of Stock" },
  },
];

interface InventoryInsightChipsProps {
  className?: string;
}

/**
 * Quick-nav chips over the inventory dashboard's headline movement / stock
 * health cuts for the catalog side pane. Each chip lands on the products list
 * pre-filtered; the active chip is resolved from the current URL, so the pane
 * highlights the filter the list is actually showing. The Overview entry lives
 * in {@link InventoryPaneChips}, which leads the pane's chip block.
 */
const InventoryInsightChips = ({ className }: InventoryInsightChipsProps) => {
  const appNav = useAppNav();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const data: PaneChipItem[] = CHIPS.map((chip) => ({
    key: chip.key,
    label: chip.label,
    icon: chip.icon,
    active:
      location.pathname.startsWith(PRODUCTS_PATH) &&
      Object.entries(chip.query).every(
        ([param, value]) => searchParams.get(param) === value,
      ),
    path: chip.path,
    query: chip.query,
  }));

  const handleCallback = ({ data: chip }: PaneChipsAction) => {
    appNav.to(chip.path as string, chip.query);
  };

  return (
    <PaneChips data={data} callback={handleCallback} className={className} />
  );
};

export default InventoryInsightChips;
