import clsx from "clsx";
import { useEffect, useState } from "react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import {
  emptyFyStats,
  getFyStats,
  type FyStatsData,
  type FyStatTone,
} from "./helper";

/* The growth tile is the only one that hasn't happened yet, so it carries the
   outline and the cool tone — the two beside it are years being reported. */
const cardClass: Record<FyStatTone, string> = {
  plain: "tw:border tw:border-transparent",
  money: "tw:border tw:border-transparent",
  outlook: "tw:border tw:border-blue-400",
};

const valueClass: Record<FyStatTone, string> = {
  plain: "tw:text-gray-900",
  money: "tw:text-emerald-700",
  outlook: "tw:text-blue-600",
};

// The year that closed, the year being projected, and the distance between them.
const FyStats = () => {
  const [data, setData] = useState<FyStatsData>(emptyFyStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let result: FyStatsData;
      try {
        result = await getFyStats();
      } catch (e) {
        result = emptyFyStats();
      }
      if (cancelled) return;
      setData(result);
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="tw:mb-3 tw:rounded-2xl tw:bg-white tw:p-6 tw:text-center tw:shadow-sm">
        <AppSpinner />
      </div>
    );
  }

  return (
    <div className="tw:mb-3 tw:grid tw:grid-cols-1 tw:gap-3 tw:md:grid-cols-3">
      {data.items.map((item) => (
        <div
          key={item.key}
          className={clsx(
            "tw:rounded-2xl tw:bg-white tw:px-4 tw:py-3 tw:shadow-sm",
            cardClass[item.tone],
          )}
        >
          <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500">
            {item.label}
          </div>

          <div
            className={clsx(
              "tw:mt-1 tw:text-2xl tw:font-bold",
              valueClass[item.tone],
            )}
          >
            {item.value}
          </div>

          <div className="tw:mt-1 tw:text-[11px] tw:text-gray-500">
            {item.note}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FyStats;
