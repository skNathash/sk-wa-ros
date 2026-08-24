import clsx from "clsx";
import AppCard from "~/components/core/card/AppCard";
import {
  BREAKDOWN_LBL,
  EARNING_LINES,
  NET_AMOUNT_LBL,
  NET_LBL,
} from "./helper";

/**
 * The week's maths, line by line, ending on the figure the hero already showed.
 * Every line is signed and the escrow deduction keeps its own colour, so the
 * runner can see why the payout is not simply drops × fee.
 */
export default function EarningsBreakdown() {
  return (
    <section className="tw:px-4 tw:pt-4">
      <AppCard className="tw:mb-0" bodyClassName="tw:px-4">
        <span className="app-label tw:text-slate-500">{BREAKDOWN_LBL}</span>

        <div className="tw:mt-2">
          {EARNING_LINES.map((line) => (
            <div key={line.key} className="runner-earn-row">
              <span className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-sm tw:text-slate-700">
                {line.label}
              </span>
              <span
                className={clsx(
                  "app-amount tw:text-sm tw:font-bold",
                  line._amountCls,
                )}
              >
                {line._amountLbl}
              </span>
            </div>
          ))}
        </div>

        {/* The total the payout is made against — kept off the dashed rows. */}
        <div className="runner-earn-net">
          <span className="app-label tw:text-slate-500">{NET_LBL}</span>
          <span className="app-amount tw:text-xl tw:font-bold tw:text-slate-900">
            {NET_AMOUNT_LBL}
          </span>
        </div>
      </AppCard>
    </section>
  );
}
