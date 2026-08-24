import React from "react";
import Amount from "~/components/core/amount/Amount";
import type { InventorySummary } from "../../helper";

/**
 * Theme-2 hero card for the inventory dashboard — the deep-navy insight
 * banner from the Analytics design: mono eyebrow, serif headline leading with
 * the fast-mover share, a movement-distribution bar strip and a row of mini
 * stat tiles (shelf value / out of stock / overstocked / turnover).
 *
 * All figures come from the existing summary + risk APIs; the bar strip is a
 * visual rendering of the fast / slow / non-moving split (bars per bucket are
 * proportional to its SKU count).
 */

/** Bars in the distribution strip; each is assigned to a movement bucket. */
const BAR_COUNT = 44;

const barSegments = (fast: number, slow: number, nonMoving: number) => {
  const total = fast + slow + nonMoving;
  if (total <= 0) return [];
  const fastBars = Math.round((fast / total) * BAR_COUNT);
  const slowBars = Math.round((slow / total) * BAR_COUNT);
  return Array.from({ length: BAR_COUNT }, (_, i) => {
    // Pareto-style height decay across the strip.
    const height = 6 + 26 * Math.pow(1 - i / (BAR_COUNT - 1), 1.5);
    const bucket = i < fastBars ? "fast" : i < fastBars + slowBars ? "slow" : "non";
    return { height, bucket };
  });
};

const BUCKET_OPACITY: Record<string, string> = {
  fast: "tw:bg-white",
  slow: "tw:bg-white/50",
  non: "tw:bg-white/25",
};

const Tile: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div className="tw:rounded-lg tw:bg-white/10 tw:px-3 tw:py-2">
    <div className="tw:font-mono tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-blue-200">
      {label}
    </div>
    <div className="tw:mt-0.5 tw:text-lg tw:font-bold tw:leading-none app-amount">
      {value}
    </div>
  </div>
);

const InsightHero: React.FC<{
  data: InventorySummary;
  overstocked: number;
  riskLoading: boolean;
  className?: string;
}> = ({ data, overstocked, riskLoading, className = "" }) => {
  const bars = barSegments(
    data.fastMovingSKUs,
    data.slowMovingSKUs,
    data.nonMovingSKUs,
  );
  const slowAndNon = data.slowMovingSKUs + data.nonMovingSKUs;

  return (
    <div
      className={`tw:relative tw:overflow-hidden tw:rounded-2xl tw:bg-gradient-to-br tw:from-blue-950 tw:via-indigo-950 tw:to-slate-950 tw:p-4 tw:text-blue-50 ${className}`}
    >
      {/* Decorative glow, top-right (mirrors the design's radial highlight). */}
      <div
        aria-hidden
        className="tw:pointer-events-none tw:absolute tw:-right-10 tw:-top-16 tw:h-44 tw:w-44 tw:rounded-full tw:bg-blue-600/25"
      />

      {data.loading ? (
        <div className="tw:relative tw:animate-pulse tw:space-y-3 tw:py-2">
          <div className="tw:h-3 tw:w-40 tw:rounded tw:bg-white/20" />
          <div className="tw:h-8 tw:w-3/4 tw:rounded tw:bg-white/20" />
          <div className="tw:h-3 tw:w-1/2 tw:rounded tw:bg-white/10" />
          <div className="tw:h-10 tw:w-full tw:rounded tw:bg-white/10" />
        </div>
      ) : (
        <>
          <div className="tw:relative tw:font-mono tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-blue-200">
            Last 30 days · {data.totalSKUs} SKUs
          </div>

          <h2 className="tw:relative tw:mt-2 tw:text-2xl tw:leading-snug app-heading-serif">
            {data.fastMovingSKUs} fast movers ={" "}
            <em>{data.fastMovingPercentage}% of your shelf</em>
          </h2>
          <p className="tw:relative tw:mt-1.5 tw:text-xs tw:text-blue-200">
            The other {slowAndNon} items move slowly · {data.nonMovingSKUs}{" "}
            haven&apos;t sold in a month.
          </p>

          {bars.length > 0 && (
            <div className="tw:relative tw:mt-4">
              <div className="tw:flex tw:items-end tw:gap-[3px]">
                {bars.map((bar, i) => (
                  <div
                    key={i}
                    className={`tw:flex-1 tw:rounded-t-[2px] ${BUCKET_OPACITY[bar.bucket]}`}
                    style={{ height: `${bar.height}px` }}
                  />
                ))}
              </div>
              <div className="tw:mt-1.5 tw:flex tw:justify-between tw:font-mono tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-blue-300">
                <span>Fast</span>
                <span>Slow</span>
                <span>Non-moving</span>
              </div>
            </div>
          )}

          <div className="tw:relative tw:mt-4 tw:grid tw:grid-cols-2 tw:gap-2 tw:sm:grid-cols-4">
            <Tile
              label="Shelf value"
              value={<Amount value={data.inventoryValue} decimalPlaces={0} />}
            />
            <Tile label="Out of stock" value={data.outOfStockSKUs} />
            <Tile label="Overstocked" value={riskLoading ? "—" : overstocked} />
            <Tile label="Turnover" value={`${data.inventoryTurnoverPct}%`} />
          </div>
        </>
      )}
    </div>
  );
};

export default InsightHero;
