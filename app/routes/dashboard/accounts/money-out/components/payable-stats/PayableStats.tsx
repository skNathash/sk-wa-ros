import clsx from "clsx";
import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAccountsDateRange from "~/shared/accounts/hooks/useAccountsDateRange";
import {
  emptyPayableStats,
  getPayableStats,
  type PayableStat,
  type PayableStatsData,
} from "./helper";

/* One tone per tile so the row reads at a glance: red is money still to go out,
   ink is money already settled, amber is a bill that has gone late. */
const toneClass: Record<PayableStat["tone"], string> = {
  owed: "tw:text-red-600",
  paid: "tw:text-gray-900",
  overdue: "tw:text-amber-600",
};

// The three numbers that frame the whole money-out screen: what is still owed,
// what has already gone out this month, and what has gone late.
const PayableStats = () => {
  const range = useAccountsDateRange();

  const [data, setData] = useState<PayableStatsData>(emptyPayableStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let result: PayableStatsData;
      try {
        result = await getPayableStats(range);
      } catch (e) {
        result = emptyPayableStats();
      }
      if (cancelled) return;
      setData(result);
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [range]);

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

export default PayableStats;
