import clsx from "clsx";
import { PAYMENT_MODES, type PaymentModeKey } from "./helper";

interface PaymentModesProps {
  /** The currently selected rail. */
  value?: PaymentModeKey;
  /**
   * Rails to offer, in case a flow can't settle with all of them (e.g. no
   * paylater limit sanctioned). Defaults to every rail.
   */
  modes?: PaymentModeKey[];
  /** Rails shown but not selectable. */
  disabled?: PaymentModeKey[];
  /** Fires `{ action: "select", data: { mode } }` when a rail is tapped. */
  callback: (payload: { action: string; data?: any }) => void;
  className?: string;
}

/**
 * The payment rail picker at the head of the checkout flow — one card per rail,
 * each an icon tile over its label. Selection is owned by the parent: tapping a
 * card only reports the choice back, so the step below it decides what the rail
 * collects (tender + change for cash, a reference for UPI, and so on).
 */
const PaymentModes = ({
  value,
  modes,
  disabled,
  callback,
  className,
}: PaymentModesProps) => {
  const items = modes
    ? PAYMENT_MODES.filter((mode) => modes.includes(mode.key))
    : PAYMENT_MODES;

  return (
    <div className={clsx("tw:grid tw:grid-cols-3 tw:gap-1.5", className)}>
      {items.map((mode) => {
        const Icon = mode.icon;
        const active = value === mode.key;
        const isDisabled = disabled?.includes(mode.key);

        return (
          <button
            key={mode.key}
            type="button"
            aria-pressed={active}
            disabled={isDisabled}
            onClick={() =>
              !isDisabled &&
              callback({ action: "select", data: { mode: mode.key } })
            }
            className={clsx(
              "tw:flex tw:items-center tw:gap-2 tw:rounded-lg tw:border tw:px-2.5 tw:py-2 tw:text-left tw:transition-colors",
              isDisabled
                ? "tw:cursor-not-allowed tw:border-slate-200 tw:bg-slate-50 tw:opacity-60"
                : "tw:cursor-pointer",
              active
                ? "tw:border-emerald-600 tw:bg-emerald-50 tw:shadow-sm"
                : !isDisabled &&
                    "tw:border-slate-200 tw:bg-white tw:hover:border-slate-300 tw:hover:bg-slate-50",
            )}
          >
            <span
              className={clsx(
                "tw:flex tw:size-7 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-md tw:transition-colors",
                active
                  ? "tw:bg-emerald-700 tw:text-white"
                  : "tw:bg-slate-100 tw:text-slate-500",
              )}
            >
              <Icon className="tw:size-3.5" strokeWidth={1.75} />
            </span>
            <span
              className={clsx(
                "tw:truncate tw:text-xs tw:font-semibold",
                active ? "tw:text-emerald-900" : "tw:text-slate-700",
              )}
            >
              {mode.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default PaymentModes;
