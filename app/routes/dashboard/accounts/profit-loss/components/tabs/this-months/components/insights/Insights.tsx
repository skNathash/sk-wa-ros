import {
  CreditCard,
  Sparkles,
  TrendingUp,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import {
  emptyInsights,
  getInsights,
  type InsightTone,
  type InsightsData,
} from "./helper";

const toneIcon: Record<InsightTone, LucideIcon> = {
  good: TrendingUp,
  warning: TriangleAlert,
  neutral: CreditCard,
  platform: Sparkles,
};

/* The left rule carries the tone, so the four findings can be scanned for
   "anything wrong?" without reading a word of them. */
const toneRule: Record<InsightTone, string> = {
  good: "tw:border-l-emerald-600",
  warning: "tw:border-l-amber-500",
  neutral: "tw:border-l-blue-500",
  platform: "tw:border-l-emerald-600",
};

const toneTile: Record<InsightTone, string> = {
  good: "tw:bg-emerald-700 tw:text-white",
  warning: "tw:bg-amber-500 tw:text-white",
  neutral: "tw:bg-blue-600 tw:text-white",
  platform: "tw:bg-emerald-700 tw:text-white",
};

// Findings read off the month's numbers — what went right, what is drifting,
// and what is worth doing before the books close.
const Insights = () => {
  const [data, setData] = useState<InsightsData>(emptyInsights);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let result: InsightsData;
      try {
        result = await getInsights();
      } catch (e) {
        result = emptyInsights();
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
          {data.title}
        </div>
        <div className="tw:text-[11px] tw:text-gray-400">{data.note}</div>
      </div>

      {loading ? (
        <div className="tw:p-6 tw:text-center">
          <AppSpinner />
        </div>
      ) : (
        <div className="tw:grid tw:grid-cols-1 tw:gap-3 tw:p-4 tw:md:grid-cols-2">
          {data.items.map((item) => {
            const Icon = toneIcon[item.tone];
            return (
              <div
                key={item.key}
                className={`tw:flex tw:items-start tw:gap-2.5 tw:rounded-xl tw:border-l-4 tw:bg-gray-50 tw:px-3 tw:py-3 ${toneRule[item.tone]}`}
              >
                <span
                  className={`tw:flex tw:h-8 tw:w-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg ${toneTile[item.tone]}`}
                >
                  <Icon size={16} />
                </span>
                <div className="tw:min-w-0">
                  <div className="tw:text-sm tw:font-bold tw:text-gray-800">
                    {item.title}
                  </div>
                  <div className="tw:mt-0.5 tw:text-[11px] tw:text-gray-500">
                    {item.detail}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Insights;
