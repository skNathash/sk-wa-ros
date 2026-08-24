import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AuthService from "~/services/AuthService";
import OmsService from "~/services/OmsService";

/**
 * Header pill showing the day's takings — a green status dot, the "Today
 * sales" label and the total sales value for the current day. Tapping it is
 * left to the caller (POS billing opens the recent orders modal).
 *
 * Meant to be passed through `AppHeader`'s `renderActions` prop.
 */
const TodaySalesPill = ({
  onClick,
  className,
}: {
  onClick?: () => void;
  className?: string;
}) => {
  const [amount, setAmount] = useState<number | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!AuthService.isLoggedIn()) return;
    const summary = await OmsService.getTodaySalesSummary();
    setAmount(summary.amount);
  }, []);

  useEffect(() => {
    fetchSummary();

    // Refresh when the tab comes back into view so a pill left open on a till
    // screen doesn't keep showing a stale figure.
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchSummary();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchSummary]);

  return (
    <button
      type="button"
      onClick={onClick}
      title="Today's sales"
      className={clsx(
        "today-sales-pill tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:bg-emerald-50/70 tw:px-3.5 tw:py-1.5 tw:text-sm tw:text-slate-700 tw:whitespace-nowrap tw:shadow-sm tw:ring-1 tw:ring-emerald-100 tw:transition-colors hover:tw:bg-emerald-100/70 tw:cursor-pointer",
        className,
      )}
    >
      <span className="tw:h-2 tw:w-2 tw:shrink-0 tw:rounded-full tw:bg-emerald-500" />
      <span>Today sales</span>
      <span className="tw:text-slate-400">·</span>
      {amount === null ? (
        <span className="tw:inline-block tw:h-4 tw:w-14 tw:rounded tw:bg-emerald-100 tw:animate-pulse" />
      ) : (
        <Amount
          value={amount}
          decimalPlaces={0}
          className="tw:font-semibold tw:tabular-nums tw:text-slate-900"
        />
      )}
    </button>
  );
};

export default TodaySalesPill;
