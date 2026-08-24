import clsx from "clsx";

/** The two price books a card can be drawn from. */
export type PricingType = "b2c" | "b2b";

const PRICING_TYPES: { key: PricingType; label: string }[] = [
  { key: "b2c", label: "B2C" },
  { key: "b2b", label: "B2B" },
];

export interface PricingTypeToggleProps {
  /** Price book currently in view. */
  active: PricingType;
  /** Fires with the price book tapped — including the one already active. */
  onChange: (value: PricingType) => void;
  className?: string;
}

/**
 * B2C / B2B switch — a segmented pair that swaps the price book a card reads
 * from. Kept shared so every pricing card switches on the same control.
 */
const PricingTypeToggle = ({
  active,
  onChange,
  className,
}: PricingTypeToggleProps) => (
  <div
    className={clsx(
      "tw:flex tw:shrink-0 tw:items-center tw:gap-0.5 tw:rounded-lg tw:bg-slate-100 tw:p-0.5",
      className,
    )}
  >
    {PRICING_TYPES.map((entry) => (
      <button
        key={entry.key}
        type="button"
        onClick={() => onChange(entry.key)}
        aria-pressed={active === entry.key}
        className={clsx(
          "tw:rounded-md tw:px-2.5 tw:py-1 tw:text-[11px] tw:font-bold",
          active === entry.key
            ? "tw:bg-white tw:text-teal-700 tw:shadow-sm"
            : "tw:text-slate-500 hover:tw:text-slate-700",
        )}
      >
        {entry.label}
      </button>
    ))}
  </div>
);

export default PricingTypeToggle;
