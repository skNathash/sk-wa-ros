import clsx from "clsx";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import {
  emptyFyForecast,
  getFyForecast,
  type ForecastTone,
  type FyForecastData,
} from "./helper";

/* The projected column is a judgement rather than a recorded amount, so it is
   set apart from the money columns by the cooler tone. */
const valueClass: Record<ForecastTone, string> = {
  money: "tw:text-emerald-700",
  outlook: "tw:text-blue-600",
};

/**
 * Where the year lands if the last four months keep their pace — the run rate
 * carried forward, and how far it can be trusted.
 */
const FyForecast = () => {
  const { t } = useTranslation(["common"]);

  const [data, setData] = useState<FyForecastData>(emptyFyForecast);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let result: FyForecastData;
      try {
        result = await getFyForecast();
      } catch (e) {
        result = emptyFyForecast();
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

  return (
    <div className="tw:mb-3 tw:overflow-hidden tw:rounded-2xl tw:bg-white tw:shadow-sm">
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border-b tw:border-gray-100 tw:px-4 tw:py-3">
        <div className="tw:text-sm tw:font-bold tw:text-gray-800">
          {t("pnlEndOfFyForecast", { defaultValue: "End-of-FY27 forecast" })}
        </div>
        <div className="tw:shrink-0 tw:text-[11px] tw:text-gray-400">
          {data.note}
        </div>
      </div>

      {loading ? (
        <div className="tw:p-6 tw:text-center">
          <AppSpinner />
        </div>
      ) : (
        <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:px-4 tw:py-4 tw:md:grid-cols-2 tw:lg:grid-cols-4">
          {data.items.map((item) => (
            <div key={item.key} className="tw:min-w-0">
              <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500">
                {item.label}
              </div>
              <div
                className={clsx(
                  "tw:mt-1 tw:text-3xl tw:font-bold",
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
      )}
    </div>
  );
};

export default FyForecast;
