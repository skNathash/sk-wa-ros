import PaneChips, {
  type PaneChipItem,
  type PaneChipsAction,
} from "~/shared/navigation/pane-chips/PaneChips";

export type SellerPaneChipKey =
  | "all"
  | "connected"
  | "paylater"
  | "topRated"
  | "skSeller"
  | "skRetailer";

interface SellerPaneChipsProps {
  /** Currently selected chip key. */
  activeKey?: SellerPaneChipKey;
  /** Counts shown as trailing badges on the countable chips. */
  counts?: {
    connected?: number;
    paylater?: number;
  };
  /** Fires `{ action: "select", data: chip }` when a chip is tapped. */
  callback: (payload: PaneChipsAction) => void;
  className?: string;
}

const SELLER_CHIPS: { key: SellerPaneChipKey; label: string; countable: boolean }[] = [
  { key: "all", label: "All", countable: false },
  { key: "connected", label: "Connected", countable: true },
  { key: "paylater", label: "PayLater", countable: true },
  { key: "topRated", label: "Top rated", countable: false },
  { key: "skSeller", label: "SK Seller", countable: false },
  { key: "skRetailer", label: "SK Retailer", countable: false },
];

/**
 * Quick-filter chips for the retailer-page sellers side pane.
 *
 * Built on the generic {@link PaneChips}; the parent owns the active filter and
 * applies it to the seller list. Countable chips (Connected / PayLater) receive
 * their counts from the parent so the badges stay accurate as search/distance
 * changes.
 */
const SellerPaneChips = ({
  activeKey = "all",
  counts,
  callback,
  className,
}: SellerPaneChipsProps) => {
  const data: PaneChipItem[] = SELLER_CHIPS.map((chip) => ({
    key: chip.key,
    label: chip.label,
    active: activeKey === chip.key,
    count: chip.countable ? counts?.[chip.key] || 0 : undefined,
  }));

  return <PaneChips data={data} callback={callback} className={className} />;
};

export default SellerPaneChips;
