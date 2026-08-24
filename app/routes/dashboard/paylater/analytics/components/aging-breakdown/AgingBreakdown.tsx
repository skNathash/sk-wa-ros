/**
 * Static aging buckets for {@link AgingBreakdown}. `amount` is the rupees
 * outstanding in each bucket; `people` the count of accounts; `barClassName`
 * the fill colour (cool → warm as the debt ages).
 */
const BUCKETS = [
  { key: "0-15", label: "0–15 days", amount: 6480, people: 13, barClassName: "tw:bg-emerald-500" },
  { key: "16-30", label: "16–30 days", amount: 2860, people: 6, barClassName: "tw:bg-teal-600" },
  { key: "31-60", label: "31–60 days", amount: 1320, people: 3, barClassName: "tw:bg-amber-400" },
  { key: "60+", label: "60+ days", amount: 1831, people: 2, barClassName: "tw:bg-rose-500" },
];

/**
 * PayLater "Aging" card — shows where the outstanding book sits across aging
 * buckets, each as a horizontal bar sized to its share of the largest bucket,
 * with the rupee amount and account count alongside.
 *
 * Renders from static {@link BUCKETS} for now.
 */
const AgingBreakdown = () => {
  const max = Math.max(...BUCKETS.map((b) => b.amount));
  const total = BUCKETS.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:p-5 tw:shadow-sm">
      <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-slate-400">
        Aging — where the ₹{(total / 1000).toFixed(0)}K sits
      </div>

      <div className="tw:mt-4 tw:flex tw:flex-col tw:gap-3.5">
        {BUCKETS.map((b) => (
          <div key={b.key} className="tw:flex tw:items-center tw:gap-3">
            <div className="tw:w-20 tw:shrink-0 tw:text-xs tw:font-medium tw:text-slate-600">
              {b.label}
            </div>
            <div className="tw:h-2.5 tw:flex-1 tw:overflow-hidden tw:rounded-full tw:bg-slate-100">
              <div
                className={`tw:h-full tw:rounded-full ${b.barClassName}`}
                style={{ width: `${(b.amount / max) * 100}%` }}
              />
            </div>
            <div className="tw:w-24 tw:shrink-0 tw:text-right">
              <div className="tw:text-sm tw:font-semibold tw:text-slate-700">
                ₹{b.amount.toLocaleString("en-IN")}
              </div>
              <div className="tw:text-[11px] tw:text-slate-400">{b.people} people</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgingBreakdown;
