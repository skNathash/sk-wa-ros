/**
 * Static cohort-comparison figures for {@link CohortInsight}. Compares PayLater
 * customers against cash-only customers over the trailing window.
 */
const DATA = {
  orderMultiplier: "2.4×",
  spendUplift: "62%",
  windowDays: 90,
  paylaterCount: 28,
  cashCount: 219,
};

/**
 * PayLater "Cohort Insight" card — a single narrative callout contrasting
 * PayLater customers with cash-only ones (order frequency and spend per bill),
 * with the standout figures highlighted inline.
 *
 * Renders from static {@link DATA} for now.
 */
const CohortInsight = () => {
  return (
    <div className="tw:rounded-2xl tw:border tw:border-violet-200 tw:bg-violet-50 tw:p-5 tw:shadow-sm">
      <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-violet-400">
        Cohort Insight
      </div>

      <p className="tw:mt-2 tw:text-sm tw:leading-relaxed tw:text-slate-700">
        Paylater customers order{" "}
        <span className="tw:font-bold tw:text-violet-700">{DATA.orderMultiplier} more often</span>{" "}
        and spend{" "}
        <span className="tw:font-bold tw:text-violet-700">{DATA.spendUplift} more per bill</span>{" "}
        than cash-only customers.
      </p>

      <div className="tw:mt-3 tw:text-[11px] tw:text-slate-400">
        Compared over last {DATA.windowDays} days · {DATA.paylaterCount} paylater vs{" "}
        {DATA.cashCount} cash
      </div>
    </div>
  );
};

export default CohortInsight;
