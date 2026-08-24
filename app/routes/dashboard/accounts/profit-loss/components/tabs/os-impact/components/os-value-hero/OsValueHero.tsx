import { useEffect, useState } from "react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import {
  emptyOsValueHero,
  getOsValueHero,
  type OsValueHeroData,
} from "./helper";

/**
 * What the platform itself was worth this month, and what it has added since
 * the shop moved onto it — the one figure the rest of the tab breaks down.
 */
const OsValueHero = () => {
  const [data, setData] = useState<OsValueHeroData>(emptyOsValueHero);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let result: OsValueHeroData;
      try {
        result = await getOsValueHero();
      } catch (e) {
        result = emptyOsValueHero();
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
            {data.value}
          </div>

          <div className="tw:mt-1 tw:text-xs tw:text-emerald-50">
            {data.note}
          </div>
        </div>

        <div className="tw:shrink-0 tw:rounded-xl tw:bg-white/15 tw:px-4 tw:py-2.5 tw:text-right">
          <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-emerald-50">
            {data.cumulativeLabel}
          </div>
          <div className="tw:mt-0.5 tw:text-xl tw:font-bold tw:text-white">
            {data.cumulativeValue}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OsValueHero;
