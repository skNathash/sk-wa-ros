import { useLocation, useSearchParams } from "react-router";
import useAppNav from "~/hooks/useAppNav";
import PaneChips, {
  type PaneChipItem,
  type PaneChipsAction,
} from "~/shared/navigation/pane-chips/PaneChips";
import type { PricingFilterCounts, PricingFilterKey } from "./helper";

/** Manage Price — the B2C / B2B sheets. */
const PRICE_SHEET_PATH = "/configs/rsp";

/** Electronics · online price match — its own screen under Manage Price. */
const ELECTRONICS_PATH = "/configs/rsp/electronics";

const CHIPS: { key: PricingFilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unpriced", label: "Unpriced" },
  { key: "low-margin", label: "Low margin" },
];

interface PricingPaneChipsProps {
  /** Which filter reads as active. Defaults to "all". */
  value?: PricingFilterKey;
  /** Badge counts keyed by filter — "all" is deliberately left unbadged. */
  counts?: PricingFilterCounts;
  onChange?: (key: PricingFilterKey) => void;
  className?: string;
}

/**
 * Filter chips for the Prices & Tax pane — the pricing gaps worth clearing
 * first (unpriced items, thin margins), each carrying how many
 * items sit behind it.
 *
 * Every chip drives the list through the URL (`pricingFilter=unpriced`,
 * `pricingFilter=low-margin`), so the gap is filtered across the whole catalog
 * rather than only the loaded page, and survives a reload or a shared link.
 * The channel (`type=customer` / `type=network`) is carried through untouched —
 * the gaps are judged per channel, so the chip must not drop it.
 *
 * The chips filter whichever pricing screen they are on: from Electronics they
 * stay there, where the same gap is applied on top of `onlinePriceExist=true`.
 */
const PricingPaneChips = ({
  value = "all",
  counts,
  onChange,
  className,
}: PricingPaneChipsProps) => {
  const appNav = useAppNav();
  const [searchParams] = useSearchParams();
  const { pathname } = useLocation();

  // Electronics is its own screen (B2C only, online-listed SKUs) — the gap
  // filters it in place rather than sending the seller back to the price sheet.
  const isElectronics = pathname === ELECTRONICS_PATH;

  // The channel the list is on. Legacy gap links wrote the gap here instead of
  // a channel, so anything that isn't a channel resolves back to B2C.
  const rawType = searchParams.get("type");
  const channel = rawType === "network" ? "network" : "customer";

  const data: PaneChipItem[] = CHIPS.map((chip) => ({
    key: chip.key,
    label: chip.label,
    active: chip.key === value,
    // "All" is the resting state, so a count on it would just be noise.
    count: chip.key === "all" ? undefined : counts?.[chip.key],
  }));

  const handleCallback = ({ data: item }: PaneChipsAction) => {
    const key = item.key as PricingFilterKey;
    const gap = key === "all" ? undefined : { pricingFilter: key };

    // "All" is the resting state — navigating without the gap param clears it.
    appNav.to(
      isElectronics ? ELECTRONICS_PATH : PRICE_SHEET_PATH,
      isElectronics ? gap : { type: channel, ...gap },
    );
    onChange?.(key);
  };

  return (
    <PaneChips data={data} callback={handleCallback} className={className} />
  );
};

export default PricingPaneChips;
