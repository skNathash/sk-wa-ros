import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppProgress from "~/components/core/progress/AppProgress";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import {
  emptyGreetingHeader,
  getGreetingHeader,
  goalPercent,
  type GreetingHeaderData,
} from "./helper";

/**
 * Top row of the home dashboard: who is looking at it on the left, how the
 * day is going on the right. The two halves stack on mobile and sit on one
 * baseline from `md` up.
 */
const GreetingHeader = () => {
  const [data, setData] = useState<GreetingHeaderData>(emptyGreetingHeader);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let result: GreetingHeaderData;
      try {
        result = await getGreetingHeader();
      } catch (e) {
        result = emptyGreetingHeader();
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
      <div className="tw:mb-4 tw:flex tw:justify-center">
        <AppSpinner />
      </div>
    );
  }

  return (
    <div className="dashboard-greeting tw:mb-4 tw:flex tw:flex-col tw:gap-4 tw:md:flex-row tw:md:items-start tw:md:justify-between">
      <div className="tw:min-w-0">
        <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-500">
          Today · {data.storeName}
        </div>
        <h1 className="tw:mt-1 tw:text-2xl tw:font-bold tw:text-slate-900 tw:md:text-3xl">
          {data.greeting},{" "}
          <span className="tw:font-serif tw:italic tw:text-emerald-700">
            {data.ownerName}.
          </span>
        </h1>
        <div className="tw:mt-1 tw:text-xs tw:text-slate-500">
          {data.dateLabel} · {data.hoursLabel}
        </div>
      </div>

      <div className="tw:w-full tw:shrink-0 tw:md:w-80 tw:md:text-right">
        <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-500">
          Sold today · {data.billCount} bills
        </div>
        <div className="tw:mt-0.5 tw:text-3xl tw:font-bold tw:text-slate-900">
          <Amount value={data.soldToday} decimalPlaces={0} />
        </div>
        <div className="tw:mt-1 tw:text-[11px] tw:text-slate-500">
          Goal <Amount value={data.goal} decimalPlaces={0} /> ·{" "}
          {goalPercent(data)}% there · yesterday{" "}
          <Amount value={data.yesterday} decimalPlaces={0} />
        </div>
        <AppProgress
          value={goalPercent(data)}
          color="success"
          className="tw:mt-2 tw:h-1.5"
        />
      </div>
    </div>
  );
};

export default GreetingHeader;
