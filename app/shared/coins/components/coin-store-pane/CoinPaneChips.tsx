import {
  Coins,
  Crown,
  LayoutGrid,
  Medal,
  Moon,
  ShoppingBasket,
  Sparkles,
  Sprout,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import PaneChips, {
  type PaneChipItem,
  type PaneChipsAction,
} from "~/shared/navigation/pane-chips/PaneChips";
import {
  getBandCounts,
  type CoinChipType,
  type CoinPaneChipKey,
} from "./helper";

/**
 * The chip vocabularies, picked by {@link CoinPaneChipsProps.type}. Each chip
 * carries a leading icon so the strip reads like the coins tab bar above it.
 */
const CHIP_SETS: Record<
  CoinChipType,
  Array<{ key: CoinPaneChipKey; label: string; icon: ReactNode }>
> = {
  // How the holder book splits by coins held.
  bands: [
    { key: "all", label: "All holders", icon: <Users size={14} /> },
    { key: "top", label: "≥400 coins", icon: <Crown size={14} /> },
    { key: "silver", label: "200–399", icon: <Medal size={14} /> },
    { key: "starter", label: "100–199", icon: <Sprout size={14} /> },
    { key: "dormant", label: "<100", icon: <Moon size={14} /> },
  ],
  // How the Coin Store catalogue splits by reward tier.
  rewards: [
    { key: "all", label: "All", icon: <LayoutGrid size={14} /> },
    {
      key: "aspirational",
      label: "Aspirational",
      icon: <Sparkles size={14} />,
    },
    { key: "everyday", label: "Everyday", icon: <ShoppingBasket size={14} /> },
    { key: "cash-like", label: "Cash-like", icon: <Coins size={14} /> },
  ],
};

interface CoinPaneChipsProps {
  /** Which chip set to render. Defaults to the holder bands. */
  type?: CoinChipType;
  /** Which chip reads as active. Defaults to "all". */
  activeKey?: CoinPaneChipKey;
  /**
   * Trailing badge counts, keyed by chip. Only the band strip fetches its own
   * counts; every other set is fed by the host, which already has the data it
   * is filtering.
   */
  counts?: Partial<Record<CoinPaneChipKey, number>>;
  /** Fired with the tapped chip key — the page owns the filtering. */
  onSelect?: (key: CoinPaneChipKey) => void;
  /** Render without the wrapping row, to share the host's chip strip. */
  bare?: boolean;
  className?: string;
}

/**
 * The chip strip for the King Coins pane. `type` picks the vocabulary: the
 * coin bands of the holder book, or the reward tiers of the Coin Store. Band
 * badges come from the coin-bands funnel, so the strip and the funnel card
 * always agree on how the book splits; every other set takes its counts from
 * the host.
 */
const CoinPaneChips = ({
  type = "bands",
  activeKey = "all",
  counts,
  onSelect,
  bare,
  className,
}: CoinPaneChipsProps) => {
  const [bandCounts, setBandCounts] = useState<
    Partial<Record<CoinPaneChipKey, number>>
  >({});

  useEffect(() => {
    if (type !== "bands" || counts) return;

    const fetchCounts = async () => {
      try {
        setBandCounts(await getBandCounts());
      } catch (e) {
        setBandCounts({});
      }
    };

    fetchCounts();
  }, [type, counts]);

  const resolvedCounts = counts ?? bandCounts;

  const data: PaneChipItem[] = CHIP_SETS[type].map((chip) => ({
    key: chip.key,
    label: chip.label,
    icon: chip.icon,
    active: chip.key === activeKey,
    count: resolvedCounts[chip.key],
  }));

  const handleCallback = ({ data: item }: PaneChipsAction) => {
    onSelect?.(item.key as CoinPaneChipKey);
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

export default CoinPaneChips;
