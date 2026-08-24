import {
  CreditCard,
  FileText,
  Receipt,
  TrendingUp,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import {
  emptyFeatureImpact,
  getFeatureImpact,
  type FeatureImpactData,
  type ImpactKind,
} from "./helper";

type FeatureImpactProps = {
  /** A row click bubbles up; the tab owns where the audit trail opens. */
  callback?: (payload: { action: string; key: string }) => void;
};

const kindIcon: Record<ImpactKind, LucideIcon> = {
  time: Receipt,
  revenue: CreditCard,
  leak: FileText,
  wastage: TriangleAlert,
  growth: TrendingUp,
};

/* One tone per kind of gain: money saved and money earned stay green, a leak
   that was caught is blue, wastage is amber — the same language the month's
   impact strip uses. */
const kindTile: Record<ImpactKind, string> = {
  time: "tw:bg-emerald-700 tw:text-white",
  revenue: "tw:bg-emerald-700 tw:text-white",
  leak: "tw:bg-blue-600 tw:text-white",
  wastage: "tw:bg-amber-500 tw:text-white",
  growth: "tw:bg-emerald-700 tw:text-white",
};

const kindBadge: Record<ImpactKind, string> = {
  time: "tw:bg-emerald-50 tw:text-emerald-700",
  revenue: "tw:bg-emerald-50 tw:text-emerald-700",
  leak: "tw:bg-blue-50 tw:text-blue-600",
  wastage: "tw:bg-amber-50 tw:text-amber-600",
  growth: "tw:bg-emerald-50 tw:text-emerald-700",
};

const kindInk: Record<ImpactKind, string> = {
  time: "tw:text-emerald-700",
  revenue: "tw:text-emerald-700",
  leak: "tw:text-blue-600",
  wastage: "tw:text-amber-600",
  growth: "tw:text-emerald-700",
};

/**
 * The month's platform value taken apart feature by feature, with the working
 * spelled out under each one and the running total beside it — so a figure that
 * would otherwise read as a claim can be checked.
 */
const FeatureImpact = ({ callback }: FeatureImpactProps) => {
  const { t } = useTranslation(["common"]);

  const [data, setData] = useState<FeatureImpactData>(emptyFeatureImpact);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let result: FeatureImpactData;
      try {
        result = await getFeatureImpact();
      } catch (e) {
        result = emptyFeatureImpact();
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
          {t("pnlFeatureByFeatureImpact", {
            defaultValue: "Feature-by-feature impact",
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
        <div>
          {/* Column captions only earn their space once the rows sit in a row. */}
          <div className="tw:hidden tw:items-center tw:gap-3 tw:bg-gray-50 tw:px-4 tw:py-2 tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500 tw:lg:flex">
            <div className="tw:flex-1">
              {t("pnlFeature", { defaultValue: "Feature" })}
            </div>
            <div className="tw:w-32 tw:shrink-0">
              {t("pnlImpactKind", { defaultValue: "Kind" })}
            </div>
            <div className="tw:w-28 tw:shrink-0 tw:text-right">
              {data.periodLabel}
            </div>
            <div className="tw:w-44 tw:shrink-0 tw:text-right">
              {data.cumulativeLabel}
            </div>
          </div>

          {data.rows.map((row) => {
            const Icon = kindIcon[row.kind];
            return (
              <button
                key={row.key}
                type="button"
                onClick={() =>
                  callback?.({ action: "auditTrail", key: row.key })
                }
                className="tw:flex tw:w-full tw:flex-col tw:gap-2 tw:border-t tw:border-gray-100 tw:px-4 tw:py-3 tw:text-left tw:hover:bg-gray-50 tw:lg:flex-row tw:lg:items-center tw:lg:gap-3"
              >
                <div className="tw:flex tw:min-w-0 tw:flex-1 tw:items-start tw:gap-2.5">
                  <span
                    className={`tw:flex tw:h-8 tw:w-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg ${kindTile[row.kind]}`}
                  >
                    <Icon size={16} />
                  </span>
                  <div className="tw:min-w-0">
                    <div className="tw:text-sm tw:font-semibold tw:text-gray-800">
                      {row.label}
                    </div>
                    <div className={`tw:text-[11px] ${kindInk[row.kind]}`}>
                      {row.description}
                    </div>
                  </div>
                </div>

                <div className="tw:w-32 tw:shrink-0">
                  <span
                    className={`tw:inline-block tw:rounded tw:px-1.5 tw:py-0.5 tw:text-[9px] tw:font-semibold tw:uppercase tw:tracking-wide ${kindBadge[row.kind]}`}
                  >
                    {row.kindLabel}
                  </span>
                </div>

                <div className="tw:w-28 tw:shrink-0 tw:lg:text-right">
                  <div
                    className={`tw:text-sm tw:font-bold ${kindInk[row.kind]}`}
                  >
                    {row.value}
                  </div>
                  <div className="tw:text-[10px] tw:text-gray-400">
                    {row.unit}
                  </div>
                </div>

                <div className="tw:w-44 tw:shrink-0 tw:lg:text-right">
                  <div className="tw:text-sm tw:font-bold tw:text-gray-900">
                    {row.cumulativeValue}
                  </div>
                  <div className="tw:text-[10px] tw:text-gray-400">
                    {row.cumulativeUnit}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FeatureImpact;
