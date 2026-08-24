import clsx from "clsx";
import type { ReactNode } from "react";

/** A single chip in a {@link PaneChips} strip. */
export interface PaneChipItem {
  /** Stable key for React and selection tracking. */
  key: string;
  /** Already-translated label shown on the chip. */
  label: string;
  /** Optional leading icon (e.g. a lucide element). */
  icon?: ReactNode;
  /** Marks the chip as the current selection — filled with the brand tone. */
  active?: boolean;
  /**
   * Optional trailing count badge (e.g. items awaiting action behind this
   * view). Omit — or pass 0 — to render the chip without a badge.
   */
  count?: number;
  /** Free-form payload carried back to the parent on tap. */
  [key: string]: any;
  /** Whether the chip is non-interactive. */
  disabled?: boolean;
}

/** Shape handed to {@link PaneChipsProps.callback} when a chip is tapped. */
export interface PaneChipsAction {
  action: string;
  data: PaneChipItem;
}

interface PaneChipsProps {
  /** The chips to render. */
  data: PaneChipItem[];
  /** Invoked with `{ action: "select", data: chip }` when a chip is tapped. */
  callback: (payload: PaneChipsAction) => void;
  /**
   * Render the buttons without the wrapping flex row, so two strips can share
   * one row owned by the host (see the Coin Store pane).
   */
  bare?: boolean;
  className?: string;
}

/**
 * A generic wrapping strip of small pill buttons, driven entirely by props.
 * The chip set and the active chip are owned by the parent; tapping a chip
 * fires `callback({ action: "select", data })` so the parent decides what a tap
 * does (navigate, filter, …). Resting chips are neutral; the `active` chip
 * fills with the brand tone.
 *
 * For a domain-specific set with navigation baked in, see the wrappers that
 * compose this (e.g. `PayLaterPaneChips`).
 */
const PaneChips = ({ data, callback, bare, className }: PaneChipsProps) => {
  const chips = (
    <>
      {data.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() =>
            !item.disabled && callback({ action: "select", data: item })
          }
          disabled={item.disabled}
          className={clsx(
            "app-nav-chip tw:inline-flex tw:items-center tw:gap-1.5 tw:whitespace-nowrap tw:rounded-lg tw:border tw:px-2.5 tw:py-1.5 tw:text-xs tw:font-medium tw:transition-colors",
            item.disabled && "tw:cursor-not-allowed tw:opacity-60",
            !item.disabled && "tw:cursor-pointer",
            item.active
              ? "app-nav-chip-active tw:bg-slate-900 tw:text-white tw:border-slate-900 tw:shadow-sm"
              : "tw:border-slate-200 tw:bg-white tw:text-slate-700 tw:hover:bg-slate-50",
          )}
        >
          {item.icon}
          {item.label}
          {item.count ? (
            <span
              className={clsx(
                "tw:ml-0.5 tw:inline-flex tw:min-w-4 tw:items-center tw:justify-center tw:rounded-full tw:px-1 tw:py-px tw:text-[10px] tw:font-bold tw:tabular-nums",
                // The active chip's fill differs per theme (solid slate here,
                // a light brand tint in theme-2), so the badge borrows the
                // chip's own text colour instead of assuming a dark backdrop.
                item.active
                  ? "tw:bg-current/15 tw:text-current"
                  : "tw:bg-amber-100 tw:text-amber-700",
              )}
            >
              {item.count}
            </span>
          ) : null}
        </button>
      ))}
    </>
  );

  if (bare) return chips;

  return (
    <div className={clsx("tw:flex tw:flex-wrap tw:gap-2", className)}>
      {chips}
    </div>
  );
};

export default PaneChips;
