import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import {
  EMPTY_INVENTORY_STATS,
  getInventoryStats,
  HARDCODED,
  type InventoryStats as InventoryStatsData,
} from "./helper";

/** The four tiles, so a host can act on the one that was tapped. */
export type InventoryStatKey =
  | "total-skus"
  | "stock-value"
  | "pre-owned"
  | "slow-movers";

/** Diagonal stripes marking the pre-owned tile as a separate stock pool.
const STRIPES = {
  backgroundImage:
    "repeating-linear-gradient(135deg, rgba(234,88,12,0.07) 0 10px, rgba(234,88,12,0.02) 10px 20px)",
};
*/

const StatLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p
    className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-400"
    style={{ fontFamily: "var(--font-mono)" }}
  >
    {children}
  </p>
);

/** Shared tile shell — clickable only when the host handles a selection. */
const StatCard: React.FC<{
  statKey: InventoryStatKey;
  onSelect?: (key: InventoryStatKey) => void;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ statKey, onSelect, className, style, children }) => (
  <div
    role={onSelect ? "button" : undefined}
    tabIndex={onSelect ? 0 : undefined}
    onClick={onSelect ? () => onSelect(statKey) : undefined}
    onKeyDown={
      onSelect
        ? (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect(statKey);
            }
          }
        : undefined
    }
    className={clsx(
      "tw:relative tw:overflow-hidden tw:rounded-xl tw:bg-white tw:px-4 tw:py-3.5 tw:text-left tw:ring-1 tw:ring-slate-100",
      onSelect && "tw:cursor-pointer tw:transition-colors tw:hover:bg-slate-50",
      className,
    )}
    style={style}
  >
    {children}
  </div>
);

const StatSkeleton = () => (
  <>
    <span className="tw:mt-2 tw:block tw:h-7 tw:w-24 tw:animate-pulse tw:rounded tw:bg-slate-100" />
    <span className="tw:mt-2 tw:block tw:h-3 tw:w-4/5 tw:animate-pulse tw:rounded tw:bg-slate-100" />
  </>
);

interface InventoryStatsProps {
  /** Extra seller-deal filter params applied to every number. */
  params?: Record<string, any>;
  /** Fired when a tile is tapped. Tiles are static when omitted. */
  onSelect?: (key: InventoryStatKey) => void;
  className?: string;
}

/**
 * Headline inventory strip — total SKUs, new stock value, the pre-owned pool
 * and the value tied up in slow movers.
 *
 * Total SKUs, stock value, the category count and the slow-mover numbers come
 * from the inventory dashboard endpoints (see `helper.ts`). The pre-owned tile
 * and the stock-value sub-line have no endpoint yet and read from
 * {@link HARDCODED}.
 */
const InventoryStats: React.FC<InventoryStatsProps> = ({
  params,
  onSelect,
  className,
}) => {
  const [stats, setStats] = useState<InventoryStatsData>(EMPTY_INVENTORY_STATS);
  const [loading, setLoading] = useState(true);

  // Callers rebuild `params` on every render, so the effect keys off its
  // serialised form instead of the object reference.
  const paramsKey = JSON.stringify(params || {});
  const paramsRef = useRef(params);
  paramsRef.current = params;

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setLoading(true);
    getInventoryStats(paramsRef.current || {}, controller.signal).then(
      (result) => {
        console.log(result);
        if (!active) return;
        setStats(result);
        setLoading(false);
      },
    );

    return () => {
      active = false;
      controller.abort();
    };
  }, [paramsKey]);

  // const { preOwned } = HARDCODED;

  return (
    <div
      className={clsx(
        "tw:grid tw:grid-cols-2 tw:gap-3 tw:sm:grid-cols-2 tw:xl:grid-cols-3",
        className,
      )}
    >
      {/* Total SKUs — count plus the spread across categories. */}
      <StatCard statKey="total-skus" onSelect={onSelect}>
        <StatLabel>Total SKUs</StatLabel>
        {loading ? (
          <StatSkeleton />
        ) : (
          <>
            <p className="tw:mt-1.5 tw:text-2xl tw:font-bold tw:text-slate-900">
              {stats.totalSKUs}
            </p>
            <p className="tw:mt-1 tw:text-xs tw:text-slate-500">
              across {stats.categoryCount}{" "}
              {stats.categoryCount === 1 ? "category" : "categories"} ·{" "}
              {HARDCODED.electronicsSKUs} electronics
            </p>
          </>
        )}
      </StatCard>

      {/* Stock value of the new inventory. */}
      <StatCard statKey="stock-value" onSelect={onSelect}>
        <StatLabel>Stock Value · New</StatLabel>
        {loading ? (
          <StatSkeleton />
        ) : (
          <>
            <p className="tw:mt-1.5 tw:text-2xl tw:font-bold tw:text-emerald-600">
              <Amount value={stats.stockValue} decimalPlaces={0} />
            </p>
            <p className="tw:mt-1 tw:text-xs tw:text-slate-500">
              {HARDCODED.stockValueHint}
            </p>
          </>
        )}
      </StatCard>

      {/* Pre-owned pool — hidden until the numbers come from an endpoint.
      <StatCard
        statKey="pre-owned"
        onSelect={onSelect}
        className="tw:border tw:border-dashed tw:border-orange-300 tw:ring-0"
        style={STRIPES}
      >
        <span className="tw:pointer-events-none tw:absolute tw:-top-6 tw:right-2 tw:size-16 tw:rounded-full tw:bg-orange-100/50" />
        <p className="tw:relative tw:flex tw:items-center tw:gap-2">
          <span
            className="tw:rounded tw:bg-orange-600 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-widest tw:text-white"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Pre-owned
          </span>
          <span className="tw:text-sm tw:text-slate-600">inventory</span>
        </p>
        <p className="tw:relative tw:mt-1.5 tw:text-2xl tw:font-bold tw:text-orange-700">
          <Amount value={preOwned.value} decimalPlaces={0} />
        </p>
        <p className="tw:relative tw:mt-1 tw:text-xs tw:text-slate-600">
          {preOwned.units} {preOwned.units === 1 ? "unit" : "units"} · avg{" "}
          <span className="tw:font-semibold">{preOwned.marginPct}%</span> margin
          · {preOwned.inQc} in QC
        </p>
      </StatCard>
      */}

      {/* Value parked in stock that stopped moving. */}
      <StatCard statKey="slow-movers" onSelect={onSelect}>
        <StatLabel>Tied in Slow Movers</StatLabel>
        {loading ? (
          <StatSkeleton />
        ) : (
          <>
            <p className="tw:mt-1.5 tw:text-2xl tw:font-bold tw:text-amber-500">
              <Amount value={stats.slowMovingValue} decimalPlaces={0} />
            </p>
            <p className="tw:mt-1 tw:text-xs tw:text-slate-500">
              {stats.slowMovingSKUs}{" "}
              {stats.slowMovingSKUs === 1 ? "item" : "items"} ·{" "}
              {Math.round(stats.slowMovingPercentage)}% of stock
            </p>
          </>
        )}
      </StatCard>
    </div>
  );
};

export default InventoryStats;
