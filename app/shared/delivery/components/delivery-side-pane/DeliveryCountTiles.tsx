import clsx from "clsx";
import { PackageCheck, Truck } from "lucide-react";
import type { DeliveryStageCounts } from "./helper";

/** The two stages a pane reader actually acts on, in the order work moves. */
const TILES = [
  {
    key: "dispatch" as const,
    label: "To Dispatch",
    hint: "waiting on a rider",
    icon: PackageCheck,
    tile: "tw:bg-blue-50 tw:hover:bg-blue-100",
    label_: "tw:text-blue-700",
    count: "tw:text-blue-600",
  },
  {
    key: "in-transit" as const,
    label: "In Transit",
    hint: "on the road",
    icon: Truck,
    tile: "tw:bg-teal-50 tw:hover:bg-teal-100",
    label_: "tw:text-teal-700",
    count: "tw:text-teal-600",
  },
];

interface DeliveryCountTilesProps {
  /** Counts keyed the same way as the delivery tabs; resolved by the pane. */
  counts?: DeliveryStageCounts;
  loading?: boolean;
  /** Stage key currently open in the main pane — reads as selected. */
  activeKey?: string;
  /** Fired with the stage key when a tile is tapped. */
  onSelect?: (key: string) => void;
  className?: string;
}

/**
 * The delivery workload at a glance: how many orders are still waiting to be
 * dispatched, and how many are already out on the road. Both numbers come from
 * the same counts the delivery pages filter on, so a tile and the list it opens
 * can never disagree. Tapping a tile switches to that view.
 */
const DeliveryCountTiles = ({
  counts,
  loading = false,
  activeKey,
  onSelect,
  className,
}: DeliveryCountTilesProps) => {
  if (loading) {
    return (
      <div className={clsx("tw:grid tw:grid-cols-2 tw:gap-2", className)}>
        {TILES.map((tile) => (
          <div
            key={`delivery-count-skeleton-${tile.key}`}
            className="skeleton-loader tw:h-24 tw:rounded-xl"
          />
        ))}
      </div>
    );
  }

  return (
    <div className={clsx("tw:grid tw:grid-cols-2 tw:gap-2", className)}>
      {TILES.map((tile) => {
        const Icon = tile.icon;
        const active = tile.key === activeKey;
        return (
          <button
            key={tile.key}
            type="button"
            onClick={() => onSelect?.(tile.key)}
            aria-current={active ? "true" : undefined}
            className={clsx(
              "tw:flex tw:cursor-pointer tw:flex-col tw:gap-1 tw:rounded-xl tw:px-3 tw:py-2.5 tw:text-left tw:transition-colors",
              tile.tile,
              active && "tw:ring-2 tw:ring-slate-900/15",
            )}
          >
            <Icon size={16} className={clsx("tw:shrink-0", tile.count)} />
            <span
              className={clsx(
                "app-amount tw:text-2xl tw:font-bold tw:leading-none tw:tabular-nums",
                tile.count,
              )}
            >
              {counts?.[tile.key] || 0}
            </span>
            <span
              className={clsx(
                "tw:truncate tw:text-xs tw:font-bold tw:tracking-wide",
                tile.label_,
              )}
            >
              {tile.label}
            </span>
            <span className="tw:truncate tw:text-[11px] tw:text-slate-500">
              {tile.hint}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default DeliveryCountTiles;
