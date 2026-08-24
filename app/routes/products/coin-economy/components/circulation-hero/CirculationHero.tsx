import { format } from "date-fns";
import { useEffect, useState } from "react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { EMPTY_SUMMARY, formatCoins, type KingCoinsSummary } from "../../helper";
import { getData } from "./helper";

/**
 * King Coins circulation banner — the top-of-page snapshot: how many coins sit
 * in customer wallets right now, across how many holders, what moved in the
 * trailing week, and who holds the most.
 */
const CirculationHero = () => {
  const [summary, setSummary] = useState<KingCoinsSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        setSummary(await getData());
      } catch (e) {
        setSummary(EMPTY_SUMMARY);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const { movement, topHolder } = summary;

  return (
    <div className="tw:rounded-2xl tw:bg-linear-to-r tw:from-amber-500 tw:to-amber-400 tw:p-5 tw:text-white tw:shadow-lg">
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-4">
        <div className="tw:min-w-0">
          <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-white/70">
            King Coins · {format(new Date(), "MMM yyyy")}
          </div>

          {loading ? (
            <div className="tw:mt-1.5">
              <AppSpinner className="tw:h-6 tw:w-6" />
            </div>
          ) : (
            <>
              <div className="tw:mt-1.5 tw:text-2xl tw:md:text-3xl tw:font-bold tw:leading-tight">
                {formatCoins(summary.circulation)} in circulation ·{" "}
                {formatCoins(summary.holders)} holders
              </div>

              <div className="tw:mt-1.5 tw:text-xs tw:md:text-sm tw:text-white/70">
                Earned last {movement.days}d +{formatCoins(movement.earned)} ·
                Redeemed {formatCoins(movement.redeemed)} · Locked-up{" "}
                {summary.lockedUpPercent}% (aspirational moat)
              </div>
            </>
          )}
        </div>

        <div className="tw:hidden tw:shrink-0 tw:items-stretch tw:gap-3 tw:sm:flex">
          <div className="tw:rounded-xl tw:bg-white/15 tw:px-4 tw:py-3 tw:text-right">
            <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-white/70">
              Avg per holder
            </div>
            <div className="tw:mt-0.5 tw:text-lg tw:font-bold">
              {formatCoins(summary.avgPerHolder)}
            </div>
          </div>

          {topHolder && (
            <div className="tw:rounded-xl tw:bg-white/15 tw:px-4 tw:py-3 tw:text-right">
              <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-white/70">
                Top holder
              </div>
              <div className="tw:mt-0.5 tw:text-lg tw:font-bold">
                {topHolder.name} · {formatCoins(topHolder.coins)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CirculationHero;
