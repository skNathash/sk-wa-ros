import { useEffect, useMemo, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import MonthYearFilter, {
  getCurrentMonthYear,
  getMonthRange,
  type MonthYearValue,
} from "~/shared/others/month-year-filter/MonthYearFilter";

interface SpendCategory {
  key: string;
  label: string;
  amount: number;
  share: number;
  colorClass: string;
  dotClass: string;
}

interface SpendChannel {
  key: string;
  label: string;
  transactions: number;
  value: number;
  share: number;
}


/** Brand colors per spend channel key. */
const CHANNEL_COLORS: Record<string, string> = {
  sk: "tw:bg-[#2e5aa8]",
  sellers: "tw:bg-[#1f8a4f]",
  localVendors: "tw:bg-[#c85a1d]",
};

const buildCategories = (channels: SpendChannel[]): SpendCategory[] =>
  channels
    // Always show known channels; hide only empty unknown ones (e.g. "Unattributed (legacy)").
    .filter(
      (channel) => channel.key in CHANNEL_COLORS || Number(channel.value) > 0,
    )
    .map((channel) => {
      const colorClass = CHANNEL_COLORS[channel.key] ?? "tw:bg-slate-400";
      return {
        key: channel.key,
        label: channel.label,
        amount: Number(channel.value) || 0,
        share: Number(channel.share) || 0,
        colorClass,
        dotClass: colorClass,
      };
    });

/**
 * "Spend" card with a stacked progress bar and channel breakdown.
 * Owns its month/year period and fetches the `spend` insights block for it.
 */
const SpendSummary = () => {
  const [period, setPeriod] = useState<MonthYearValue>(getCurrentMonthYear);
  const [categories, setCategories] = useState<SpendCategory[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const { startDate, endDate } = useMemo(
    () => getMonthRange(period.month, period.year),
    [period.month, period.year],
  );

  useEffect(() => {
    let active = true;
    const fetchSpend = async () => {
      try {
        setLoading(true);
        const response = await PurchaseOrderService.getDashboardInsights({
          filter: { type: "analytics", startDate, endDate },
        });
        if (!active) return;
        const analytics = response.data?.data?.analytics;
        setCategories(buildCategories(analytics?.channels ?? []));
        setTotal(Number(analytics?.totals?.value) || 0);
      } catch (error) {
        console.error("Spend insights error:", error);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchSpend();
    return () => {
      active = false;
    };
  }, [startDate, endDate]);

  return (
    <div className="tw:relative tw:overflow-hidden tw:rounded-2xl tw:bg-[linear-gradient(115deg,#0d7357_0%,#128a5d_45%,#1fa055_100%)] tw:p-4 tw:text-white tw:shadow-sm">
      {/* Soft highlight orb, mirrors the reference card */}
      <span className="tw:pointer-events-none tw:absolute tw:-right-10 tw:-bottom-16 tw:h-48 tw:w-48 tw:rounded-full tw:bg-white/10" />

      {/* Mobile: label + period on one line, value below. Desktop: value first, period on the right. */}
      <div className="tw:relative tw:flex tw:flex-wrap tw:items-center tw:gap-2">
        <p className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-white/70">
          Spend
        </p>
        <MonthYearFilter
          month={period.month}
          year={period.year}
          onChange={setPeriod}
          className="tw:order-2 tw:sm:order-3 tw:sm:ml-auto"
          inputClassName="tw:border-transparent tw:bg-white tw:text-slate-900 tw:[&_svg]:text-slate-500"
        />
        <Amount
          value={total}
          className="tw:order-3 tw:w-full tw:text-2xl tw:font-bold tw:text-white tw:sm:order-2 tw:sm:w-auto"
        />
      </div>

      {loading ? (
        <div className="tw:relative tw:mt-3 tw:h-3 tw:w-full tw:animate-pulse tw:rounded-full tw:bg-white/20" />
      ) : total <= 0 ? (
        <p className="tw:relative tw:mt-3 tw:text-xs tw:text-white/70">
          No spend in this period.
        </p>
      ) : (
        <>
          <div className="tw:relative tw:mt-3 tw:flex tw:h-3 tw:w-full tw:overflow-hidden tw:rounded-full tw:bg-white/20">
            {categories.map((category) => (
              <div
                key={category.key}
                className={`tw:h-full ${category.colorClass}`}
                style={{
                  width: `${(category.amount / total) * 100}%`,
                }}
              />
            ))}
          </div>

          <div className="tw:relative tw:mt-3 tw:grid tw:grid-cols-3 tw:gap-2">
            {categories.map((category) => (
              <div
                key={category.key}
                className="tw:space-y-1 tw:rounded-xl tw:bg-white/12 tw:p-2"
              >
                <div className="tw:flex tw:items-center tw:gap-1.5">
                  <span
                    className={`tw:h-2.5 tw:w-2.5 tw:rounded-sm ${category.dotClass}`}
                  />
                  <span className="tw:text-xs tw:font-semibold tw:text-white/85">
                    {category.label}
                  </span>
                </div>
                <Amount
                  value={category.amount}
                  className="tw:block tw:text-sm tw:font-bold tw:text-white"
                />
                <span className="tw:text-[10px] tw:text-white/65">
                  {Math.round(category.share)}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SpendSummary;
