import { useEffect, useMemo, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppLink from "~/components/core/link/AppLink";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import MonthYearFilter, {
  getCurrentMonthYear,
  getMonthRange,
  type MonthYearValue,
} from "~/shared/others/month-year-filter/MonthYearFilter";

interface TopVendor {
  id: string;
  type: string;
  name: string;
  amount: number;
  colorClass: string;
}

interface ApiTopVendor {
  partyId: string;
  name: string;
  amount: number;
  orders: number;
  channel: string;
}

/** Bar/badge color per vendor channel. */
const CHANNEL_COLORS: Record<string, string> = {
  SK: "tw:bg-[#2e5aa8]",
  PEER: "tw:bg-[#1f8a4f]",
  LOCAL: "tw:bg-[#c85a1d]",
};

const mapVendors = (vendors: ApiTopVendor[]): TopVendor[] =>
  vendors.map((vendor) => ({
    id: vendor.partyId,
    type: vendor.channel || "LOCAL",
    name: vendor.name,
    amount: Number(vendor.amount) || 0,
    colorClass: CHANNEL_COLORS[vendor.channel] ?? "tw:bg-[#c85a1d]",
  }));

/**
 * "Top vendors" list with channel badges and mini progress bars.
 * Owns its month/year period; fetches the `analytics` insights block and
 * reads `topVendors`.
 */
const TopVendors = () => {
  const [period, setPeriod] = useState<MonthYearValue>(getCurrentMonthYear);
  const [vendors, setVendors] = useState<TopVendor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const { startDate, endDate } = useMemo(
    () => getMonthRange(period.month, period.year),
    [period.month, period.year],
  );

  useEffect(() => {
    let active = true;
    const fetchVendors = async () => {
      try {
        setLoading(true);
        const response = await PurchaseOrderService.getDashboardInsights({
          filter: { type: "topVendors", startDate, endDate },
        });
        if (!active) return;
        setVendors(mapVendors(response.data?.data?.topVendors ?? []));
      } catch (error) {
        console.error("Top vendors insights error:", error);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchVendors();
    return () => {
      active = false;
    };
  }, [startDate, endDate]);

  const maxAmount = Math.max(1, ...vendors.map((v) => v.amount));

  // `app-bleed-x` (theme-2 mobile) pulls the card out of the page gutter so it
  // runs edge to edge; a no-op on desktop and other themes.
  return (
    <div className="app-bleed-x tw:rounded-2xl tw:bg-white tw:p-4 tw:shadow-sm tw:ring-1 tw:ring-slate-200/70">
      <div className="tw:mb-3 tw:flex tw:items-center tw:justify-between tw:gap-2">
        <p className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500">
          Top vendors
        </p>
        <MonthYearFilter
          month={period.month}
          year={period.year}
          onChange={setPeriod}
        />
      </div>
      {!loading && vendors.length === 0 ? (
        <p className="tw:text-xs tw:text-gray-400">
          No vendors in this period.
        </p>
      ) : (
        <div className="tw:space-y-3">
          {vendors.map((vendor) => (
            <div key={vendor.id} className="tw:flex tw:items-center tw:gap-3">
              <AppBadge
                variant="white"
                className="tw:shrink-0 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide tw:text-gray-500"
              >
                {vendor.type}
              </AppBadge>
              <AppLink
                asLink
                href={`/dashboard/vendor/view/${vendor.id}`}
                className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-sm tw:font-bold tw:text-slate-800 tw:hover:text-primary"
              >
                {vendor.name}
              </AppLink>
              <div className="tw:w-16 tw:shrink-0">
                <div className="tw:h-1.5 tw:w-full tw:overflow-hidden tw:rounded-full tw:bg-gray-100">
                  <div
                    className={`tw:h-full ${vendor.colorClass}`}
                    style={{ width: `${(vendor.amount / maxAmount) * 100}%` }}
                  />
                </div>
              </div>
              <Amount
                value={vendor.amount}
                className="tw:shrink-0 tw:text-sm tw:font-bold tw:text-slate-900"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopVendors;
