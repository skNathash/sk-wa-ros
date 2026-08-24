import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import {
  emptyNetProfitHero,
  getNetProfitHero,
  type NetProfitHeroData,
} from "./helper";

/**
 * The one number the month is judged on, with the three comparisons that give
 * it meaning: against last month, against the same month last year, and against
 * the year so far.
 */
const NetProfitHero = () => {
  const { t } = useTranslation(["common"]);

  const [data, setData] = useState<NetProfitHeroData>(emptyNetProfitHero);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let result: NetProfitHeroData;
      try {
        result = await getNetProfitHero();
      } catch (e) {
        result = emptyNetProfitHero();
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
            {t("pnlMarginLine", {
              defaultValue: "Margin {{margin}}%",
              margin: data.margin,
            })}
            <span className="tw:px-1.5 tw:text-emerald-200">·</span>
            {t("pnlBooksClose", {
              defaultValue: "Books close in {{count}} days",
              count: data.daysToClose,
            })}
          </div>
        </div>

        {/* Comparison chips — same money, read against three other periods. */}
        <div className="tw:flex tw:shrink-0 tw:flex-wrap tw:gap-2">
          {data.chips.map((chip) => (
            <div
              key={chip.key}
              className="tw:min-w-[104px] tw:rounded-xl tw:bg-white/15 tw:px-3 tw:py-2"
            >
              <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-emerald-50">
                {chip.label}
              </div>
              <div className="tw:mt-0.5 tw:text-lg tw:font-bold tw:text-white">
                {chip.value}
              </div>
              <div className="tw:text-[11px] tw:text-emerald-50">
                {chip.note}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NetProfitHero;
