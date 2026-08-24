import { useId, useMemo, useRef } from "react";
import clsx from "clsx";
import type { SwiperOptions } from "swiper/types";
import AppSwiper from "~/components/core/swiper/AppSwiper";
import { buildCashSuggestions } from "../../helper";

const CURRENCY_SYMBOL = "₹";

// Module scope: AppSwiper re-initialises whenever the config identity changes.
const CHIP_SWIPER_CONFIG: SwiperOptions = {
  slidesPerView: "auto",
  spaceBetween: 6,
  freeMode: true,
};

type Props = {
  payableAmount: number;
  tendered: number;
  /**
   * Cart total the denomination shortcuts are built from. Defaults to the
   * payable amount; the split step passes the cash share instead.
   */
  cartValue?: number;
  /**
   * Narrow layout — the split step sits the cash and UPI rails side by side,
   * so the shortcuts scroll instead of wrapping into a grid.
   */
  compact?: boolean;
  onChange: (tendered: number) => void;
  className?: string;
};

/**
 * Cash tender input for the checkout flow — the amount received, the
 * denomination shortcuts the counter reaches for, and the change to hand back.
 */
const CashTenderSection = ({
  payableAmount = 0,
  tendered = 0,
  cartValue,
  compact = false,
  onChange,
  className = "",
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const change = Math.max(0, (tendered || 0) - (payableAmount || 0));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    onChange(raw ? parseInt(raw, 10) : 0);
  };

  const quickAmounts = useMemo(
    () => buildCashSuggestions(cartValue ?? payableAmount),
    [cartValue, payableAmount],
  );

  const chipClass = clsx(
    "tw:h-8 tw:rounded-md tw:border tw:border-slate-200 tw:bg-white tw:text-xs tw:text-slate-700 tw:transition-colors tw:cursor-pointer tw:hover:border-slate-300 tw:hover:bg-slate-50",
    compact ? "tw:px-2.5" : "tw:px-1.5",
  );

  return (
    <div
      className={clsx(
        "tw:space-y-2 tw:rounded-xl tw:bg-slate-50 tw:p-2.5",
        className,
      )}
    >
      <div className="tw:flex tw:items-center tw:gap-2">
        <label
          htmlFor={inputId}
          className="tw:shrink-0 tw:text-xs tw:text-slate-600"
        >
          Cash received
        </label>

        <div
          onClick={() => inputRef.current?.focus()}
          className="tw:flex tw:h-9 tw:min-w-0 tw:flex-1 tw:cursor-text tw:items-center tw:gap-1 tw:rounded-lg tw:border tw:border-slate-200 tw:bg-white tw:px-3"
        >
          <span className="tw:text-sm tw:font-bold tw:text-slate-400">
            {CURRENCY_SYMBOL}
          </span>
          <input
            id={inputId}
            ref={inputRef}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={tendered > 0 ? tendered.toString() : ""}
            onChange={handleInputChange}
            placeholder="0"
            className="tw:h-full tw:w-full tw:min-w-0 tw:bg-transparent tw:text-right tw:text-base tw:font-bold tw:tabular-nums tw:text-slate-800 tw:outline-none tw:placeholder:text-slate-300"
          />
        </div>
      </div>

      {/* Preset denomination shortcuts */}
      {compact ? (
        <AppSwiper config={CHIP_SWIPER_CONFIG}>
          {quickAmounts.map((amount) => (
            <AppSwiper.Slide key={amount} isAutoWidth>
              <button
                type="button"
                onClick={() => onChange(amount)}
                className={chipClass}
              >
                {CURRENCY_SYMBOL}
                {amount}
              </button>
            </AppSwiper.Slide>
          ))}
          {payableAmount > 0 && (
            <AppSwiper.Slide isAutoWidth>
              <button
                type="button"
                onClick={() => onChange(payableAmount)}
                className={chipClass}
              >
                Exact
              </button>
            </AppSwiper.Slide>
          )}
        </AppSwiper>
      ) : (
        <div className="tw:grid tw:grid-cols-4 tw:gap-1.5 tw:sm:grid-cols-7">
          {quickAmounts.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => onChange(amount)}
              className={chipClass}
            >
              {CURRENCY_SYMBOL}
              {amount}
            </button>
          ))}
          {payableAmount > 0 && (
            <button
              type="button"
              onClick={() => onChange(payableAmount)}
              className={chipClass}
            >
              Exact
            </button>
          )}
        </div>
      )}

      {/* Change to return summary */}
      <div className="tw:flex tw:items-center tw:justify-between tw:rounded-lg tw:border tw:border-slate-200 tw:bg-white tw:px-3 tw:py-1.5">
        <span className="tw:text-xs tw:font-semibold tw:text-emerald-700">
          Change to return
        </span>
        <span className="tw:text-lg tw:font-bold tw:tabular-nums tw:text-emerald-700">
          {CURRENCY_SYMBOL}
          {change}
        </span>
      </div>
    </div>
  );
};

export default CashTenderSection;
