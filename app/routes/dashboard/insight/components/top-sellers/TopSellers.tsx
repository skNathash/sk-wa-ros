import { useEffect, useMemo, useState } from "react";
import AppLink from "~/components/core/link/AppLink";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import MonthYearFilter, {
  getCurrentMonthYear,
  getMonthRange,
  type MonthYearValue,
} from "~/shared/others/month-year-filter/MonthYearFilter";

interface TopSeller {
  id: string;
  type: string;
  name: string;
  refId?: string;
  amount: number;
  colorClass: string;
}

interface ApiTopSeller {
  partyId: string;
  refId?: string;
  name: string;
  amount: number;
  orders: number;
  channel: string;
}

/** Bar/badge color per seller channel. */
const CHANNEL_COLORS: Record<string, string> = {
  SK: "tw:bg-[#2e5aa8]",
  PEER: "tw:bg-[#1f8a4f]",
  LOCAL: "tw:bg-[#c85a1d]",
};

const mapSellers = (sellers: ApiTopSeller[]): TopSeller[] =>
  sellers.map((seller) => ({
    id: seller.partyId,
    refId: seller.refId,
    type: seller.channel,
    name: seller.name,
    amount: Number(seller.amount) || 0,
    colorClass: CHANNEL_COLORS[seller.channel] ?? "tw:bg-slate-400",
  }));

/**
 * "Top sellers" list with channel badges and mini progress bars.
 * Owns its month/year period; fetches the `analytics` insights block and
 * reads `topSellers`.
 */
const TopSellers = () => {
  const [period, setPeriod] = useState<MonthYearValue>(getCurrentMonthYear);
  const [sellers, setSellers] = useState<TopSeller[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const { startDate, endDate } = useMemo(
    () => getMonthRange(period.month, period.year),
    [period.month, period.year],
  );

  useEffect(() => {
    let active = true;
    const fetchSellers = async () => {
      try {
        setLoading(true);
        const response = await PurchaseOrderService.getDashboardInsights({
          filter: { type: "topSellers", startDate, endDate },
        });
        if (!active) return;
        setSellers(mapSellers(response.data?.data?.topSellers ?? []));
      } catch (error) {
        console.error("Top sellers insights error:", error);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchSellers();
    return () => {
      active = false;
    };
  }, [startDate, endDate]);

  const maxAmount = Math.max(1, ...sellers.map((s) => s.amount));

  // `app-bleed-x` (theme-2 mobile) pulls the card out of the page gutter so it
  // runs edge to edge; a no-op on desktop and other themes.
  return (
    <div className="app-bleed-x tw:rounded-2xl tw:bg-white tw:p-4 tw:shadow-sm tw:ring-1 tw:ring-slate-200/70">
      <div className="tw:mb-3 tw:flex tw:items-center tw:justify-between tw:gap-2">
        <p className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500">
          Top sellers
        </p>
        <MonthYearFilter
          month={period.month}
          year={period.year}
          onChange={setPeriod}
        />
      </div>
      {!loading && sellers.length === 0 ? (
        <p className="tw:text-xs tw:text-gray-400">
          No sellers in this period.
        </p>
      ) : (
        <div className="tw:space-y-3">
          {sellers.map((seller) => (
            <div key={seller.id} className="tw:flex tw:items-center tw:gap-3">
              <AppBadge
                variant="white"
                className="tw:shrink-0 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide tw:text-gray-500"
              >
                {seller.type}
              </AppBadge>
              <div className="tw:min-w-0 tw:flex-1">
                <AppLink
                  asLink
                  href={`/products/buy-from-other-retailer/retailer/${seller.id}`}
                  className="tw:block tw:truncate tw:text-sm tw:font-bold tw:text-slate-800 tw:hover:text-primary"
                >
                  {seller.name}
                </AppLink>
                {seller.refId ? (
                  <span className="tw:block tw:truncate tw:text-[10px] tw:text-gray-400">
                    Ref: {seller.refId}
                  </span>
                ) : null}
              </div>
              <div className="tw:w-16 tw:shrink-0">
                <div className="tw:h-1.5 tw:w-full tw:overflow-hidden tw:rounded-full tw:bg-gray-100">
                  <div
                    className={`tw:h-full ${seller.colorClass}`}
                    style={{ width: `${(seller.amount / maxAmount) * 100}%` }}
                  />
                </div>
              </div>
              <Amount
                value={seller.amount}
                className="tw:shrink-0 tw:text-sm tw:font-bold tw:text-slate-900"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopSellers;
