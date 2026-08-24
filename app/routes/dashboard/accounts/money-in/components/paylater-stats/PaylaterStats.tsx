import clsx from "clsx";
import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { allLanes } from "../paylater-book/helper";
import {
  emptyPaylaterStats,
  getPaylaterStats,
  type PaylaterStat,
  type PaylaterStatsData,
} from "./helper";

/* One tone per tile: the count stays in ink, amber is money drawn and still
   owed, green is the headroom the shop has sanctioned. */
const toneClass: Record<PaylaterStat["tone"], string> = {
  count: "tw:text-gray-900",
  outstanding: "tw:text-amber-600",
  limit: "tw:text-emerald-700",
};

type PaylaterStatsProps = {
  /** Lane the book is read for; omit to total both. */
  lane?: string;
};

// The three numbers that frame the paylater tab: how many customers are on the
// credit book, how much of it is drawn, and how much has been sanctioned.
const PaylaterStats = ({ lane = allLanes }: PaylaterStatsProps) => {
  const [data, setData] = useState<PaylaterStatsData>(emptyPaylaterStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let result: PaylaterStatsData;
      try {
        result = await getPaylaterStats(lane);
      } catch (e) {
        result = emptyPaylaterStats();
      }
      if (cancelled) return;
      setData(result);
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [lane]);

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
            {item.isAmount ? (
              <Amount value={item.value} decimalPlaces={0} />
            ) : (
              item.value
            )}
          </div>

          <div className="tw:mt-1 tw:text-[11px] tw:text-gray-500">
            {item.note}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PaylaterStats;
