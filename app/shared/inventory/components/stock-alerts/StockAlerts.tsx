import clsx from "clsx";
import {
  ChevronRight,
  CircleX,
  Clock,
  PauseCircle,
  TriangleAlert,
  TrendingDown,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import useAppNav from "~/hooks/useAppNav";
import InventoryDashboardService from "~/services/InventoryDashboardService";
import SellerCatalogService from "~/services/SellerCatalogService";
import { useInventoryStockUpdated } from "~/shared/inventory/events";

/** Which filter field a task maps to — velocity (movement) or stockStatus. */
export type StockAlertType = "movement" | "status";

export interface StockAlertSelection {
  /** Task key: "out-of-stock" | "slow-moving" | "non-moving" | "near-expiry" | "expired". */
  key: string;
  type: StockAlertType;
  /** The filter value ("Out of Stock", "Slow Moving", "Non-Moving", …). */
  value: string;
}

type Tone = "red" | "deepRed" | "amber" | "slate";

interface StockAlertDef {
  key: string;
  type: StockAlertType;
  /** Filter value understood by the products list (velocity / stockStatus). */
  value: string;
  icon: LucideIcon;
  tone: Tone;
  /** Headline, given the count. */
  title: (count: number) => string;
  /** Short countless label used by the compact variant. */
  label: string;
  /** Why it matters / what to do about it. */
  hint: string;
}

// Each row carries its own tint so severity reads at a glance down the list:
// the icon sits on a white chip inside the tinted row, and the headline picks
// up the same hue. Hues follow the inventory convention used by the filter
// chips and the products-list summary tiles: out of stock red, expired a
// deeper red, expiry risk amber, slow-moving amber, non-moving neutral slate.
interface ToneStyle {
  /** Row background + hairline. */
  row: string;
  /** Icon glyph colour (chip itself stays white). */
  icon: string;
  /** Headline colour. */
  title: string;
  /** Hint colour — same hue, dialled back. */
  hint: string;
}

const TONE: Record<Tone, ToneStyle> = {
  red: {
    row: "tw:bg-red-50 tw:ring-red-100",
    icon: "tw:text-red-600",
    title: "tw:text-red-600",
    hint: "tw:text-red-500/80",
  },
  deepRed: {
    row: "tw:bg-red-100/70 tw:ring-red-200",
    icon: "tw:text-red-700",
    title: "tw:text-red-700",
    hint: "tw:text-red-600/80",
  },
  amber: {
    row: "tw:bg-amber-50 tw:ring-amber-100",
    icon: "tw:text-amber-600",
    title: "tw:text-amber-600",
    hint: "tw:text-amber-700/80",
  },
  slate: {
    row: "tw:bg-slate-50 tw:ring-slate-200",
    icon: "tw:text-slate-500",
    title: "tw:text-slate-600",
    hint: "tw:text-slate-500",
  },
};

// The five stock-health data points, in the order they deserve attention.
const ALERTS: StockAlertDef[] = [
  {
    key: "expired",
    type: "status",
    value: "Expired",
    icon: CircleX,
    tone: "deepRed",
    title: (n) => `${n} ${n === 1 ? "item" : "items"} expired`,
    label: "Expired",
    hint: "Pull from shelf · write off",
  },
  {
    key: "out-of-stock",
    type: "status",
    value: "Out of Stock",
    icon: TriangleAlert,
    tone: "red",
    title: (n) => `${n} ${n === 1 ? "SKU" : "SKUs"} out of stock`,
    label: "Out of stock",
    hint: "Losing sales · reorder now",
  },
  {
    key: "near-expiry",
    type: "status",
    value: "Near Expiry",
    icon: Clock,
    tone: "amber",
    title: (n) => `${n} ${n === 1 ? "item" : "items"} near expiry`,
    label: "Near expiry",
    hint: "Push discount before they expire",
  },
  {
    key: "slow-moving",
    type: "movement",
    value: "Slow Moving",
    icon: TrendingDown,
    tone: "amber",
    title: (n) => `${n} ${n === 1 ? "item" : "items"} slowing down`,
    label: "Slowing down",
    hint: "Cash at risk · discount before it dies",
  },
  {
    key: "non-moving",
    type: "movement",
    value: "Non-Moving",
    icon: PauseCircle,
    tone: "slate",
    title: (n) => `${n} ${n === 1 ? "item" : "items"} not moving`,
    label: "Not moving",
    hint: "Cash stuck on shelf · discount it",
  },
];

type Counts = Record<string, number>;

const EMPTY_COUNTS: Counts = {
  "out-of-stock": 0,
  "slow-moving": 0,
  "non-moving": 0,
  "near-expiry": 0,
  expired: 0,
};

const num = (value: any) => Number(value) || 0;

/**
 * Fetch the five counts. Out-of-stock / slow-moving / non-moving / near-expiry
 * come from the inventory dashboard endpoints (same ones the analytics dashboard uses); there
 * is no dashboard endpoint for expired, so that one comes from the seller-deal
 * analytics summary — which also backs the products-list summary cards.
 */
const fetchCounts = async (signal?: AbortSignal): Promise<Counts> => {
  const [outOfStockRes, skuMovementRes, expiryRiskRes, analyticsRes] =
    await Promise.allSettled([
      InventoryDashboardService.getOutOfStockSkus({}, { signal }),
      InventoryDashboardService.getSkuMovement({}, { signal }),
      InventoryDashboardService.getInventoryRisk(
        "expiryRisk",
        { outputType: "count" },
        { signal },
      ),
      SellerCatalogService.getInventoryAnalytics({}),
    ]);

  const value = (res: PromiseSettledResult<any>) =>
    res.status === "fulfilled" ? res.value : undefined;

  const analytics = value(analyticsRes)?.data?.data || {};
  const skuMovement = value(skuMovementRes)?.data?.data || {};

  return {
    "out-of-stock": num(value(outOfStockRes)?.data?.data),
    "slow-moving": num(skuMovement?.slow?.count),
    "non-moving": num(skuMovement?.nonMoving?.count),
    "near-expiry": num(value(expiryRiskRes)?.data?.count),
    expired: num(analytics.expiredDeals),
  };
};

interface StockAlertsProps {
  /**
   * Fired on row tap with the filter field + value it maps to. When omitted the
   * row navigates to the products list with that filter applied.
   */
  onSelect?: (selection: StockAlertSelection) => void;
  /** Key of the alert currently applied as a filter, marked as active. */
  activeKey?: string;
  /** Section heading. Pass null to drop it. */
  title?: string | null;
  className?: string;
}

/**
 * "Do today" stock-health tasks — expired, out of stock, near expiry,
 * slow-moving and non-moving, each as an actionable row that applies its filter
 * to the product list. Fetches its own counts on mount, so it can be dropped
 * anywhere (side pane, dashboard) without the host wiring up the inventory
 * summary. Rows with a zero count are dropped; when everything is clear the
 * panel says so.
 */
const StockAlerts = ({
  onSelect,
  activeKey,
  title = "Do Today",
  className,
}: StockAlertsProps) => {
  const appNav = useAppNav();
  const [counts, setCounts] = useState<Counts>(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);

  // Adding stock clears out-of-stock rows, so re-count on the stock event.
  const stockToken = useInventoryStockUpdated();

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const load = async () => {
      setLoading(true);
      const data = await fetchCounts(controller.signal);
      if (!active) return;
      setCounts(data);
      setLoading(false);
    };
    load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [stockToken]);

  const handleSelect = (alert: StockAlertDef) => {
    const selection: StockAlertSelection = {
      key: alert.key,
      type: alert.type,
      value: alert.value,
    };
    if (onSelect) {
      onSelect(selection);
      return;
    }
    appNav.to("/dashboard/inventory/products/list", {
      [alert.type === "movement" ? "velocity" : "stockStatus"]: alert.value,
    });
  };

  const tasks = ALERTS.filter((alert) => counts[alert.key] > 0);

  const heading = title ? (
    <p
      className="tw:px-1 tw:text-[11px] tw:font-semibold tw:tracking-widest tw:text-slate-400 tw:uppercase"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {title}
      {!loading && tasks.length > 0
        ? ` · ${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`
        : ""}
    </p>
  ) : null;

  return (
    <div className={className}>
      {heading}

      <div className={clsx("tw:flex tw:flex-col tw:gap-2", title && "tw:mt-2")}>
        {loading ? (
          // Placeholder rows, matched to the real row height so the panel
          // doesn't jump once the counts land.
          [0, 1, 2].map((i) => (
            <div
              key={i}
              className="tw:flex tw:items-center tw:gap-3 tw:rounded-xl tw:bg-white tw:p-3 tw:ring-1 tw:ring-slate-100"
            >
              <span className="tw:size-9 tw:shrink-0 tw:animate-pulse tw:rounded-lg tw:bg-slate-100" />
              <span className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-1.5">
                <span className="tw:h-3 tw:w-2/3 tw:animate-pulse tw:rounded tw:bg-slate-100" />
                <span className="tw:h-2.5 tw:w-1/2 tw:animate-pulse tw:rounded tw:bg-slate-100" />
              </span>
            </div>
          ))
        ) : tasks.length === 0 ? (
          <div className="tw:rounded-xl tw:bg-white tw:p-3 tw:text-center tw:text-xs tw:text-slate-500 tw:ring-1 tw:ring-slate-100">
            Stock is healthy — nothing needs attention.
          </div>
        ) : (
          tasks.map((alert) => {
            const active = activeKey === alert.key;
            const tone = TONE[alert.tone];
            const Icon = alert.icon;
            return (
              <button
                key={alert.key}
                type="button"
                onClick={() => handleSelect(alert)}
                className={clsx(
                  "tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-3 tw:rounded-sm tw:p-2 tw:text-left tw:ring-1 tw:transition-shadow tw:hover:shadow-sm",
                  tone.row,
                  active && "tw:ring-2 tw:ring-primary/40",
                )}
              >
                <span
                  className={clsx(
                    "tw:flex tw:size-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-white",
                    tone.icon,
                  )}
                >
                  <Icon size={18} />
                </span>
                <span className="tw:min-w-0 tw:flex-1">
                  <span
                    className={clsx(
                      "tw:block tw:truncate tw:text-xs tw:font-medium",
                      tone.title,
                    )}
                  >
                    {alert.title(counts[alert.key])}
                  </span>
                  <span
                    className={clsx(
                      "tw:block tw:truncate tw:text-[10px] tw:text-slate-500",
                    )}
                  >
                    {alert.hint}
                  </span>
                </span>
                <ChevronRight
                  size={16}
                  className={clsx("tw:shrink-0 tw:opacity-40", tone.icon)}
                />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StockAlerts;
