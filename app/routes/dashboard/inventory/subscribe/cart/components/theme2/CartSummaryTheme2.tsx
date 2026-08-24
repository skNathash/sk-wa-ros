import clsx from "clsx";
import Amount from "~/components/core/amount/Amount";
import type { CartTotals } from "./helper";

interface Props {
  totals: CartTotals;
  className?: string;
}

const EYEBROW_CLASS =
  "tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-[0.18em] tw:text-emerald-100/70";

const STAT_LABEL_CLASS =
  "tw:text-[9px] tw:font-semibold tw:uppercase tw:tracking-[0.14em] tw:text-emerald-100/60";

const STAT_VALUE_CLASS =
  "tw:mt-1 tw:text-[13px] tw:font-bold tw:leading-none tw:text-white";

const STAT_HINT_CLASS = "tw:mt-1 tw:text-[10px] tw:leading-tight tw:text-emerald-100/60";

const CARD_CLASS =
  "tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:px-3.5 tw:py-3";

const LABEL_CLASS =
  "tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-[0.14em] tw:text-slate-500";

const VALUE_CLASS = "tw:text-[1.4rem] tw:font-bold tw:leading-none";

const HINT_CLASS = "tw:text-[11px] tw:leading-tight tw:text-slate-400";

/**
 * theme-2 cart summary — two shapes for two widths.
 *
 * Mobile gets one dark banner: the cart value is the only figure set large
 * because it's the one number the store acts on, readiness is inset on the
 * right where it reads as a gate on submitting, and count / units / margin run
 * along the foot. Tiles at that width would stack into a column of
 * equal-weight boxes with nowhere for the eye to land.
 *
 * Desktop keeps the white tiles, reading left to right in the order the
 * numbers are decided: what's in the cart, what it earns, what it costs.
 * There's room for them side by side, and the pane already carries readiness
 * so the banner's inset gate would be a duplicate.
 */
const CartSummaryTheme2 = ({ totals, className }: Props) => {
  return (
    <>
      <div
        className={clsx(
          "tw:overflow-hidden tw:rounded-2xl tw:bg-gradient-to-br tw:from-emerald-900 tw:via-emerald-800 tw:to-teal-700 tw:px-4 tw:py-4 tw:text-white tw:shadow-sm tw:md:hidden",
          className,
        )}
      >
        <div className="tw:flex tw:items-stretch tw:gap-3">
          <div className="tw:min-w-0 tw:flex-1">
            <div className={EYEBROW_CLASS}>Subscribe · new to catalog</div>

            <Amount
              value={totals.totalValue}
              decimalPlaces={0}
              className="tw:mt-2.5 tw:block tw:text-[1.9rem] tw:font-bold tw:leading-none tw:tracking-tight tw:text-white"
            />

            <div className="tw:mt-2 tw:text-[11px] tw:text-emerald-100/75">
              Cart value
            </div>
          </div>

          {/* Readiness sits in its own inset panel: it's a gate, not a figure
              to compare against the money on the left. */}
          <div className="tw:flex tw:w-[104px] tw:shrink-0 tw:flex-col tw:items-center tw:justify-center tw:rounded-xl tw:bg-white/10 tw:px-2 tw:py-3 tw:text-center">
            <div className={clsx(STAT_LABEL_CLASS, "tw:text-emerald-50/70")}>
              Ready
            </div>
            <div className="tw:mt-1.5 tw:text-[1.4rem] tw:font-bold tw:leading-none tw:text-white">
              {totals.readyCount}
              <span className="tw:text-emerald-100/50">
                /{totals.totalProducts}
              </span>
            </div>
            <div className="tw:mt-1.5 tw:text-[10px] tw:leading-tight tw:text-emerald-100/60">
              {totals.pendingCount} pending
            </div>
            {/* Progress bar restates the same split for a quick glance. */}
            <div className="tw:mt-2 tw:h-1 tw:w-full tw:overflow-hidden tw:rounded-full tw:bg-white/15">
              <div
                className="tw:h-full tw:rounded-full tw:bg-emerald-300"
                style={{ width: `${totals.readyPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="tw:mt-4 tw:grid tw:grid-cols-2 tw:gap-3 tw:border-t tw:border-white/10 tw:pt-3">
          <div>
            <div className={STAT_LABEL_CLASS}>Items</div>
            <div className={STAT_VALUE_CLASS}>{totals.totalProducts}</div>
            <div className={STAT_HINT_CLASS}>lines in cart</div>
          </div>
          <div>
            <div className={STAT_LABEL_CLASS}>Units</div>
            <div className={STAT_VALUE_CLASS}>{totals.totalUnits}</div>
            <div className={STAT_HINT_CLASS}>stock qty entered</div>
          </div>
          {/* Avg margin hidden for now. */}
          {/* <div>
            <div className={STAT_LABEL_CLASS}>Avg margin</div>
            <div className={clsx(STAT_VALUE_CLASS, "tw:text-emerald-300")}>
              {totals.avgMarginLabel}
            </div>
            <div className={STAT_HINT_CLASS}>Weighted by revenue</div>
          </div> */}
        </div>
      </div>

      {/* Desktop — the four-tile grid. */}
      <div
        className={clsx(
          "tw:hidden tw:md:grid tw:md:grid-cols-2 tw:md:gap-3",
          className,
        )}
      >
        <div className={CARD_CLASS}>
          <div className={LABEL_CLASS}>Items</div>
          <div className={clsx(VALUE_CLASS, "tw:mt-2 tw:text-slate-900")}>
            {totals.totalProducts}
          </div>
          <div className={clsx(HINT_CLASS, "tw:mt-2")}>{totals.unitsLabel}</div>
        </div>

        {/* Avg margin hidden for now. */}
        {/* <div className={CARD_CLASS}>
          <div className={LABEL_CLASS}>Avg margin</div>
          <div className={clsx(VALUE_CLASS, "tw:mt-2 tw:text-emerald-600")}>
            {totals.avgMarginLabel}
          </div>
          <div className={clsx(HINT_CLASS, "tw:mt-2")}>Weighted by revenue</div>
        </div> */}

        <div className={CARD_CLASS}>
          <div className={LABEL_CLASS}>Total value</div>
          <Amount
            value={totals.totalValue}
            decimalPlaces={0}
            className={clsx(VALUE_CLASS, "tw:mt-2 tw:block tw:text-emerald-600")}
          />
          <div className={clsx(HINT_CLASS, "tw:mt-2")}>
            Purchase price × stock qty
          </div>
        </div>
      </div>
    </>
  );
};

export default CartSummaryTheme2;
