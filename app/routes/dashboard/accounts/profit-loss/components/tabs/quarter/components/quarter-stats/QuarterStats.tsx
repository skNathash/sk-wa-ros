import clsx from "clsx";
import { useEffect, useState } from "react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import {
  emptyQuarterStats,
  getQuarterStats,
  type QuarterStatsData,
  type QuarterStatTone,
} from "./helper";

/* The run-rate tile is the only one that isn't a settled number, so it carries
   the outline and the cool tone — everything else is money already earned. */
const cardClass: Record<QuarterStatTone, string> = {
  money: "tw:border tw:border-transparent",
  plain: "tw:border tw:border-transparent",
  trend: "tw:border tw:border-blue-400",
};

const valueClass: Record<QuarterStatTone, string> = {
  money: "tw:text-emerald-700",
  plain: "tw:text-gray-900",
  trend: "tw:text-blue-600",
};

// The four numbers the quarter is read on: what it has sold, what it has kept,
// which month carried it, and the pace it is adding profit at.
const QuarterStats = () => {
  const [data, setData] = useState<QuarterStatsData>(emptyQuarterStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let result: QuarterStatsData;
      try {
        result = await getQuarterStats();
      } catch (e) {
        result = emptyQuarterStats();
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
    <div className="tw:mb-3 tw:grid tw:grid-cols-1 tw:gap-3 tw:md:grid-cols-2 tw:lg:grid-cols-4">
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

export default QuarterStats;
