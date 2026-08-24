import clsx from "clsx";
import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAccountsDateRange from "~/shared/accounts/hooks/useAccountsDateRange";
import {
  emptyCollectionStats,
  getCollectionStats,
  type CollectionStat,
  type CollectionStatsData,
} from "./helper";

/* One tone per tile so the row reads at a glance: green is money already in,
   amber is money still owed on time, red is money that has gone late. */
const toneClass: Record<CollectionStat["tone"], string> = {
  in: "tw:text-emerald-700",
  waiting: "tw:text-amber-600",
  overdue: "tw:text-red-600",
};

type CollectionStatsProps = {
  /** Lane the summary is scoped to — "all", "B2C" or "B2B". */
  lane?: string;
};

// The three numbers that frame the whole money-in screen: what came in, what is
// still to come, and what has gone late.
const CollectionStats = ({ lane = "all" }: CollectionStatsProps) => {
  const range = useAccountsDateRange();

  const [data, setData] = useState<CollectionStatsData>(emptyCollectionStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let result: CollectionStatsData;
      try {
        result = await getCollectionStats(range, lane);
      } catch (e) {
        result = emptyCollectionStats();
      }
      if (cancelled) return;
      setData(result);
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [range, lane]);

  if (loading) {
    return (
      <div className="tw:mb-3 tw:rounded-2xl tw:bg-white tw:p-6 tw:text-center tw:shadow-sm">
        <AppSpinner />
      </div>
    );
  }

  return (
    <div className="tw:mb-3 tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-3">
      {data.items.map((item) => (
        <div
          key={item.key}
          className="tw:rounded-2xl tw:bg-white tw:px-4 tw:py-3 tw:shadow-sm"
        >
          <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500">
            {item.label}
          </div>

          <div
            className={clsx(
              "tw:mt-1 tw:text-2xl tw:font-bold",
              toneClass[item.tone],
            )}
          >
            <Amount value={item.amount} decimalPlaces={0} />
          </div>

          <div className="tw:mt-1 tw:text-[11px] tw:text-gray-500">
            {item.note}
            {item.noteHighlight ? (
              <span className="tw:font-semibold tw:text-gray-700">
                {item.noteHighlight}
              </span>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CollectionStats;
