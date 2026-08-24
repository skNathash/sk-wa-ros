import clsx from "clsx";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import CoinPaneAlerts from "./CoinPaneAlerts";
import CoinPaneChips from "./CoinPaneChips";
import CoinPaneQuickActions, {
  type CoinQuickActionKey,
} from "./CoinPaneQuickActions";
import {
  EMPTY_OVERVIEW,
  getData,
  getOverview,
  getTierCounts,
  type CoinAlert,
  type CoinChipType,
  type CoinPaneChipKey,
  type CoinPaneOverview,
  type CoinStoreReward,
} from "./helper";
import RecentRedemptions from "./recent-redemptions/RecentRedemptions";
import TierPhilosophy from "./tier-philosophy/TierPhilosophy";
import PaneTitle from "~/shared/layout/app-pane/PaneTitle";

interface CoinStorePaneProps {
  /** Pane header title. */
  title?: string;
  /**
   * Small muted label beside the title. Defaults to how many rewards the
   * catalogue carries once it resolves.
   */
  subtitle?: string;

  /** Render the search box. Defaults to true. */
  showSearch?: boolean;
  /** Fired on every keystroke — the page owns the filtering. */
  onSearch?: (term: string) => void;
  searchPlaceholder?: string;

  /** Render the chip strip. Defaults to true. */
  showChips?: boolean;
  /**
   * Which chip vocabulary the strip carries — the reward tiers of the Coin
   * Store, or the holder bands of the economy page. Defaults to the tiers.
   */
  chipType?: CoinChipType;
  /** Force which chip reads as active; otherwise the strip tracks its own. */
  activeChipKey?: CoinPaneChipKey;
  /** Fired with the tapped chip key. */
  onChipSelect?: (key: CoinPaneChipKey) => void;

  /** Render the alert stack. Defaults to true. */
  showAlerts?: boolean;
  /** Tapping an alert hands it back; without it the rows are inert. */
  onAlertSelect?: (alert: CoinAlert) => void;

  /** Render the quick-action panel. Defaults to true. */
  showQuickActions?: boolean;
  /** Intercept a quick-action row; without it the row navigates itself. */
  onQuickActionSelect?: (key: CoinQuickActionKey) => void;

  /** Render the tier philosophy card. Defaults to true. */
  showTierPhilosophy?: boolean;

  /** Render the recent-redemptions list. Defaults to true. */
  showRecentRedemptions?: boolean;
  /** How many redemptions the list shows. */
  redemptionLimit?: number;

  className?: string;
}

/**
 * Reusable side-pane contents for the King Coins section in theme-2 desktop:
 * the pane header with how big the catalogue is, the search, the chip strip,
 * what each tier is for, who redeemed lately, what the circulation snapshot
 * says needs attention and the ways to act on it — the coins counterpart of
 * `SupplyCatalogPane` / `PaylaterPane`.
 *
 * The pane owns the catalogue fetch only to badge the chips; the page it sits
 * beside does its own filtering off `onSearch` / `onChipSelect`.
 */
const CoinStorePane = ({
  title = "Coin Store",
  subtitle,
  showSearch = true,
  onSearch,
  searchPlaceholder = "Search rewards",
  showChips = true,
  chipType = "rewards",
  activeChipKey,
  onChipSelect,
  showAlerts = true,
  onAlertSelect,
  showQuickActions = true,
  onQuickActionSelect,
  showTierPhilosophy = true,
  showRecentRedemptions = true,
  redemptionLimit = 4,
  className,
}: CoinStorePaneProps) => {
  const [rewards, setRewards] = useState<CoinStoreReward[]>([]);
  const [overview, setOverview] = useState<CoinPaneOverview>(EMPTY_OVERVIEW);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [term, setTerm] = useState("");

  // The chips track their own selection unless the host drives them.
  const [chipKey, setChipKey] = useState<CoinPaneChipKey>(
    activeChipKey ?? "all",
  );

  // The catalogue only badges the tier chips and the header, so the band
  // rendering of the pane never reads it.
  useEffect(() => {
    if (chipType !== "rewards") return;

    const fetchRewards = async () => {
      try {
        setRewards(await getData());
      } catch (e) {
        setRewards([]);
      }
    };

    fetchRewards();
  }, [chipType]);

  // The alerts are the only thing here reading the circulation snapshot, so
  // the pane skips the call altogether when they are hidden.
  useEffect(() => {
    if (!showAlerts) return;

    const fetchOverview = async () => {
      setLoadingOverview(true);
      try {
        setOverview(await getOverview());
      } catch (e) {
        setOverview(EMPTY_OVERVIEW);
      } finally {
        setLoadingOverview(false);
      }
    };

    fetchOverview();
  }, [showAlerts]);

  const counts = useMemo(() => getTierCounts(rewards), [rewards]);

  // The header counts whatever the strip below it is slicing: the catalogue
  // for the tier chips, what is in circulation for the holder bands.
  const defaultSubtitle =
    chipType === "rewards"
      ? rewards.length
        ? `${rewards.length} rewards`
        : undefined
      : overview.circulation
        ? `${overview.circulation.toLocaleString("en-IN")} in circulation`
        : undefined;

  const resolvedSubtitle = subtitle ?? defaultSubtitle;

  const handleSearch = (value: string) => {
    setTerm(value);
    onSearch?.(value);
  };

  const handleChipSelect = (key: CoinPaneChipKey) => {
    setChipKey(key);
    onChipSelect?.(key);
  };

  return (
    <div className={clsx("tw:flex tw:flex-col tw:gap-4", className)}>
      {/* Pane header — section title + how many rewards are redeemable. */}
      <div className="tw:flex tw:items-baseline tw:justify-between tw:gap-2 tw:px-1">
        <PaneTitle title={title} />
        {resolvedSubtitle && (
          <span className="tw:shrink-0 tw:text-sm tw:text-slate-400">
            {resolvedSubtitle}
          </span>
        )}
      </div>

      {/* Narrow the catalogue by reward name. */}
      {/* {showSearch && (
        <div className="tw:relative">
          <Search
            size={16}
            className="tw:pointer-events-none tw:absolute tw:left-3 tw:top-1/2 tw:-translate-y-1/2 tw:text-slate-400"
          />
          <input
            type="search"
            value={term}
            onChange={(event) => handleSearch(event.target.value)}
            placeholder={searchPlaceholder}
            className="tw:w-full tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:py-2.5 tw:pl-9 tw:pr-3 tw:text-sm tw:text-slate-800 tw:outline-none tw:placeholder:text-slate-400 tw:focus:border-slate-300"
          />
        </div>
      )} */}

      {/* Which tier we're looking at. */}
      {showChips && (
        <CoinPaneChips
          type={chipType}
          activeKey={activeChipKey ?? chipKey}
          // The band strip fetches its own counts; the tier strip is fed
          // from the catalogue this pane already read.
          counts={chipType === "rewards" ? counts : undefined}
          onSelect={handleChipSelect}
        />
      )}

      {/* The ways to act on the store, right under the chips. */}
      {showQuickActions && (
        <CoinPaneQuickActions onSelect={onQuickActionSelect} />
      )}

      {/* What each tier is there to do. */}
      {showTierPhilosophy && <TierPhilosophy onSelect={handleChipSelect} />}

      {/* The store being used. */}
      {showRecentRedemptions && (
        <RecentRedemptions
          limit={redemptionLimit}
          className={!showAlerts ? "tw:mb-4" : undefined}
        />
      )}

      {/* What the snapshot says needs acting on. */}
      {showAlerts && (
        <CoinPaneAlerts
          overview={overview}
          loading={loadingOverview}
          onSelect={onAlertSelect}
          className="tw:mb-4"
        />
      )}
    </div>
  );
};

export default CoinStorePane;
