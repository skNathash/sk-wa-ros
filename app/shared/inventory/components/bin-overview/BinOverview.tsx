import clsx from "clsx";
import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AuthService from "~/services/AuthService";
import RackBinService from "~/services/RackBinService";

/** The bin-level numbers `/metrics` reports, normalized. */
interface BinMetrics {
  percentageFilled: number;
  usedLimit: number;
  binLimit: number;
  totalStockUnits: number;
  nonSellableUnits: number;
  totalValue: number;
  itemsNeedingAttention: number;
}

const EMPTY_METRICS: BinMetrics = {
  percentageFilled: 0,
  usedLimit: 0,
  binLimit: 0,
  totalStockUnits: 0,
  nonSellableUnits: 0,
  totalValue: 0,
  itemsNeedingAttention: 0,
};

const num = (value: any) =>
  Number.isFinite(Number(value)) ? Number(value) : 0;

/** The dot-separated eyebrow above the headline. Empty parts are dropped. */
const Eyebrow = ({ parts }: { parts: string[] }) => (
  <p className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-[0.18em] tw:text-white/60">
    {parts.filter(Boolean).join(" · ")}
  </p>
);

interface PillProps {
  children: React.ReactNode;
  /** Solid green treatment — reserved for the one "headline" pill. */
  isAccent?: boolean;
  /** Amber treatment — something in the bin needs a look. */
  isWarn?: boolean;
}

const Pill = ({ children, isAccent, isWarn }: PillProps) => (
  <span
    className={clsx(
      "tw:inline-flex tw:items-center tw:gap-1 tw:rounded-md tw:px-2 tw:py-1 tw:text-[11px] tw:font-bold tw:leading-none tw:whitespace-nowrap",
      isAccent
        ? "tw:bg-[#25D366] tw:text-[#0b3d2c]"
        : isWarn
          ? "tw:bg-amber-400/90 tw:text-amber-950"
          : "tw:bg-black/25 tw:text-white",
    )}
  >
    {children}
  </span>
);

interface BinOverviewProps {
  binId: string;
  /** The bin-details payload (`rackName`, `binCode`, `items`, …). */
  bin: any;
  /** Bumped by the host after a mutation to re-pull the metrics. */
  refresh?: number;
  className?: string;
}

/**
 * Bin summary header: an oversized bin-code tile carrying the fill percentage,
 * next to the bin's location eyebrow, an items/units headline, and a row of
 * pills for the numbers that need a reaction (empty rows, value held, capacity).
 */
const BinOverview = ({ binId, bin, refresh, className }: BinOverviewProps) => {
  const [metrics, setMetrics] = useState<BinMetrics | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setMetrics(null);
      const response = await RackBinService.getBinMetrics(
        AuthService.getLoggedInUserId() || "",
        binId,
      );
      if (!active) return;
      const d = response?.data?.data || {};
      const m = d.metrics || {};
      setMetrics({
        percentageFilled: num(d.percentageFilled),
        usedLimit: num(d.usedLimit),
        binLimit: num(d.binLimit),
        totalStockUnits: num(m.totalStockUnits),
        nonSellableUnits: num(m.nonSellableUnits),
        totalValue: num(m.totalValue),
        itemsNeedingAttention: num(m.itemsNeedingAttention),
      });
    };
    if (binId) load();
    return () => {
      active = false;
    };
  }, [binId, refresh]);

  const items: any[] = Array.isArray(bin?.items) ? bin.items : [];
  const isSellable = bin?.isSellable !== false && bin?.locationId !== "L2";
  const loading = !metrics;
  const m = metrics || EMPTY_METRICS;
  const pct = Math.round(m.percentageFilled);
  const units = isSellable ? m.totalStockUnits : m.nonSellableUnits;
  // Rows sitting in the bin with nothing left on the shelf — the "1 OUT" slot.
  const outOfStock = items.filter((item) => !num(item?.totalQty)).length;
  const binCode = bin?.binCode || bin?.binName || "—";
  // The tile reads as a shelf address — rack + bin, e.g. "A-2". Falls back to
  // the bare bin code when the bin isn't on a named rack.
  const binAddress = bin?.rackName ? `${bin.rackName}-${binCode}` : binCode;

  return (
    <div
      className={clsx(
        "tw:overflow-hidden tw:bg-gradient-to-br tw:from-[#6B2C91] tw:to-[#3B1A52] tw:px-4 tw:py-4 tw:text-white tw:shadow-lg",
        /* Full-bleed at every breakpoint — the band runs edge to edge,
           cancelling the page's 1rem side gutters. On desktop the content
           column additionally sits a `.section-layout--tight` gap away from
           the fixed rail/list pane; `.bin-overview-flush` pulls that last bit
           (see theme-2.css). */
        "tw:-mx-4 tw:rounded-none",
        className,
      )}
    >
      <div className="tw:flex tw:items-center tw:gap-4">
        {/* Bin code tile — code over the fill percentage. */}
        <div className="tw:flex tw:size-20 tw:shrink-0 tw:flex-col tw:items-center tw:justify-center tw:rounded-2xl tw:bg-white/15 tw:ring-1 tw:ring-white/20">
          <span className="tw:max-w-full tw:truncate tw:px-1 tw:text-2xl tw:font-extrabold tw:leading-none tw:tracking-tight">
            {binAddress}
          </span>
          {loading ? (
            <span className="tw:mt-2 tw:h-2.5 tw:w-8 tw:animate-pulse tw:rounded tw:bg-white/30" />
          ) : (
            <span className="tw:mt-1.5 tw:text-xs tw:font-semibold tw:text-white/70">
              {pct}%
            </span>
          )}
        </div>

        <div className="tw:min-w-0 tw:flex-1">
          <Eyebrow
            parts={[
              bin?.rackName ? `Rack ${bin.rackName}` : "",
              `Bin ${binCode}`,
              isSellable ? "Sellable" : "Non-Sellable",
            ]}
          />

          {loading ? (
            <>
              <span className="tw:mt-2 tw:block tw:h-6 tw:w-48 tw:max-w-full tw:animate-pulse tw:rounded tw:bg-white/20" />
              <span className="tw:mt-2 tw:block tw:h-6 tw:w-56 tw:max-w-full tw:animate-pulse tw:rounded tw:bg-white/15" />
            </>
          ) : (
            <>
              <p className="tw:mt-1 tw:truncate tw:text-xl tw:font-extrabold tw:leading-tight">
                {items.length} items
                <span className="tw:px-1.5 tw:text-white/50">·</span>
                {units} units
              </p>

              <div className="tw:mt-2 tw:flex tw:flex-wrap tw:items-center tw:gap-1.5">
                {outOfStock > 0 ? (
                  <Pill isWarn>{outOfStock} OUT</Pill>
                ) : null}
                {m.itemsNeedingAttention > 0 ? (
                  <Pill isWarn>{m.itemsNeedingAttention} to check</Pill>
                ) : null}
                <Pill>
                  <Amount value={m.totalValue} decimalPlaces={0} /> value
                </Pill>
                {m.binLimit > 0 ? (
                  <Pill isAccent={pct < 90}>
                    {m.usedLimit}/{m.binLimit} used
                  </Pill>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BinOverview;
