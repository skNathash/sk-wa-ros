import clsx from "clsx";
import { ClipboardList, ShoppingCart } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AuthService from "~/services/AuthService";
import GlobalQtyApply from "../GlobalQtyApply";
import type { CartTotals } from "./helper";
import PaneTitle from "~/shared/layout/app-pane/PaneTitle";

export type CartTabKey = "current" | "pending";

export interface PendingStats {
  foundBySk: number;
  notMatched: number;
}

interface Props {
  activeTab: CartTabKey;
  onTabChange: (tab: CartTabKey) => void;
  /** Lines staged in the cart, ready to submit. */
  cartCount: number;
  /** AI-found products still waiting to be created. */
  pendingCount: number;
  totals: CartTotals;
  /** Breakdown of the create-pending tab for the side pane summary. */
  pendingStats: PendingStats;
  /** Cart tab with lines on it — the summary and the qty tool have something to act on. */
  showTools: boolean;
  onApplyQty: (qty: number) => void;
  className?: string;
}

const NAV_ITEMS: {
  key: CartTabKey;
  name: string;
  hint: string;
  icon: typeof ShoppingCart;
}[] = [
  {
    key: "current",
    name: "Ready to Submit",
    hint: "Priced and stocked lines",
    icon: ShoppingCart,
  },
  {
    key: "pending",
    name: "Create Pending",
    hint: "Not in the SK catalog yet",
    icon: ClipboardList,
  },
];

const CARD_CLASS =
  "tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:p-3.5";

const CARD_TITLE_CLASS =
  "tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-[0.14em] tw:text-slate-400";

/**
 * Side-pane contents for the cart in theme-2 desktop. The pane takes over the
 * three things that were competing for the top strip — which list you're on,
 * how the cart adds up, and the apply-to-all quantity tool — so the strip above
 * the table carries nothing but the view toggle and the table gets the width.
 *
 * On smaller screens the pane doesn't exist and those controls stay on the top
 * bar (they're tagged `app-pane-hide` there), so nothing is lost.
 */
const CartSidePane = ({
  activeTab,
  onTabChange,
  cartCount,
  pendingCount,
  totals,
  pendingStats,
  showTools,
  onApplyQty,
  className,
}: Props) => {
  // GlobalQtyApply renders nothing for a master login, which would leave the
  // card as a heading over empty space — drop the whole section instead.
  const showQtyTool = showTools && !AuthService.isMasterLogin();

  const counts: Record<CartTabKey, number> = {
    current: cartCount,
    pending: pendingCount,
  };

  return (
    <div className={clsx("tw:flex tw:flex-col tw:gap-4", className)}>
      {/* Pane header — section title + scope label, as on the other catalog
          panes so the pair reads as one surface across the section. */}
      <div className="tw:flex tw:items-baseline tw:justify-between tw:px-1">
        <PaneTitle title="Subscription Cart" />
        {/* Scope label removed — the pane header carries the title alone.
        <span className="tw:text-sm tw:text-slate-400">Catalog</span>
        */}
      </div>

      {/* The tab row, re-laid as a pane nav: one line per list, its count on
          the right. A count of nothing still shows — an empty list is the
          answer to "is there anything else waiting", not a reason to hide. */}
      <nav className="tw:flex tw:flex-col tw:gap-1">
        {NAV_ITEMS.map((navItem) => {
          const isActive = activeTab === navItem.key;
          const Icon = navItem.icon;
          const count = counts[navItem.key];
          // With one list empty the page pins itself to the populated one, so
          // switching to the empty side would be a no-op — say so instead.
          const isEmpty = !count && !isActive;

          return (
            <button
              key={navItem.key}
              type="button"
              onClick={() => onTabChange(navItem.key)}
              disabled={isEmpty}
              aria-current={isActive ? "page" : undefined}
              className={clsx(
                "tw:flex tw:items-center tw:gap-3 tw:rounded-xl tw:px-3 tw:py-2.5 tw:text-left tw:transition-colors",
                isActive
                  ? "tw:bg-primary/10 tw:text-primary"
                  : isEmpty
                    ? "tw:text-slate-300"
                    : "tw:text-slate-600 hover:tw:bg-slate-100",
              )}
            >
              <Icon size={17} className="tw:shrink-0" />
              <span className="tw:min-w-0 tw:flex-1">
                <span className="tw:block tw:truncate tw:text-[13px] tw:font-semibold">
                  {navItem.name}
                </span>
                <span
                  className={clsx(
                    "tw:block tw:truncate tw:text-[11px]",
                    isEmpty ? "tw:text-slate-300" : "tw:text-slate-400",
                  )}
                >
                  {navItem.hint}
                </span>
              </span>
              <span
                className={clsx(
                  "tw:shrink-0 tw:rounded-full tw:px-2 tw:py-0.5 tw:text-[11px] tw:font-bold tw:tabular-nums",
                  isActive
                    ? "tw:bg-primary tw:text-white"
                    : "tw:bg-slate-100 tw:text-slate-500",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </nav>

      {showTools && (
        <div>
          {/* Summary — what the cart adds up to, and how much of it can
              actually be saved. The bar answers "how close am I", the two
              dotted counts name what's left. */}
          <section className={clsx(CARD_CLASS, "tw:flex tw:flex-col tw:gap-3")}>
            <div className="tw:flex tw:items-baseline tw:justify-between">
              <span className={CARD_TITLE_CLASS}>Summary</span>
              <span className="tw:text-[11px] tw:font-medium tw:tabular-nums tw:text-slate-400">
                {totals.totalProducts} item
                {totals.totalProducts === 1 ? "" : "s"}
              </span>
            </div>

            <div className="tw:flex tw:items-baseline tw:justify-between tw:gap-2">
              <span className="tw:text-[13px] tw:text-slate-500">
                Cart value
              </span>
              <Amount
                value={totals.totalValue}
                decimalPlaces={2}
                className="tw:text-xl tw:font-bold tw:tabular-nums tw:text-slate-900"
              />
            </div>

            <div className="tw:flex tw:items-baseline tw:justify-between tw:gap-2">
              <span className="tw:text-[13px] tw:text-slate-500">
                Total units
              </span>
              <span className="tw:text-[13px] tw:font-semibold tw:tabular-nums tw:text-slate-700">
                {totals.totalUnits}
              </span>
            </div>

            {/* <div
              className="tw:h-1.5 tw:overflow-hidden tw:rounded-full tw:bg-slate-100"
              role="presentation"
            >
              <div
                className="tw:h-full tw:rounded-full tw:bg-emerald-500 tw:transition-all"
                style={{ width: `${totals.readyPercent}%` }}
              />
            </div> */}

            {/* <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-x-3 tw:gap-y-1 tw:text-[11px] tw:tabular-nums">
              <span className="tw:inline-flex tw:items-center tw:gap-1 tw:font-medium tw:text-emerald-600">
                <span className="tw:h-1.5 tw:w-1.5 tw:rounded-full tw:bg-emerald-500" />
                {totals.readyCount} ready
              </span>
              {totals.pendingCount > 0 && (
                <span className="tw:inline-flex tw:items-center tw:gap-1 tw:font-medium tw:text-amber-600">
                  <span className="tw:h-1.5 tw:w-1.5 tw:rounded-full tw:bg-amber-500" />
                  {totals.pendingCount} need info
                </span>
              )}
            </div> */}
          </section>
        </div>
      )}

      {activeTab === "pending" && (
        <section className={clsx(CARD_CLASS, "tw:flex tw:flex-col tw:gap-3")}>
          <div className="tw:flex tw:items-baseline tw:justify-between">
            <span className={CARD_TITLE_CLASS}>Create pending summary</span>
            <span className="tw:text-[11px] tw:font-medium tw:tabular-nums tw:text-slate-400">
              {pendingCount} item
              {pendingCount === 1 ? "" : "s"}
            </span>
          </div>

          <div className="tw:flex tw:flex-col tw:gap-2.5">
            <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
              <span className="tw:inline-flex tw:items-center tw:gap-1.5 tw:text-[13px] tw:text-slate-600">
                <span className="tw:h-2 tw:w-2 tw:rounded-full tw:bg-emerald-500" />
                Found by SK AI
              </span>
              <span className="tw:text-[13px] tw:font-semibold tw:tabular-nums tw:text-slate-900">
                {pendingStats.foundBySk}
              </span>
            </div>

            <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
              <span className="tw:inline-flex tw:items-center tw:gap-1.5 tw:text-[13px] tw:text-slate-600">
                <span className="tw:h-2 tw:w-2 tw:rounded-full tw:bg-slate-400" />
                Not matched
              </span>
              <span className="tw:text-[13px] tw:font-semibold tw:tabular-nums tw:text-slate-900">
                {pendingStats.notMatched}
              </span>
            </div>
          </div>

          <p className="tw:text-[11px] tw:leading-snug tw:text-slate-400">
            AI-found items can be created in one tap. Unmatched items need
            details filled in.
          </p>
        </section>
      )}

      {/* Apply-to-all quantity — a cart-wide tool, so it sits with the
          cart-wide numbers rather than over one column of the table. */}
      {showQtyTool && (
        <section className={clsx(CARD_CLASS, "tw:flex tw:flex-col tw:gap-2")}>
          <span className={CARD_TITLE_CLASS}>Stock qty</span>
          <GlobalQtyApply onApply={onApplyQty} />
          <p className="tw:text-[11px] tw:leading-snug tw:text-slate-400">
            Sets the same stock quantity on every line in the cart.
          </p>
        </section>
      )}
    </div>
  );
};

export default CartSidePane;
