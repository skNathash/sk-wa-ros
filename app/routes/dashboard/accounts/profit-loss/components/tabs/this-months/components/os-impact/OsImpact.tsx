import {
  ArrowRight,
  CreditCard,
  FileText,
  Receipt,
  TrendingUp,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import {
  emptyOsImpact,
  getOsImpact,
  type ImpactKind,
  type OsImpactData,
} from "./helper";

type OsImpactProps = {
  /** "Full breakdown" bubbles up; the tab owns where it goes. */
  callback?: (payload: { action: string }) => void;
};

const kindIcon: Record<ImpactKind, LucideIcon> = {
  time: Receipt,
  revenue: CreditCard,
  leak: FileText,
  wastage: TriangleAlert,
  growth: TrendingUp,
};

/* One tone per kind of gain: money saved and money earned stay green, a leak
   that was caught is blue, wastage is amber — the same language the leaks block
   below uses. */
const kindTile: Record<ImpactKind, string> = {
  time: "tw:bg-emerald-700 tw:text-white",
  revenue: "tw:bg-emerald-700 tw:text-white",
  leak: "tw:bg-blue-600 tw:text-white",
  wastage: "tw:bg-amber-500 tw:text-white",
  growth: "tw:bg-emerald-700 tw:text-white",
};

const kindInk: Record<ImpactKind, string> = {
  time: "tw:text-emerald-700",
  revenue: "tw:text-emerald-700",
  leak: "tw:text-blue-600",
  wastage: "tw:text-amber-600",
  growth: "tw:text-emerald-700",
};

/**
 * What the platform itself put on the month's bottom line — time that did not
 * have to be paid for, revenue that would have walked out, and leaks that were
 * caught before they landed on the P&L above.
 */
const OsImpact = ({ callback }: OsImpactProps) => {
  const { t } = useTranslation(["common"]);

  const [data, setData] = useState<OsImpactData>(emptyOsImpact);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let result: OsImpactData;
      try {
        result = await getOsImpact();
      } catch (e) {
        result = emptyOsImpact();
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
    <div className="tw:mb-3 tw:overflow-hidden tw:rounded-2xl tw:border tw:border-emerald-600 tw:bg-white tw:shadow-sm">
      <div className="tw:flex tw:flex-col tw:gap-3 tw:bg-emerald-50 tw:px-4 tw:py-3 tw:md:flex-row tw:md:items-center tw:md:justify-between">
        <div className="tw:min-w-0">
          <div className="tw:truncate tw:text-sm tw:font-bold tw:text-emerald-800">
            {data.title}
          </div>
          <div className="tw:mt-0.5 tw:text-[11px] tw:text-gray-500">
            {data.subtitle}
          </div>
        </div>
        <AppButton
          size="small"
          fill="outline"
          color="light"
          className="tw:shrink-0 tw:bg-white"
          onClick={() => callback?.({ action: "breakdown" })}
        >
          <ArrowRight size={14} />
          {t("pnlFullBreakdown", { defaultValue: "Full breakdown" })}
        </AppButton>
      </div>

      {loading ? (
        <div className="tw:p-6 tw:text-center">
          <AppSpinner />
        </div>
      ) : (
        <div className="tw:grid tw:grid-cols-1 tw:gap-x-6 tw:gap-y-3 tw:px-4 tw:py-4 tw:md:grid-cols-3">
          {data.items.map((item) => {
            const Icon = kindIcon[item.kind];
            return (
              <div key={item.key} className="tw:flex tw:items-start tw:gap-2.5">
                <span
                  className={`tw:flex tw:h-8 tw:w-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg ${kindTile[item.kind]}`}
                >
                  <Icon size={16} />
                </span>
                <div className="tw:min-w-0">
                  <div
                    className={`tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide ${kindInk[item.kind]}`}
                  >
                    {item.kindLabel}
                  </div>
                  <div className="tw:truncate tw:text-sm tw:font-semibold tw:text-gray-800">
                    {item.label}
                  </div>
                  <div
                    className={`tw:text-sm tw:font-bold ${kindInk[item.kind]}`}
                  >
                    {item.value}
                  </div>
                  {item.detail && (
                    <div className="tw:text-[11px] tw:text-gray-500">
                      {item.detail}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OsImpact;
