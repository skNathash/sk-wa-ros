/**
 * Static "tiered up this week" promotions for {@link TieredUp}. `from` → `to`
 * is the tier movement; `bills` is the billing activity that drove it.
 */
const PROMOTIONS = [
  { key: "anita", name: "Anita Sharma", from: "Silver", to: "Gold", bills: 12 },
  { key: "rakesh", name: "Rakesh Menon", from: "Starter", to: "Silver", bills: 5 },
  { key: "kavya", name: "Kavya Rao", from: "Gold", to: "Diamond", bills: 18 },
];

/**
 * PayLater "Tiered Up This Week" card — customers who moved up a loyalty tier
 * this week, showing their tier transition and the bill count behind it.
 *
 * Renders from static {@link PROMOTIONS} for now.
 */
const TieredUp = () => {
  return (
    <div className="tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:p-5 tw:shadow-sm">
      <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-slate-400">
        Tiered Up This Week · {PROMOTIONS.length}
      </div>

      <div className="tw:mt-3 tw:flex tw:flex-col tw:gap-2">
        {PROMOTIONS.map((p) => (
          <div
            key={p.key}
            className="tw:flex tw:items-center tw:gap-3 tw:rounded-xl tw:bg-slate-50 tw:px-3 tw:py-2.5"
          >
            <div className="tw:flex tw:h-8 tw:w-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-emerald-500 tw:text-sm tw:font-bold tw:text-white">
              {p.name.charAt(0)}
            </div>
            <div className="tw:min-w-0 tw:flex-1">
              <div className="tw:truncate tw:text-sm tw:font-medium tw:text-slate-700">
                {p.name}
              </div>
              <div className="tw:text-xs tw:text-slate-400">
                {p.from} → {p.to} · {p.bills} bills
              </div>
            </div>
            <span className="tw:shrink-0 tw:text-emerald-500">↗</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TieredUp;
