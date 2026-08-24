import clsx from "clsx";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import {
  emptyThreeYearStory,
  getThreeYearStory,
  type StoryTone,
  type ThreeYearStoryData,
} from "./helper";

/* The forecast year is the point of the block, so it is the only card that is
   filled and ringed; the two behind it recede as they get older. */
const cardClass: Record<StoryTone, string> = {
  past: "tw:border tw:border-gray-200 tw:bg-white",
  partial: "tw:border tw:border-gray-200 tw:bg-white",
  current: "tw:border-2 tw:border-emerald-700 tw:bg-emerald-50",
};

const yearClass: Record<StoryTone, string> = {
  past: "tw:text-gray-400",
  partial: "tw:text-blue-600",
  current: "tw:text-emerald-700",
};

const badgeClass: Record<StoryTone, string> = {
  past: "tw:bg-gray-100 tw:text-gray-500",
  partial: "tw:bg-blue-50 tw:text-blue-600",
  current: "tw:bg-emerald-700 tw:text-white",
};

const netProfitClass: Record<StoryTone, string> = {
  past: "tw:text-gray-400",
  partial: "tw:text-blue-600",
  current: "tw:text-emerald-700",
};

/**
 * Three years side by side — the one before StoreKing, the one the shop moved
 * during, and the one being forecast on it — so the margin line can be read as
 * a story rather than as three unrelated numbers.
 */
const ThreeYearStory = () => {
  const { t } = useTranslation(["common"]);

  const [data, setData] = useState<ThreeYearStoryData>(emptyThreeYearStory);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let result: ThreeYearStoryData;
      try {
        result = await getThreeYearStory();
      } catch (e) {
        result = emptyThreeYearStory();
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
      <div className="tw:border-b tw:border-gray-100 tw:px-4 tw:py-3">
        <div className="tw:text-sm tw:font-bold tw:text-gray-800">
          {data.title}
        </div>
      </div>

      {loading ? (
        <div className="tw:p-6 tw:text-center">
          <AppSpinner />
        </div>
      ) : data.years.length === 0 ? (
        <div className="tw:p-6 tw:text-center tw:text-sm tw:text-gray-500">
          {t("noDataAvailable", { defaultValue: "No data available" })}
        </div>
      ) : (
        <div className="tw:px-4 tw:py-4">
          <div className="tw:grid tw:grid-cols-1 tw:gap-3 tw:md:grid-cols-3">
            {data.years.map((year) => (
              <div
                key={year.key}
                className={clsx("tw:rounded-2xl tw:p-4", cardClass[year.tone])}
              >
                <div className="tw:flex tw:items-start tw:justify-between tw:gap-2">
                  <div
                    className={clsx(
                      "tw:text-xl tw:font-bold",
                      yearClass[year.tone],
                    )}
                  >
                    {year.label}
                  </div>
                  <span
                    className={clsx(
                      "tw:shrink-0 tw:rounded tw:px-1.5 tw:py-0.5 tw:text-[9px] tw:font-semibold tw:uppercase tw:tracking-wide",
                      badgeClass[year.tone],
                    )}
                  >
                    {year.badge}
                  </span>
                </div>

                <div className="tw:mt-3 tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500">
                  {t("revenue", { defaultValue: "Revenue" })}
                </div>
                <div className="tw:text-2xl tw:font-bold tw:text-gray-900">
                  {year.revenue}
                </div>

                <div className="tw:mt-3 tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500">
                  {t("netProfit", { defaultValue: "Net profit" })}
                </div>
                <div
                  className={clsx(
                    "tw:text-2xl tw:font-bold",
                    netProfitClass[year.tone],
                  )}
                >
                  {year.netProfit}
                </div>

                <div className="tw:mt-3 tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500">
                  {t("margin", { defaultValue: "Margin" })}
                </div>
                <div className="tw:text-2xl tw:font-bold tw:text-gray-900">
                  {year.margin}
                </div>
              </div>
            ))}
          </div>

          <div className="tw:mt-4 tw:rounded-xl tw:bg-emerald-50 tw:px-3 tw:py-2.5 tw:text-[11px] tw:text-gray-700">
            <span className="tw:font-semibold tw:text-emerald-800">
              {t("pnlTheStory", { defaultValue: "The story:" })}
            </span>{" "}
            {data.story}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreeYearStory;
