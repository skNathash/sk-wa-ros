import React, { useMemo } from "react";
import { Check, Sparkles } from "lucide-react";

import useTheme from "~/hooks/useTheme";

/** One resolve source (the StoreKing library or StoreKing AI) as it stands now. */
export interface ScanResolveSource {
  /** Results this source contributed. */
  count: number;
  /** Still working — the track sweeps and the tally reads "Searching…". */
  live?: boolean;
  /** Whether the source ran at all; when false the tally reads "Not needed". */
  ran?: boolean;
}

export interface ScanResolveSummaryProps {
  /** Small caps line above the title, e.g. "Step 2 · Resolve". */
  eyebrow: string;
  /** Plain-language statement of where the resolve currently stands. */
  title: string;
  sk: ScanResolveSource;
  ai: ScanResolveSource;
  /** Already in the seller's own catalog — subscribing again is a no-op. */
  yours: number;
  /** Barcodes that matched nowhere. Omit when the caller has no such bucket. */
  notFound?: number;
  className?: string;
}

/** Both source rows resolve to this shape before rendering. */
interface SourceRow {
  key: "sk" | "ai";
  name: string;
  meta: string;
  /** Left glyph — a tick once the source has reported, else the AI spark. */
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  countClass: string;
  barClass: string;
  /** "6 / 14" style tally shown on the right of the row. */
  tally: string;
  /** Filled share of the track, 0–100. */
  pct: number;
  /** Source is still working — the track runs its sweep animation. */
  live: boolean;
}

interface Tile {
  key: string;
  label: string;
  value: number;
  valueClass: string;
}

/**
 * Resolve panel for a barcode scan — the dark counterpart to the light scan
 * card it sits under. It states which source answered (the StoreKing library or
 * StoreKing AI), how far each has got, and breaks the results into the buckets
 * that decide what the seller does next.
 *
 * Deliberately count-driven rather than tied to one page's data shape: the
 * single-scan page derives its counts from the live scan phase and the bulk
 * review derives them from the batch's match statuses, and both render this.
 *
 * theme-2 only — the other themes keep their own plain summaries.
 */
const ScanResolveSummary: React.FC<ScanResolveSummaryProps> = ({
  eyebrow,
  title,
  sk,
  ai,
  yours,
  notFound,
  className,
}) => {
  const isTheme2 = useTheme() === "theme-2";

  const view = useMemo(() => {
    const skCount = sk.count;
    const aiCount = ai.count;
    const notFoundCount = notFound || 0;
    const total = skCount + aiCount + notFoundCount;

    const skLive = !!sk.live;
    const aiLive = !!ai.live;
    // A source that never ran reads as "not needed" rather than "found nothing".
    const skRan = sk.ran !== false;
    const aiRan = ai.ran !== false;

    // Shares of the combined result set. While a source is still working its
    // track shows a token sliver so the row doesn't read as finished-and-empty.
    const share = (value: number, live: boolean) => {
      if (live) return 12;
      if (!total) return 0;
      return Math.round((value / total) * 100);
    };

    const tally = (value: number, live: boolean, ran: boolean) => {
      if (live) return "Searching…";
      if (!ran) return "Not needed";
      return `${value} / ${total || 0}`;
    };

    const rows: SourceRow[] = [
      {
        key: "sk",
        name: "Ready to Subscribe",
        meta: "Exact or similar matches from the StoreKing library",
        icon: Check,
        iconClass: "tw:text-emerald-400",
        countClass: "tw:text-emerald-400",
        barClass: "tw:bg-emerald-500",
        tally: tally(skCount, skLive, skRan),
        pct: share(skCount, skLive),
        live: skLive,
      },
      {
        key: "ai",
        name: "Approval Needed",
        meta: "AI-suggested details that need your approval",
        icon: Sparkles,
        iconClass: "tw:text-violet-400",
        countClass: "tw:text-violet-400",
        barClass: "tw:bg-violet-500",
        tally: tally(aiCount, aiLive, aiRan),
        pct: share(aiCount, aiLive),
        live: aiLive,
      },
    ];

    const tiles: Tile[] = [
      {
        key: "total",
        label: "Total",
        value: total,
        valueClass: "tw:text-white",
      },
      {
        // Everything the library returned — exact hits and near matches alike,
        // so the tiles add up to the total.
        key: "skMatch",
        label: "SK Match",
        value: skCount,
        valueClass: "tw:text-emerald-400",
      },
      {
        key: "skAi",
        label: "SK AI",
        value: aiCount,
        valueClass: "tw:text-violet-400",
      },
    ];

    if (notFound !== undefined) {
      tiles.push({
        key: "notFound",
        label: "Not found",
        value: notFoundCount,
        valueClass: "tw:text-amber-400",
      });
    }

    tiles.push({
      key: "yours",
      label: "Yours",
      value: yours,
      valueClass: "tw:text-slate-300",
    });

    return {
      rows,
      tiles,
      // Tailwind needs the column count as a literal class, so pick between the
      // only two layouts this panel ever renders.
      tileGrid: tiles.length === 5 ? "tw:grid-cols-5" : "tw:grid-cols-4",
      live: skLive || aiLive,
    };
  }, [sk, ai, yours, notFound]);

  if (!isTheme2) return null;

  return (
    <section
      className={`tw:rounded-2xl tw:bg-linear-to-br tw:from-slate-900 tw:to-indigo-950 tw:px-4 tw:py-3.5  ${
        className || ""
      }`}
    >
      <div className="tw:flex tw:items-start tw:justify-between tw:gap-3">
        <div className="tw:min-w-0">
          <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-[0.12em] tw:text-slate-400">
            {eyebrow}
          </div>
          <h3 className="tw:mt-1 tw:text-sm tw:font-bold tw:text-white tw:wrap-break-word">
            {title}
          </h3>
        </div>
        {view.live && (
          <span className="tw:shrink-0 tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-full tw:bg-white/10 tw:px-2 tw:py-1">
            <span className="tw:relative tw:flex tw:h-2 tw:w-2">
              <span className="tw:absolute tw:inline-flex tw:h-full tw:w-full tw:rounded-full tw:bg-emerald-400 tw:opacity-75 tw:animate-ping" />
              <span className="tw:relative tw:inline-flex tw:h-2 tw:w-2 tw:rounded-full tw:bg-emerald-400" />
            </span>
            <span className="tw:text-[10px] tw:font-semibold tw:text-white">
              Live
            </span>
          </span>
        )}
      </div>

      {/* One row per source — name, what it covers, its tally and its track. */}
      <div className="tw:mt-3 tw:flex tw:flex-col tw:gap-3">
        {view.rows.map((row) => {
          const Icon = row.icon;
          return (
            <div key={row.key}>
              <div className="tw:flex tw:items-center tw:gap-2">
                <Icon
                  className={`tw:w-3.5 tw:h-3.5 tw:shrink-0 ${row.iconClass}`}
                />
                <span className="tw:text-xs tw:font-bold tw:text-white tw:shrink-0">
                  {row.name}
                </span>
                <span className="tw:text-[11px] tw:text-slate-400 tw:truncate">
                  · {row.meta}
                </span>
                <span
                  className={`tw:ml-auto tw:shrink-0 tw:text-xs tw:font-bold tw:tabular-nums ${row.countClass}`}
                >
                  {row.tally}
                </span>
              </div>
              <div className="tw:relative tw:mt-1.5 tw:h-1.5 tw:w-full tw:overflow-hidden tw:rounded-full tw:bg-white/10">
                <div
                  className={`tw:absolute tw:inset-y-0 tw:left-0 tw:overflow-hidden tw:rounded-full tw:transition-all tw:duration-500 tw:ease-out ${row.barClass}`}
                  style={{ width: `${row.pct}%` }}
                >
                  {row.live && (
                    <div className="ai-progress-sweep tw:absolute tw:inset-y-0 tw:left-0 tw:w-1/2 tw:bg-linear-to-r tw:from-transparent tw:via-white/70 tw:to-transparent" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Outcome buckets — what the seller can act on, at a glance. */}
      <div
        className={`tw:mt-3.5 tw:grid ${view.tileGrid} tw:gap-2 tw:border-t tw:border-white/10 tw:pt-3`}
      >
        {view.tiles.map((tile) => (
          <div key={tile.key} className="tw:text-center">
            <div
              className={`tw:text-xl tw:font-bold tw:leading-none tw:tabular-nums ${
                tile.value ? tile.valueClass : "tw:text-slate-600"
              }`}
            >
              {tile.value}
            </div>
            <div className="tw:mt-1 tw:text-[9px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-slate-400">
              {tile.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ScanResolveSummary;
