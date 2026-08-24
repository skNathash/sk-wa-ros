import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { emptyYtdHero, getYtdHero, type YtdHeroData } from "./helper";

/**
 * What the financial year has kept so far, with the one comparison that tells
 * the shopkeeper whether the year is ahead of the last one: the pace chip, which
 * reads the four months banked against the whole of FY26.
 */
const YtdHero = () => {
  const [data, setData] = useState<YtdHeroData>(emptyYtdHero);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let result: YtdHeroData;
      try {
        result = await getYtdHero();
      } catch (e) {
        result = emptyYtdHero();
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
    <div className="tw:mb-3 tw:rounded-2xl tw:bg-gradient-to-r tw:from-emerald-800 tw:to-emerald-500 tw:px-5 tw:py-5 tw:shadow-sm">
      <div className="tw:flex tw:flex-col tw:gap-4 tw:md:flex-row tw:md:items-center tw:md:justify-between">
        <div className="tw:min-w-0">
          <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-emerald-100">
            {data.caption}
          </div>

          <div className="tw:mt-1 tw:text-4xl tw:font-bold tw:text-white">
            <Amount value={data.net} decimalPlaces={0} />
          </div>

          <div className="tw:mt-1 tw:text-xs tw:text-emerald-50">
            {data.note}
          </div>
        </div>

        <div className="tw:shrink-0 tw:rounded-xl tw:bg-white/15 tw:px-4 tw:py-2.5 tw:text-right">
          <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-emerald-50">
            {data.paceLabel}
          </div>
          <div className="tw:mt-0.5 tw:text-2xl tw:font-bold tw:text-white">
            {data.paceValue}
          </div>
        </div>
      </div>
    </div>
  );
};

export default YtdHero;
