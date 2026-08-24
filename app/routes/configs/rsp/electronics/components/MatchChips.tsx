import clsx from "clsx";
import React from "react";
import type { ElectronicsChip } from "../helper";

/**
 * Quick chips under the filter block, splitting the sheet by how the CLUB
 * price sits against online: all, losing (priced above the cheapest listing)
 * and winning. The API filters on this (`type=aboveOnlinePrice` /
 * `belowOnlinePrice`), so a chip narrows the whole result set, not just the
 * rows already loaded — the counts are catalogue totals for the same reason.
 */
const MatchChips: React.FC<{
  active: ElectronicsChip;
  counts: { all: number; above: number; winning: number };
  onSelect: (chip: ElectronicsChip) => void;
  className?: string;
}> = ({ active, counts, onSelect, className = "" }) => {
  const chips: {
    key: ElectronicsChip;
    label: string;
    count: number;
    activeClass: string;
    idleClass: string;
  }[] = [
    {
      key: "all",
      label: "All",
      count: counts.all,
      activeClass: "tw:bg-gray-900 tw:text-white",
      idleClass: "tw:border tw:border-gray-300 tw:bg-white tw:text-gray-700",
    },
    {
      key: "above",
      label: "Above online",
      count: counts.above,
      activeClass: "tw:border tw:border-red-500 tw:bg-red-500 tw:text-white",
      idleClass: "tw:border tw:border-red-300 tw:bg-white tw:text-red-600",
    },
    {
      key: "winning",
      label: "Winning",
      count: counts.winning,
      activeClass:
        "tw:border tw:border-emerald-600 tw:bg-emerald-600 tw:text-white",
      idleClass:
        "tw:border tw:border-emerald-300 tw:bg-white tw:text-emerald-700",
    },
  ];

  return (
    <div
      className={clsx(
        "tw:flex tw:items-center tw:gap-2 tw:overflow-x-auto tw:pb-1 hide-scrollbar",
        className,
      )}
    >
      {chips.map((chip) => {
        const isActive = chip.key === active;

        return (
          <button
            key={chip.key}
            type="button"
            onClick={() => onSelect(chip.key)}
            aria-pressed={isActive}
            className={clsx(
              "tw:flex tw:shrink-0 tw:cursor-pointer tw:items-center tw:gap-1.5 tw:rounded-full tw:px-3.5 tw:py-1.5 tw:text-xs tw:font-semibold tw:transition-colors",
              isActive ? chip.activeClass : chip.idleClass,
            )}
          >
            {chip.label}
            <span
              className={clsx(
                "tw:flex tw:h-4 tw:min-w-4 tw:items-center tw:justify-center tw:rounded-full tw:px-1 tw:text-[10px] tw:leading-none tw:tabular-nums",
                isActive ? "tw:bg-white/20" : "tw:bg-gray-100 tw:text-gray-600",
              )}
            >
              {chip.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default MatchChips;
