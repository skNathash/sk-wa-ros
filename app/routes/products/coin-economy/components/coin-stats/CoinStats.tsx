import clsx from "clsx";
import { useEffect, useState } from "react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { formatCoins } from "../../helper";
import { EMPTY_STATS, getData, VELOCITY_WEEKS, type CoinStatsData } from "./helper";

/**
 * The four headline coin numbers: what was earned and redeemed over the
 * movement window, how much of the book is sitting unspent, and how fast coins
 * turn over (earned against redeemed).
 */
const CoinStats = () => {
  const [stats, setStats] = useState<CoinStatsData>(EMPTY_STATS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        setStats(await getData());
      } catch (e) {
        setStats(EMPTY_STATS);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const tiles = [
    {
      key: "earned",
      label: `Earned · ${stats.days}d`,
      value: `+${formatCoins(stats.earned)}`,
      note: `from ${formatCoins(stats.earnCount)} bills · avg ${formatCoins(stats.earnedPerBill)}/bill`,
      valueClassName: "tw:text-amber-500",
      cardClassName: "tw:border-amber-400",
      // Share of the window's movement that was earning, not redeeming.
      progress: stats.earned + stats.redeemed
        ? Math.round((stats.earned / (stats.earned + stats.redeemed)) * 100)
        : 0,
      progressClassName: "tw:bg-amber-400",
    },
    {
      key: "redeemed",
      label: `Redeemed · ${stats.days}d`,
      value: `−${formatCoins(stats.redeemed)}`,
      note: `${formatCoins(stats.redeemCount)} redemptions · avg ${formatCoins(stats.redeemedPerCustomer)} each`,
      valueClassName: "tw:text-slate-800",
      cardClassName: "tw:border-slate-200",
    },
    {
      key: "locked-up",
      label: "Locked-up",
      value: `${stats.lockedUpPercent}%`,
      note: `${formatCoins(stats.neverRedeemed)} coins never redeemed`,
      valueClassName: "tw:text-amber-500",
      cardClassName: "tw:border-slate-200",
    },
    {
      key: "velocity",
      label: "Velocity",
      value: stats.velocityRatio === null ? "—" : `${stats.velocityRatio}×`,
      note: `earn : redeem ratio · ${VELOCITY_WEEKS}wk`,
      valueClassName: "tw:text-violet-600",
      cardClassName: "tw:border-violet-500",
    },
  ];

  return (
    <div className="tw:grid tw:grid-cols-2 tw:gap-3 tw:lg:grid-cols-4 tw:lg:gap-4">
      {tiles.map((tile) => (
        <div
          key={tile.key}
          className={clsx(
            "tw:rounded-xl tw:border tw:bg-white tw:p-4 tw:shadow-sm",
            tile.cardClassName,
          )}
        >
          <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-slate-400">
            {tile.label}
          </div>

          <div
            className={clsx(
              "tw:mt-1.5 tw:text-xl tw:md:text-2xl tw:font-bold",
              tile.valueClassName,
            )}
          >
            {loading ? <AppSpinner className="tw:h-5 tw:w-5" /> : tile.value}
          </div>

          <div className="tw:mt-1 tw:text-[11px] tw:text-slate-500">
            {tile.note}
          </div>

          {tile.progress !== undefined && (
            <div className="tw:mt-2.5 tw:h-1.5 tw:overflow-hidden tw:rounded-full tw:bg-slate-100">
              <div
                className={clsx("tw:h-full tw:rounded-full", tile.progressClassName)}
                style={{ width: `${tile.progress}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CoinStats;
