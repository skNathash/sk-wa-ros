import Amount from "~/components/core/amount/Amount";
import CartRowTheme2 from "./CartRowTheme2";
import type { CartRowView, CartTotals } from "./helper";

interface Props {
  rows: CartRowView[];
  totals: CartTotals;
  unitOptions?: { label: string; value: string }[];
  callback: (params: { action: string; data?: any }) => void;
}

/**
 * theme-2 cart list — the stacked, chat-like reading of the cart used on mobile
 * and in the desktop card view. Each line is its own card floating on the page
 * background with a gap between them, so one item reads as one unit instead of
 * bleeding into the next; the tally card closes the thread.
 */
const MobileViewTheme2 = ({ rows, totals, unitOptions, callback }: Props) => {
  return (
    <div className="tw:flex tw:flex-col tw:gap-3">
      {rows.map((row) => (
        <CartRowTheme2
          key={row.item.itemId || row.index}
          row={row}
          unitOptions={unitOptions}
          callback={callback}
        />
      ))}

      <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-end tw:gap-2 tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:px-4 tw:py-3 tw:shadow-sm">
        {/* Readiness label hidden for now. */}
        {/* <span className="tw:text-[12px] tw:font-medium tw:tabular-nums tw:text-slate-500">
          {totals.readyLabel}
        </span> */}
        <span className="tw:flex tw:items-baseline tw:gap-1.5">
          <span className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-500">
            Cart value
          </span>
          <Amount
            value={totals.totalValue}
            decimalPlaces={2}
            className="tw:text-base tw:font-bold tw:tabular-nums tw:text-slate-900"
          />
        </span>
      </div>
    </div>
  );
};

export default MobileViewTheme2;
