import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

export interface FilterChipProps {
  /** Chip label. */
  children: ReactNode;
  /** Solid/active look (e.g. the currently applied sort or the "All" toggle). */
  active?: boolean;
  /** Static leading label rendered before the value, e.g. "Sort:". */
  prefix?: ReactNode;
  /** Small leading icon (lucide icon element). */
  leadingIcon?: ReactNode;
  /** Small trailing icon — e.g. a chevron for dropdown chips or an X to clear. */
  trailingIcon?: ReactNode;
  /** Numeric badge shown at the trailing edge (e.g. count of applied values). */
  count?: number;
  size?: "sm" | "md";
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizeClassMap: Record<NonNullable<FilterChipProps["size"]>, string> = {
  sm: "tw:h-7 tw:px-3 tw:text-xs tw:gap-1.5",
  md: "tw:h-9 tw:px-4 tw:text-sm tw:gap-2",
};

/**
 * A single pill-shaped filter chip. Two visual states:
 * - `active` → solid fill (primary), used for the applied/selected chip.
 * - default → outline, used for the available options.
 *
 * Presentational only — wire selection/filter logic through `onClick`.
 */
const FilterChip = ({
  children,
  active = false,
  prefix,
  leadingIcon,
  trailingIcon,
  count,
  size = "sm",
  disabled = false,
  className,
  onClick,
}: FilterChipProps) => {
  return (
    <button
      type="button"
      data-slot="filter-chip"
      data-active={active || undefined}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "tw:inline-flex tw:items-center tw:rounded-full tw:border tw:font-medium tw:whitespace-nowrap tw:cursor-pointer tw:transition-colors tw:select-none tw:active:scale-[0.98]",
        "tw:disabled:opacity-50 tw:disabled:cursor-not-allowed tw:disabled:active:scale-100",
        sizeClassMap[size],
        active
          ? "tw:bg-primary tw:text-primary-foreground tw:border-transparent"
          : "tw:bg-white tw:text-gray-700 tw:border-gray-300 tw:hover:border-primary/50 tw:hover:text-gray-900",
        className,
      )}
    >
      {leadingIcon && (
        <span className="tw:shrink-0 tw:[&>svg]:size-3.5">{leadingIcon}</span>
      )}
      {prefix && (
        <span
          className={cn(
            "tw:shrink-0",
            active ? "tw:opacity-80" : "tw:text-gray-400",
          )}
        >
          {prefix}
        </span>
      )}
      <span className="tw:truncate">{children}</span>
      {typeof count === "number" && (
        <span
          data-slot="filter-chip-count"
          className={cn(
            "tw:ml-0.5 tw:inline-flex tw:h-4 tw:min-w-4 tw:items-center tw:justify-center tw:rounded-full tw:px-1 tw:text-[10px] tw:font-semibold tw:leading-none",
            active
              ? "tw:bg-white/25 tw:text-primary-foreground"
              : "tw:bg-primary/10 tw:text-primary",
          )}
        >
          {count}
        </span>
      )}
      {trailingIcon && (
        <span className="tw:shrink-0 tw:[&>svg]:size-3.5">{trailingIcon}</span>
      )}
    </button>
  );
};

export default FilterChip;
