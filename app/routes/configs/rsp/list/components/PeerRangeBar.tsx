import clsx from "clsx";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import type { PeerRange } from "../helper";

export interface PeerRangeBarProps {
  peer?: PeerRange;
  className?: string;
}

// Selling above the network average is the one state worth flagging, so it is
// the only warm colour; at or below reads as safe.
const DIRECTION_TEXT: Record<PeerRange["direction"], string> = {
  above: "tw:text-amber-600",
  below: "tw:text-emerald-600",
  same: "tw:text-slate-500",
};

/**
 * The spread of the three prices on screen — own selling price, the network
 * average and MRP — laid out on one band that runs lowest to highest, with the
 * gap between own price and the average filled in so the direction reads at a
 * glance. Markers are offset by half their own width (rather than translated)
 * so neither end marker spills outside the band.
 */
const PeerRangeBar: React.FC<PeerRangeBarProps> = ({ peer, className }) => {
  if (!peer?.hasRange) {
    return <span className="tw:text-gray-300">—</span>;
  }

  const hasAvg = peer.avg > 0;
  const fillStart = Math.min(peer.pricePos, peer.avgPos);
  const fillWidth = Math.abs(peer.avgPos - peer.pricePos);

  return (
    <div className={clsx("tw:mx-auto tw:w-40", className)} title={peer.title}>
      <div className="tw:relative tw:h-3">
        {/* Band — lowest price → highest price. */}
        <div className="tw:absolute tw:inset-x-0 tw:top-1/2 tw:h-1 tw:-translate-y-1/2 tw:rounded-full tw:bg-slate-200" />

        {/* Filled portion — the gap between own price and the network average. */}
        {hasAvg && (
          <div
            style={{ left: `${fillStart}%`, width: `${fillWidth}%` }}
            className={clsx(
              "tw:absolute tw:top-1/2 tw:h-1 tw:-translate-y-1/2 tw:rounded-full",
              peer.direction === "above"
                ? "tw:bg-amber-300"
                : "tw:bg-emerald-300",
            )}
          />
        )}

        {/* End cap — the top of the band. */}
        <span className="tw:absolute tw:right-0 tw:top-0 tw:h-3 tw:w-px tw:bg-slate-400" />

        {/* Network average. */}
        {hasAvg && (
          <span
            style={{ left: `calc(${peer.avgPos}% - 3px)` }}
            className="tw:absolute tw:top-1/2 tw:h-1.5 tw:w-1.5 tw:-translate-y-1/2 tw:rounded-full tw:bg-slate-500"
          />
        )}

        {/* This seller. */}
        <span
          style={{ left: `calc(${peer.pricePos}% - 6px)` }}
          className={clsx(
            "tw:absolute tw:top-1/2 tw:h-3 tw:w-3 tw:-translate-y-1/2 tw:rounded-full tw:border-2 tw:border-white",
            peer.direction === "above"
              ? "tw:bg-amber-500 tw:ring-2 tw:ring-amber-200"
              : "tw:bg-emerald-600 tw:ring-2 tw:ring-emerald-200",
          )}
        />
      </div>

      <div className="tw:mt-1 tw:flex tw:items-center tw:justify-between tw:gap-1 tw:text-[10px] tw:whitespace-nowrap">
        <Amount
          value={peer.min}
          decimalPlaces={0}
          className="tw:tabular-nums tw:text-slate-400"
        />
        {!!peer.label && (
          <span
            className={clsx("tw:font-semibold", DIRECTION_TEXT[peer.direction])}
          >
            {peer.label}
          </span>
        )}
        <Amount
          value={peer.max}
          decimalPlaces={0}
          className="tw:tabular-nums tw:text-slate-400"
        />
      </div>
    </div>
  );
};

export default PeerRangeBar;
