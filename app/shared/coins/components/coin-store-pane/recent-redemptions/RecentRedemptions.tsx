import clsx from "clsx";
import { useEffect, useState } from "react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { AVATAR_TONES, getData, initialsOf, redemptionSubtitle, type CoinRedemption } from "./helper";

interface RecentRedemptionsProps {
  /** How many redemptions the list shows. */
  limit?: number;
  className?: string;
}

/**
 * Who spent coins lately and on what — the redeem side of the loyalty
 * statement, so the pane shows the Coin Store actually being used.
 */
const RecentRedemptions = ({
  limit = 4,
  className,
}: RecentRedemptionsProps) => {
  const [redemptions, setRedemptions] = useState<CoinRedemption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRedemptions = async () => {
      setLoading(true);
      try {
        setRedemptions(await getData(limit));
      } catch (e) {
        setRedemptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRedemptions();
  }, [limit]);

  if (!loading && !redemptions.length) return null;

  return (
    <div className={clsx("tw:flex tw:flex-col", className)}>
      <p className={clsx("app-pane-label", "tw:mb-1.5")}>
        Recent redemptions
      </p>

      {loading ? (
        <div className="tw:flex tw:justify-center tw:py-6">
          <AppSpinner className="tw:h-6 tw:w-6" />
        </div>
      ) : (
        redemptions.map((redemption, index) => (
          <div
            key={redemption.id}
            className="tw:flex tw:items-center tw:gap-3 tw:border-b tw:border-slate-100 tw:px-1 tw:py-3 tw:last:border-b-0"
          >
            <div
              className={clsx(
                "tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl tw:text-[11px] tw:font-bold tw:tracking-wide tw:text-white",
                AVATAR_TONES[index % AVATAR_TONES.length],
              )}
            >
              {initialsOf(redemption.name)}
            </div>

            <div className="tw:min-w-0 tw:flex-1">
              <div className="tw:truncate tw:text-[15px] tw:font-semibold tw:text-slate-800">
                {redemption.name}
              </div>
              <div className="tw:mt-0.5 tw:truncate tw:text-[13px] tw:text-slate-500">
                {redemptionSubtitle(redemption)}
              </div>
            </div>

            {redemption.dateLabel && (
              <span className="tw:shrink-0 tw:text-[13px] tw:text-slate-400">
                {redemption.dateLabel}
              </span>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default RecentRedemptions;
