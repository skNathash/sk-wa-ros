import clsx from "clsx";
import type { ReactNode } from "react";
import Amount from "~/components/core/amount/Amount";
import PaneTitle from "~/shared/layout/app-pane/PaneTitle";

/**
 * The pieces every bulk-config cart pane in `configs/product-select/cart` is
 * built from. The five carts (price, scheme, sell-in, reserve, promotional)
 * each answer the same three questions in the theme-2 desktop pane — how far
 * the cart is from being saveable, how the lines break down by the one setting
 * that cart edits, and what the cart adds up to — so the shell and the rows
 * live here and each page only supplies its own numbers.
 */

export const PANE_CARD_CLASS =
  "tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:p-3.5";

export const PANE_CARD_TITLE_CLASS =
  "tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-[0.14em] tw:text-slate-400";

interface CartPaneShellProps {
  /** Fallback heading — the left rail's active entry wins (see PaneTitle). */
  title: string;
  /** Line under the heading naming what this cart configures. */
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

/** Pane header + column, shared by all five cart panes. */
export const CartPaneShell = ({
  title,
  subtitle,
  children,
  className,
}: CartPaneShellProps) => (
  <div className={clsx("tw:flex tw:flex-col tw:gap-4", className)}>
    <div className="tw:flex tw:flex-col tw:gap-0.5 tw:px-1">
      <PaneTitle title={title} />
      {subtitle && (
        <span className="tw:text-xs tw:text-slate-400">{subtitle}</span>
      )}
    </div>
    {children}
  </div>
);

interface PaneCardProps {
  title: string;
  /** Small muted note on the right of the card heading (e.g. "12 items"). */
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** One titled block inside a pane. */
export const PaneCard = ({
  title,
  meta,
  children,
  className,
}: PaneCardProps) => (
  <section
    className={clsx(PANE_CARD_CLASS, "tw:flex tw:flex-col tw:gap-3", className)}
  >
    <div className="tw:flex tw:items-baseline tw:justify-between tw:gap-2">
      <span className={PANE_CARD_TITLE_CLASS}>{title}</span>
      {meta && (
        <span className="tw:text-[11px] tw:font-medium tw:tabular-nums tw:text-slate-400">
          {meta}
        </span>
      )}
    </div>
    {children}
  </section>
);

interface PaneStatRowProps {
  label: string;
  /** Rendered as-is when a node; formatted as currency when `amount` is set. */
  value: ReactNode;
  /** Render the value through {@link Amount} instead of as plain text. */
  amount?: boolean;
  /** Colour dot before the label, for breakdown rows. */
  dotClass?: string;
  /** Play the value up (used for the one number the card is really about). */
  emphasis?: boolean;
}

/** A label/value line — the pane's workhorse row. */
export const PaneStatRow = ({
  label,
  value,
  amount,
  dotClass,
  emphasis,
}: PaneStatRowProps) => (
  <div className="tw:flex tw:items-baseline tw:justify-between tw:gap-2">
    <span className="tw:inline-flex tw:items-center tw:gap-1.5 tw:text-[13px] tw:text-slate-500">
      {dotClass && (
        <span className={clsx("tw:h-2 tw:w-2 tw:rounded-full", dotClass)} />
      )}
      {label}
    </span>
    {amount ? (
      <Amount
        value={Number(value) || 0}
        decimalPlaces={2}
        className={clsx(
          "tw:tabular-nums",
          emphasis
            ? "tw:text-xl tw:font-bold tw:text-slate-900"
            : "tw:text-[13px] tw:font-semibold tw:text-slate-700",
        )}
      />
    ) : (
      <span
        className={clsx(
          "tw:tabular-nums",
          emphasis
            ? "tw:text-xl tw:font-bold tw:text-slate-900"
            : "tw:text-[13px] tw:font-semibold tw:text-slate-700",
        )}
      >
        {value}
      </span>
    )}
  </div>
);

interface PaneProgressProps {
  /** Lines that already carry a valid setting. */
  ready: number;
  /** Everything in the cart. */
  total: number;
  /** What a finished line is called on this cart ("priced", "configured" …). */
  readyLabel?: string;
  /** What an unfinished line is called ("needs price", "undecided" …). */
  pendingLabel?: string;
}

/**
 * How close the cart is to saveable. Save validates every line, so a single
 * unfinished row blocks the whole cart — the bar is the pane's headline.
 */
export const PaneProgress = ({
  ready,
  total,
  readyLabel = "ready",
  pendingLabel = "pending",
}: PaneProgressProps) => {
  const pending = Math.max(total - ready, 0);
  const percent = total ? Math.round((ready / total) * 100) : 0;

  return (
    <>
      <div
        className="tw:h-1.5 tw:overflow-hidden tw:rounded-full tw:bg-slate-100"
        role="presentation"
      >
        <div
          className="tw:h-full tw:rounded-full tw:bg-emerald-500 tw:transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-x-3 tw:gap-y-1 tw:text-[11px] tw:tabular-nums">
        <span className="tw:inline-flex tw:items-center tw:gap-1 tw:font-medium tw:text-emerald-600">
          <span className="tw:h-1.5 tw:w-1.5 tw:rounded-full tw:bg-emerald-500" />
          {ready} {readyLabel}
        </span>
        {pending > 0 && (
          <span className="tw:inline-flex tw:items-center tw:gap-1 tw:font-medium tw:text-amber-600">
            <span className="tw:h-1.5 tw:w-1.5 tw:rounded-full tw:bg-amber-500" />
            {pending} {pendingLabel}
          </span>
        )}
      </div>
    </>
  );
};

interface PaneSplitBarProps {
  segments: { key: string; label: string; count: number; barClass: string }[];
  total: number;
}

/**
 * A single stacked bar over its legend, for the yes/no (and pack-type) splits.
 * Reads the share at a glance without five separate bars competing.
 */
export const PaneSplitBar = ({ segments, total }: PaneSplitBarProps) => {
  const shown = segments.filter((segment) => segment.count > 0);

  return (
    <>
      <div className="tw:flex tw:h-1.5 tw:overflow-hidden tw:rounded-full tw:bg-slate-100">
        {shown.map((segment) => (
          <div
            key={segment.key}
            className={segment.barClass}
            style={{ width: `${total ? (segment.count / total) * 100 : 0}%` }}
          />
        ))}
      </div>

      <div className="tw:flex tw:flex-col tw:gap-2">
        {segments.map((segment) => (
          <PaneStatRow
            key={segment.key}
            label={segment.label}
            value={segment.count}
            dotClass={segment.barClass}
          />
        ))}
      </div>
    </>
  );
};

interface PaneNoteProps {
  children: ReactNode;
}

/** Small print under a card — what the numbers above mean for the save. */
export const PaneNote = ({ children }: PaneNoteProps) => (
  <p className="tw:text-[11px] tw:leading-snug tw:text-slate-400">{children}</p>
);
