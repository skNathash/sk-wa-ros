import clsx from "clsx";
import Amount from "~/components/core/amount/Amount";

export interface CartTotalChip {
  key: string;
  /** Plain text, or a node when part of the chip is an amount. */
  label: React.ReactNode;
  /** `accent` tints the chip — used for the savings figure. */
  tone?: "default" | "accent";
}

interface Props {
  /** Eyebrow above the figure, e.g. "Grand total". */
  label: string;
  amount: number;
  decimalPlaces?: number;
  /** Supporting counts that read along the foot of the figure. */
  chips?: CartTotalChip[];
  className?: string;
}

/**
 * Cart total banner — the single money figure a cart is acted on, set on a
 * teal plate with its supporting counts as chips beneath it.
 *
 * Built for phone widths, where a row of equal-weight stat tiles gives the eye
 * nowhere to land: the total is the only figure set large, and everything else
 * (savings, item count, seller count) drops to chip size around it. Callers
 * that also render tiles at desktop widths hide this one there.
 */
const CartTotalBanner = ({
  label,
  amount,
  decimalPlaces = 2,
  chips = [],
  className,
}: Props) => {
  return (
    <div
      className={clsx(
        "tw:relative tw:overflow-hidden tw:rounded-2xl tw:bg-gradient-to-br tw:from-teal-800 tw:via-teal-700 tw:to-emerald-600 tw:px-4 tw:py-3.5 tw:text-white tw:shadow-sm",
        className,
      )}
    >
      {/* Decorative disc bleeding off the top-right corner — keeps the plate
          from reading as a flat block behind the number. */}
      <div
        aria-hidden
        className="tw:pointer-events-none tw:absolute tw:-right-10 tw:-top-12 tw:h-32 tw:w-32 tw:rounded-full tw:bg-white/8"
      />

      <div className="tw:relative">
        <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-[0.18em] tw:text-emerald-50/70">
          {label}
        </div>

        <Amount
          value={amount}
          decimalPlaces={decimalPlaces}
          className="tw:mt-1.5 tw:block tw:text-[1.9rem] tw:font-bold tw:leading-none tw:tracking-tight tw:text-white tw:tabular-nums"
        />

        {chips.length > 0 && (
          <div className="tw:mt-3 tw:flex tw:flex-wrap tw:items-center tw:gap-1.5">
            {chips.map((chip) => (
              <span
                key={chip.key}
                className={clsx(
                  "tw:inline-flex tw:items-center tw:gap-1 tw:rounded-md tw:px-2 tw:py-1 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-[0.08em] tw:leading-none",
                  chip.tone === "accent"
                    ? "tw:bg-white/20 tw:text-white"
                    : "tw:bg-white/12 tw:text-emerald-50/85",
                )}
              >
                {chip.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CartTotalBanner;
