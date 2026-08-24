import clsx from "clsx";
import { ChevronRight, ShoppingCart } from "lucide-react";

import Amount from "~/components/core/amount/Amount";

interface SubscribeCartBarProps {
  /** Items staged for subscribing (cart lines + pending AI barcode items). */
  count: number;
  /** Cart value, shown beside the count. Omitted (or 0) drops the amount. */
  amount?: number;
  /** Pulses the count badge right after an item lands in the cart. */
  pulse?: boolean;
  onView: () => void;
  className?: string;
}

/**
 * The subscribe cart as a filled bar pinned above the mobile tab bar — the
 * theme-2 mobile stand-in for the cart FAB, which is desktop only, and for the
 * page footer, which theme-2 hides on mobile. The whole bar opens the cart; the
 * "View" pill is only the affordance for it.
 *
 * Positioning comes from `.app-footer.app-footer-fixed`, so theme-2's existing
 * offset keeps it clear of the bottom tab bar (see theme-2.css). The count is
 * owned by the caller — the subscribe layout already tracks it for the FAB, so
 * the bar never disagrees with it and costs no extra fetch.
 *
 * Renders nothing when the cart is empty; an empty bar would just eat a strip
 * of the viewport without saying anything.
 */
const SubscribeCartBar = ({
  count,
  amount,
  pulse,
  onView,
  className,
}: SubscribeCartBarProps) => {
  if (!count) return null;

  return (
    <button
      type="button"
      onClick={onView}
      aria-label={`Review subscribe cart, ${count} ${count === 1 ? "item" : "items"}`}
      // The brand green straight off the token: theme-2 rewrites the Tailwind
      // green utilities to its bright success fill, which is the wrong green
      // for a filled surface (same reasoning as SubscribeCartCard).
      // Padding rides along inline because `.app-footer` sets its own and the
      // two are the same specificity — the token fill and the bar's gutter both
      // have to win outright.
      style={{ backgroundColor: "var(--primary)", padding: "0.625rem 1rem" }}
      className={clsx(
        "app-footer app-footer-fixed",
        "tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-3 tw:text-left tw:text-white",
        className,
      )}
    >
      <span className="tw:relative tw:flex tw:size-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl tw:bg-white/15">
        <ShoppingCart size={20} />
        <span
          className={clsx(
            "tw:absolute tw:-top-1.5 tw:-right-1.5 tw:flex tw:h-5 tw:min-w-5 tw:items-center tw:justify-center tw:rounded-full tw:bg-red-500 tw:px-1 tw:text-[10px] tw:font-bold tw:text-white tw:tabular-nums",
            pulse && "animate__animated animate__pulse",
          )}
        >
          {count}
        </span>
      </span>

      <span className="tw:min-w-0 tw:flex-1">
        <span className="tw:block tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-white/70">
          Cart · Tap to review
        </span>
        <span className="tw:block tw:truncate tw:text-[15px] tw:font-bold tw:leading-snug tw:tabular-nums">
          {count} {count === 1 ? "item" : "items"}
          {amount ? (
            <>
              {" · "}
              <Amount value={amount} decimalPlaces={0} />
            </>
          ) : null}
        </span>
      </span>

      <span
        style={{ color: "var(--primary)" }}
        className="tw:flex tw:shrink-0 tw:items-center tw:gap-0.5 tw:rounded-full tw:bg-white tw:py-1.5 tw:pl-4 tw:pr-3 tw:text-sm tw:font-bold"
      >
        View
        <ChevronRight size={16} className="tw:shrink-0" />
      </span>
    </button>
  );
};

export default SubscribeCartBar;
