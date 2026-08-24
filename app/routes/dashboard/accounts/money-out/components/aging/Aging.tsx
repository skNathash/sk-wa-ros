import { useEffect, useState } from "react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AgingBar from "./AgingBar";
import AgingBuckets from "./AgingBuckets";
import { emptyAging, getAging, type AgingData } from "./helper";

// How old the money owed is. The block reads the aging summary once and hands
// the same buckets to both halves below it — the bar for the shape of the debt,
// the cards for what each window is actually worth.
const Aging = () => {
  const [data, setData] = useState<AgingData>(emptyAging);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let result: AgingData;
      try {
        result = await getAging();
      } catch (e) {
        result = emptyAging();
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

  if (data.buckets.length === 0) return null;

  return (
    <div className="tw:mb-3 tw:overflow-hidden tw:rounded-2xl tw:bg-white tw:shadow-sm">
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border-b tw:border-gray-100 tw:px-4 tw:py-3">
        <div className="tw:text-sm tw:font-bold tw:text-gray-800">
          Aging analysis · payables
        </div>
        <div className="tw:text-[11px] tw:text-gray-500">{data.asOfLabel}</div>
      </div>

      <div className="tw:px-4 tw:py-3">
        <AgingBar buckets={data.buckets} />

        <div className="tw:mt-3">
          <AgingBuckets buckets={data.buckets} />
        </div>
      </div>
    </div>
  );
};

export default Aging;
