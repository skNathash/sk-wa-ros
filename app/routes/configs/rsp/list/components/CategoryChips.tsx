import clsx from "clsx";
import React from "react";

export interface ChipCategory {
  id: string;
  name: string;
}

/**
 * Horizontal quick-filter chips from the mobile design: "All N",
 * "Above online N" (client-side filter over the loaded page) and one chip
 * per category seen in the results (server-side category filter).
 */
const CategoryChips: React.FC<{
  totalCount: number;
  aboveOnlineCount: number;
  categories: ChipCategory[];
  /** "all" | "above" | a category id */
  active: string;
  onSelect: (key: string) => void;
  className?: string;
}> = ({
  totalCount,
  aboveOnlineCount,
  categories,
  active,
  onSelect,
  className = "",
}) => (
  <div
    className={clsx(
      "tw:flex tw:items-center tw:gap-2 tw:overflow-x-auto tw:pb-1 hide-scrollbar",
      className,
    )}
  >
    <button
      type="button"
      onClick={() => onSelect("all")}
      className={clsx(
        "tw:shrink-0 tw:cursor-pointer tw:rounded-full tw:px-3.5 tw:py-1.5 tw:text-xs tw:font-semibold tw:transition-colors",
        active === "all"
          ? "tw:bg-gray-900 tw:text-white"
          : "tw:border tw:border-gray-300 tw:bg-white tw:text-gray-700",
      )}
    >
      All {totalCount || ""}
    </button>

    {aboveOnlineCount > 0 && (
      <button
        type="button"
        onClick={() => onSelect("above")}
        className={clsx(
          "tw:flex tw:shrink-0 tw:cursor-pointer tw:items-center tw:gap-1.5 tw:rounded-full tw:border tw:px-3.5 tw:py-1.5 tw:text-xs tw:font-semibold tw:transition-colors",
          active === "above"
            ? "tw:border-red-500 tw:bg-red-500 tw:text-white"
            : "tw:border-red-300 tw:bg-white tw:text-red-600",
        )}
      >
        Above online
        <span
          className={clsx(
            "tw:flex tw:h-4 tw:min-w-4 tw:items-center tw:justify-center tw:rounded-full tw:px-1 tw:text-[10px] tw:leading-none",
            active === "above"
              ? "tw:bg-white tw:text-red-600"
              : "tw:bg-red-50 tw:text-red-600",
          )}
        >
          {aboveOnlineCount}
        </span>
      </button>
    )}

    {categories.map((category) => (
      <button
        key={category.id}
        type="button"
        onClick={() => onSelect(category.id)}
        className={clsx(
          "tw:shrink-0 tw:cursor-pointer tw:rounded-full tw:border tw:px-3.5 tw:py-1.5 tw:text-xs tw:font-semibold tw:transition-colors",
          active === category.id
            ? "tw:border-blue-500 tw:bg-blue-600 tw:text-white"
            : "tw:border-blue-300 tw:bg-white tw:text-blue-600",
        )}
      >
        {category.name}
      </button>
    ))}
  </div>
);

export default CategoryChips;
