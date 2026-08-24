import clsx from "clsx";
import { useState } from "react";
import { buildPriceGroups, getMaxValue } from "./helper";
import type { PeerPrice, PriceChannel, PriceEditType } from "./helper";
import PriceRow from "./PriceRow";

export interface PeerPriceComparisonProps {
  data: PeerPrice;
  /** Retailers the network average was computed from, shown in the heading. */
  retailerCount?: number;
  /** Opens the price config for the row the user clicked. */
  onEdit?: (type: PriceEditType) => void;
  className?: string;
}

const CHANNELS: { key: PriceChannel; label: string }[] = [
  { key: "b2c", label: "B2C" },
  { key: "b2b", label: "B2B" },
];

/**
 * Seller price comparison — where this deal's own prices sit against the
 * network average for the same deal, one bar per price scaled to the largest
 * figure on screen so the gaps read at a glance. One selling channel is shown
 * at a time (B2C / B2B) so the two comparisons aren't read against each other
 * by accident; MRP and the seller's own cost anchor both. The "you" rows open
 * the matching price config.
 */
const PeerPriceComparison = ({
  data,
  retailerCount,
  onEdit,
  className,
}: PeerPriceComparisonProps) => {
  const [channel, setChannel] = useState<PriceChannel>("b2c");

  if (!data) return null;

  const groups = buildPriceGroups(data, channel);
  const max = getMaxValue(groups);

  return (
    <section
      className={clsx(
        "tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:px-4 tw:py-3",
        className,
      )}
    >
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
        <div className="tw:text-[11px] tw:font-bold tw:uppercase tw:tracking-wide tw:text-slate-500">
          Seller price comparison
          {!!retailerCount && (
            <span className="tw:text-slate-400">
              {" "}
              · {retailerCount} retailers
            </span>
          )}
        </div>

        {/* Channel toggle — B2C and B2B are separate comparisons, so only one
            is on screen at a time. */}
        <div
          role="tablist"
          aria-label="Price channel"
          className="tw:inline-flex tw:shrink-0 tw:rounded-lg tw:bg-slate-100 tw:p-0.5"
        >
          {CHANNELS.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={channel === item.key}
              onClick={() => setChannel(item.key)}
              className={clsx(
                "tw:cursor-pointer tw:rounded-md tw:px-2.5 tw:py-1 tw:text-[11px] tw:font-bold tw:uppercase tw:tracking-wide tw:transition-colors",
                channel === item.key
                  ? "tw:bg-white tw:text-slate-800 tw:shadow-sm"
                  : "tw:text-slate-500 tw:hover:text-slate-700",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="tw:mt-2 tw:divide-y tw:divide-slate-100">
        {groups.map((group) => (
          <div key={group.key} className="tw:py-2">
            <div className="tw:mb-0.5 tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
              {group.title}
            </div>
            {group.rows.map((row) => (
              <PriceRow key={row.key} row={row} max={max} onEdit={onEdit} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
};

export default PeerPriceComparison;
