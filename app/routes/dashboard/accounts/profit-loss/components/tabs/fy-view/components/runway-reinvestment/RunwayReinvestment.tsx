import clsx from "clsx";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import {
  emptyRunway,
  getRunway,
  type RunwayData,
  type RunwayTone,
} from "./helper";

/* Money already earned is green, the cover it buys is blue, and the surplus is
   amber — it is the one tile asking to be acted on rather than just read. */
const cardClass: Record<RunwayTone, string> = {
  cash: "tw:border-l-4 tw:border-emerald-600",
  cover: "tw:border-l-4 tw:border-blue-500",
  investable: "tw:border-l-4 tw:border-amber-500",
};

const valueClass: Record<RunwayTone, string> = {
  cash: "tw:text-emerald-700",
  cover: "tw:text-blue-600",
  investable: "tw:text-amber-600",
};

/**
 * What the year's profit has actually left in the till — the cash in hand, how
 * long it would hold the shop up on its own, and how much of it is free to be
 * put to work.
 */
const RunwayReinvestment = () => {
  const { t } = useTranslation(["common"]);

  const [data, setData] = useState<RunwayData>(emptyRunway);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let result: RunwayData;
      try {
        result = await getRunway();
      } catch (e) {
        result = emptyRunway();
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
          {t("pnlRunwayReinvestment", {
            defaultValue: "Runway & reinvestment",
          })}
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
        <div className="tw:grid tw:grid-cols-1 tw:gap-3 tw:px-4 tw:py-4 tw:md:grid-cols-3">
          {data.items.map((item) => (
            <div
              key={item.key}
              className={clsx(
                "tw:rounded-xl tw:bg-gray-50 tw:px-4 tw:py-3",
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
      )}
    </div>
  );
};

export default RunwayReinvestment;
