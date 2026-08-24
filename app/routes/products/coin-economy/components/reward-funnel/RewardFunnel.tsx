import { useEffect, useState } from "react";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { formatCoins } from "../../helper";
import { getData, getNearTopBand, type CoinBand } from "./helper";

/**
 * "Reward funnel · by coin band" — every holder bucketed by wallet size, with
 * what each band can redeem today. The bar length is the band's share of all
 * holders, so the shape of the base is readable at a glance.
 */
const RewardFunnel = () => {
  const [holders, setHolders] = useState(0);
  const [bands, setBands] = useState<CoinBand[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBands = async () => {
      setLoading(true);
      try {
        const result = await getData();
        setHolders(result.holders);
        setBands(result.bands);
      } catch (e) {
        setHolders(0);
        setBands([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBands();
  }, []);

  const nearTop = getNearTopBand(bands);

  return (
    <div className="tw:flex tw:h-full tw:flex-col tw:overflow-hidden tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:shadow-sm">
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border-b tw:border-slate-100 tw:px-5 tw:py-4">
        <div className="tw:text-base tw:font-semibold tw:text-slate-800">
          Reward funnel · by coin band
        </div>
        <span className="tw:shrink-0 tw:text-xs tw:text-slate-400">
          {formatCoins(holders)} holders
        </span>
      </div>

      {loading ? (
        <div className="tw:flex tw:flex-1 tw:items-center tw:justify-center tw:py-12">
          <AppSpinner className="tw:h-6 tw:w-6" />
        </div>
      ) : !bands.length ? (
        <div className="tw:flex tw:flex-1 tw:items-center tw:justify-center">
          <NoData />
        </div>
      ) : (
        <div className="tw:flex tw:flex-1 tw:flex-col tw:gap-4 tw:px-5 tw:py-5">
          {bands.map((band) => (
            <div key={band.label}>
              <div className="tw:flex tw:items-baseline tw:justify-between tw:gap-3">
                <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-2">
                  <span
                    className={`tw:h-2.5 tw:w-2.5 tw:shrink-0 tw:rounded-sm ${band.dotClassName}`}
                  />
                  <span className="tw:truncate tw:text-sm tw:font-semibold tw:text-slate-800">
                    {band.label}
                  </span>
                  <span className="tw:shrink-0 tw:text-xs tw:text-slate-400">
                    {formatCoins(band.customers)} customers
                  </span>
                </div>

                <span className="tw:hidden tw:shrink-0 tw:text-xs tw:text-slate-500 tw:sm:block">
                  {band.hint}
                </span>
              </div>

              <div className="tw:mt-1.5 tw:h-1.5 tw:overflow-hidden tw:rounded-full tw:bg-slate-100">
                <div
                  className={`tw:h-full tw:rounded-full ${band.barClassName}`}
                  style={{
                    width: `${holders ? (band.customers / holders) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          ))}

          {nearTop && (
            <div className="tw:mt-auto tw:rounded-xl tw:border-l-4 tw:border-amber-400 tw:bg-amber-50 tw:px-4 tw:py-3 tw:text-xs tw:text-slate-600">
              <span className="tw:font-semibold tw:text-slate-800">
                {formatCoins(nearTop.customers)} holders are one bill away
              </span>{" "}
              from the aspirational tier. Broadcast the Coin Store to them.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RewardFunnel;
