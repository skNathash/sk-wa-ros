import clsx from "clsx";
import type { TabItem } from "~/types/CommonTypes";

type SegmentedControlProps = {
  /** The tabs to render — name + key. */
  items: TabItem[];
  /** The currently selected tab's key. */
  value: string;
  /** Fired with the clicked tab's key. */
  onChange: (key: string) => void;
  /** Extra classes on the track (rounded-full segment bar). */
  className?: string;
};

/**
 * iOS-style segmented control, themed for theme-2 (WhatsApp): a faint
 * brand-tinted track with the active segment lifting onto a white pill that
 * carries the green — so the selected state reads in the same colour as every
 * other "this one is chosen" mark on the page (nav chips, filled actions)
 * instead of the neutral grey-on-cream it wore before. Shared by the tracker,
 * handoff and runner list — any "which shape of list" switcher where a single
 * choice of N must read at a glance.
 */
const SegmentedControl = ({
  items,
  value,
  onChange,
  className,
}: SegmentedControlProps) => {
  return (
    <div
      role="tablist"
      className={clsx(
        /* 3px of track padding (not 4) and a hairline brand ring: the control
           has to sit a notch shorter than the section chip bar above it, and
           the ring is what keeps the pale track from dissolving into the white
           toolbar band it sits on. */
        "tw:flex tw:w-full tw:items-center tw:gap-0.5 tw:rounded-full tw:p-[3px]",
        "tw:bg-[color-mix(in_srgb,var(--primary)_6%,#fff)]",
        "tw:ring-1 tw:ring-[color-mix(in_srgb,var(--primary)_14%,#fff)]",
        className,
      )}
    >
      {items.map((tab) => {
        const active = value === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.key)}
            className={clsx(
              "tw:flex-1 tw:cursor-pointer tw:whitespace-nowrap tw:rounded-full tw:px-3 tw:py-1.5 tw:text-[13px] tw:transition-all tw:duration-150",
              active
                ? "tw:bg-white tw:[font-weight:600] tw:text-[var(--primary)] tw:shadow-[0_1px_3px_color-mix(in_srgb,var(--primary)_22%,transparent)]"
                : "tw:font-medium tw:text-[var(--muted-foreground)] tw:hover:text-[var(--primary)]",
            )}
          >
            <span className="tw:inline-flex tw:items-center tw:justify-center tw:gap-1.5">
              {tab.name}
              {typeof tab.count === "number" && tab.count > 0 && (
                <span
                  className={clsx(
                    "tw:inline-flex tw:min-w-[18px] tw:h-[18px] tw:items-center tw:justify-center tw:rounded-full tw:px-1.5 tw:text-[11px] tw:font-bold tw:leading-none tw:transition-colors tw:duration-150",
                    active
                      ? "tw:bg-[var(--primary)] tw:text-white"
                      : "tw:bg-[color-mix(in_srgb,var(--primary)_12%,#fff)] tw:text-[var(--primary)]",
                  )}
                >
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default SegmentedControl;
