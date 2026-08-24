import { useEffect, useRef, useState } from "react";
import { LayoutGrid, Sparkles } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import useAppNav from "~/hooks/useAppNav";
import InventoryDashboardService from "~/services/InventoryDashboardService";
import CommonService from "~/services/CommonService";

interface TodaySummaryData {
  totalItems: number;
  inventoryValue: number;
  avgMargin: number;
  healthy: number;
  nearExpiry: number;
  outOfStock: number;
  loading: boolean;
}

const EMPTY_DATA: TodaySummaryData = {
  totalItems: 0,
  inventoryValue: 0,
  avgMargin: 0,
  healthy: 0,
  nearExpiry: 0,
  outOfStock: 0,
  loading: true,
};

const ShopToday = ({ className }: { className?: string }) => {
  const appNav = useAppNav();
  const [data, setData] = useState<TodaySummaryData>(EMPTY_DATA);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;

    const load = async () => {
      setData((prev) => ({ ...prev, loading: true }));

      try {
        const [totalRes, valueRes, healthRes, expiryRes, outOfStockRes] =
          await Promise.allSettled([
            InventoryDashboardService.getTotalDeals(
              {},
              { signal: controller.signal },
            ),
            InventoryDashboardService.getInventoryValue(
              {},
              { signal: controller.signal },
            ),
            InventoryDashboardService.getInventoryHealthScore(
              {},
              { signal: controller.signal },
            ),
            InventoryDashboardService.getInventoryRisk(
              "expiryRisk",
              { outputType: "count" },
              { signal: controller.signal },
            ),
            InventoryDashboardService.getOutOfStockSkus(
              {},
              { signal: controller.signal },
            ),
          ]);

        const get = (res: PromiseSettledResult<any>) =>
          res.status === "fulfilled" ? res.value : undefined;

        const totalItems = Number(get(totalRes)?.data?.data) || 0;
        const inventoryValue =
          Number(get(valueRes)?.data?.data?.inventoryValue) ||
          Number(get(valueRes)?.data?.data) ||
          0;
        const healthData = get(healthRes)?.data?.data || {};
        const avgMargin = Number(healthData.avgMargin) || 0;
        const nearExpiry = Number(get(expiryRes)?.data?.count) || 0;
        const outOfStock = Number(get(outOfStockRes)?.data?.data) || 0;
        const healthy = Math.max(0, totalItems - nearExpiry - outOfStock);

        setData({
          totalItems,
          inventoryValue,
          avgMargin,
          healthy,
          nearExpiry,
          outOfStock,
          loading: false,
        });
      } catch {
        setData((prev) => ({ ...prev, loading: false }));
      }
    };

    load();

    return () => {
      controller.abort();
    };
  }, []);

  const {
    totalItems,
    inventoryValue,
    avgMargin,
    healthy,
    nearExpiry,
    outOfStock,
    loading,
  } = data;

  return (
    <div
      className={[
        "tw:rounded-2xl tw:p-4 tw:sm:p-5 tw:text-white",
        className || "",
      ].join(" ")}
      // Themed via the palette rather than fixed emerald: `--primary-2` is the
      // brighter accent green in theme-2 and falls back to `--primary` in
      // themes that don't define one.
      style={{
        backgroundImage:
          "linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 45%, var(--primary-2, var(--primary))) 55%, var(--primary-2, var(--primary)) 100%)",
      }}
    >
      {/* Stacked on mobile; from lg the actions move out to the right of the
          summary text and the row stays vertically centred. */}
      <div className="tw:flex tw:flex-col tw:gap-5 tw:lg:flex-row tw:lg:items-center tw:lg:justify-between tw:lg:gap-6">
        <div className="tw:min-w-0">
          <p className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-white/75">
            Your shop today
          </p>

          <h2 className="tw:mt-2 tw:text-xl tw:sm:text-2xl tw:font-bold tw:leading-tight">
            {loading ? (
              <span className="tw:inline-block tw:h-7 tw:w-32 tw:animate-pulse tw:rounded tw:bg-white/25" />
            ) : (
              <>
                {totalItems} {totalItems === 1 ? "item" : "items"}
                <span className="tw:mx-1.5 tw:text-white/60">·</span>
                {CommonService.formatCompact(inventoryValue)} stock
              </>
            )}
          </h2>

          <p className="tw:mt-1.5 tw:text-xs tw:sm:text-sm tw:text-white/85">
            {loading ? (
              <span className="tw:inline-block tw:h-4 tw:w-48 tw:animate-pulse tw:rounded tw:bg-white/25" />
            ) : (
              <>
                <span className="tw:font-semibold">{healthy}</span> healthy
                <span className="tw:mx-1.5 tw:text-white/50">·</span>
                <span className="tw:font-semibold">{nearExpiry}</span>{" "}
                near-expiry
                <span className="tw:mx-1.5 tw:text-white/50">·</span>
                <span className="tw:font-semibold tw:text-rose-100">
                  {outOfStock}
                </span>{" "}
                out of stock
                {/* <span className="tw:mx-1.5 tw:text-white/50">·</span> */}
                {/* avg margin <span className="tw:font-semibold">{avgMargin}%</span> */}
              </>
            )}
          </p>
        </div>

        <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-3 tw:lg:shrink-0">
          {/* AppButton's `light`/`solid` pairing ships `tw:text-white`, so the
              label needs `!` to win against it on the white pill. */}
          <AppButton
            fill="solid"
            color="light"
            className="tw:bg-white! tw:text-[var(--primary)]! tw:hover:bg-white/90! tw:border-0 tw:rounded-full tw:px-5 tw:py-2 tw:text-sm tw:font-semibold"
            onClick={() => appNav.to("/dashboard/inventory/subscribe/search")}
          >
            <Sparkles size={16} className="tw:mr-1.5" />
            Subscribe more
          </AppButton>

          <AppButton
            fill="outline"
            color="light"
            className="tw:border-white/50! tw:text-white! tw:bg-transparent! tw:hover:bg-white/15! tw:rounded-full tw:px-5 tw:py-2 tw:text-sm tw:font-semibold"
            onClick={() => appNav.to("/dashboard/inventory/products/list")}
          >
            <LayoutGrid size={16} className="tw:mr-1.5" />
            My Items
          </AppButton>
        </div>
      </div>
    </div>
  );
};

export default ShopToday;
