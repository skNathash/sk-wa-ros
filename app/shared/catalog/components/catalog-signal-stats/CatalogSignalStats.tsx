import { useEffect, useState } from "react";
import useAppNav from "~/hooks/useAppNav";
import PeerSignalHero from "./PeerSignalHero";
import StatTile from "./StatTile";
import {
  emptyStats,
  fetchCatalogSignalStats,
  formatCount,
  formatSharePercent,
  type CatalogSignalStatsData,
} from "./helper";

interface CatalogSignalStatsProps {
  /** Radius for the peer signal; matches the search page's km selector. */
  radiusKms?: number;
  /** Window behind the "new this week" tile. */
  newWithinDays?: number;
  /** Overrides the hero CTA; by default it opens the Popular Near Me tab. */
  onSeeGaps?: () => void;
  className?: string;
}

/**
 * Catalog headline strip — the peer-signal hero (what shops within the radius
 * stock that you don't) plus library / subscribed / newly-added counts. Every
 * number comes from InventorySubscribeService; see {@link fetchCatalogSignalStats}.
 */
const CatalogSignalStats = ({
  radiusKms = 5,
  newWithinDays = 7,
  onSeeGaps,
  className = "",
}: CatalogSignalStatsProps) => {
  const appNav = useAppNav();
  const [stats, setStats] = useState<CatalogSignalStatsData>(emptyStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const data = await fetchCatalogSignalStats(radiusKms, newWithinDays);
      if (cancelled) return;
      setStats(data);
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [radiusKms, newWithinDays]);

  const handleSeeGaps = () => {
    if (onSeeGaps) return onSeeGaps();
    appNav.to("/dashboard/inventory/subscribe/search", {
      tab: "top",
      sortType: "popular",
      radiusKms,
    });
  };

  if (loading) {
    return (
      <div
        className={`tw:grid tw:grid-cols-3 tw:gap-2 tw:md:grid-cols-5 tw:md:gap-4 ${className}`}
      >
        <div className="skeleton-loader tw:col-span-full tw:h-32 tw:rounded-2xl tw:md:col-span-2 tw:md:h-full" />
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="skeleton-loader tw:h-32 tw:rounded-2xl tw:md:h-full"
          />
        ))}
      </div>
    );
  }

  // Nothing came back from any of the counts — no strip at all.
  if (!stats.hasData) return null;

  const subscribedShare = formatSharePercent(
    stats.subscribed,
    stats.librarySkus,
  );
  // Without a gap count the hero would headline "0 SKUs", so the tiles take
  // the full width instead.
  const showPeerHero = stats.peerGapCount > 0;

  return (
    <div
      className={`tw:grid tw:grid-cols-3 tw:gap-2 tw:md:gap-4 ${
        showPeerHero ? "tw:md:grid-cols-5" : "tw:md:grid-cols-3"
      } ${className}`}
    >
      {showPeerHero && (
        <PeerSignalHero
          radiusKms={radiusKms}
          gapCount={stats.peerGapCount}
          peerRetailers={stats.peerRetailers}
          sampleNames={stats.peerSamples.map((s) => s.name).filter(Boolean)}
          onSeeGaps={handleSeeGaps}
        />
      )}

      <StatTile
        label="SK Library SKUs"
        value={formatCount(stats.librarySkus)}
        subtitle={`${formatCount(stats.libraryCategories)} categories · ${formatCount(
          stats.libraryBrands,
        )} brands`}
        accent="blue"
      />

      <StatTile
        label="You've subscribed"
        value={formatCount(stats.subscribed)}
        subtitle={subscribedShare ? `${subscribedShare} of SK Library` : ""}
        accent="violet"
      />

      <StatTile
        label={
          newWithinDays === 7 ? "New this week" : `New in ${newWithinDays}d`
        }
        value={formatCount(stats.newDeals)}
        subtitle="new in SK Library"
        accent="amber"
      />
    </div>
  );
};

export default CatalogSignalStats;
