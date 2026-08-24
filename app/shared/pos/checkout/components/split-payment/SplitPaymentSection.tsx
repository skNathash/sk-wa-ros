import clsx from "clsx";
import { Zap } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import type { PaymentModeKey } from "../payment-modes/helper";

/** The two rails a split bill is settled with, in the order they read. */
export type SplitPair = [PaymentModeKey, PaymentModeKey];

/** Amount put on each rail, keyed the same way the rails are. */
export type SplitAmounts = Partial<Record<PaymentModeKey, number>>;

interface SplitPaymentSectionProps {
  payableAmount: number;
  /** Rails the split is spread across. Defaults to cash + UPI. */
  modes?: SplitPair;
  amounts: SplitAmounts;
  /** Whether the split rail itself is the selected one. */
  active?: boolean;
  /** Fires `{ action: "select" }` when the header card is tapped. */
  callback: (payload: { action: string; data?: any }) => void;
  className?: string;
}

const DEFAULT_MODES: SplitPair = ["cash", "upi"];

/**
 * Split tender for the checkout flow — one bill settled across two rails.
 *
 * The card only turns the split rail on and reports how much of the bill is
 * covered. The amounts themselves are typed into the rail blocks that follow
 * (cash tender, UPI), so the counter never fills the same figure twice.
 */
const SplitPaymentSection = ({
  payableAmount = 0,
  modes = DEFAULT_MODES,
  amounts,
  active = true,
  callback,
  className,
}: SplitPaymentSectionProps) => {
  const covered = modes.reduce((sum, mode) => sum + (amounts[mode] || 0), 0);
  const isCovered = payableAmount > 0 && covered === payableAmount;

  return (
    <div className={clsx("tw:space-y-2", className)}>
      <button
        type="button"
        aria-pressed={active}
        onClick={() => callback({ action: "select" })}
        className={clsx(
          "tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-2.5 tw:rounded-xl tw:border tw:px-3 tw:py-2 tw:text-left tw:transition-colors",
          active
            ? "tw:border-emerald-600 tw:bg-emerald-50/60"
            : "tw:border-slate-200 tw:bg-white tw:hover:border-slate-300 tw:hover:bg-slate-50",
        )}
      >
        <span
          className={clsx(
            "tw:flex tw:size-7 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:transition-colors",
            active
              ? "tw:bg-emerald-700 tw:text-white"
              : "tw:bg-slate-100 tw:text-slate-500",
          )}
        >
          <Zap className="tw:size-3.5" strokeWidth={1.75} />
        </span>

        <span className="tw:min-w-0 tw:flex-1">
          <span className="tw:block tw:truncate tw:text-sm tw:font-semibold tw:text-slate-800">
            Split payment
          </span>
          <span className="tw:block tw:truncate tw:text-[11px] tw:text-slate-500">
            Part cash, part UPI
          </span>
        </span>

        {/* Once the split is on, the header carries the coverage itself — the
            rail blocks below own the amounts. */}
        {active ? (
          <span
            className={clsx(
              "tw:shrink-0 tw:text-xs tw:font-bold tw:tabular-nums",
              isCovered ? "tw:text-emerald-700" : "tw:text-amber-600",
            )}
          >
            <Amount value={covered} /> / <Amount value={payableAmount} />
          </span>
        ) : (
          <span className="tw:shrink-0 tw:text-[11px] tw:font-bold tw:tracking-wide tw:text-emerald-700">
            SMART
          </span>
        )}
      </button>
    </div>
  );
};

export default SplitPaymentSection;
