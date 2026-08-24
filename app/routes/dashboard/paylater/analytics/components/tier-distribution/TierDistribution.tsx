/**
 * Static wallet-tier counts for {@link TierDistribution}. `delta` is the
 * week-on-week change ("—" when flat); `color` drives both the donut arc and
 * the legend swatch.
 */
const TIERS = [
  { key: "diamond", label: "Diamond", count: 6, delta: "▲ 2 wk", color: "#7c3aed" },
  { key: "gold", label: "Gold", count: 9, delta: "▲ 1 wk", color: "#d4a017" },
  { key: "silver", label: "Silver", count: 8, delta: "—", color: "#94a3b8" },
  { key: "starter", label: "Starter", count: 5, delta: "▲ 3 wk", color: "#d6d3cd" },
];

const RADIUS = 42;
const STROKE = 12;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * PayLater "Tier Distribution" card — a donut of wallets split by loyalty tier
 * (Diamond / Gold / Silver / Starter) with the total wallet count in the centre
 * and a legend showing each tier's count and weekly movement.
 *
 * Renders from static {@link TIERS} for now.
 */
const TierDistribution = () => {
  const total = TIERS.reduce((sum, tier) => sum + tier.count, 0);

  // Precompute each arc's stroke offset so segments sit end-to-end.
  let cumulative = 0;
  const arcs = TIERS.map((tier) => {
    const fraction = tier.count / total;
    const arc = {
      ...tier,
      dashArray: `${fraction * CIRCUMFERENCE} ${CIRCUMFERENCE}`,
      dashOffset: -cumulative * CIRCUMFERENCE,
    };
    cumulative += fraction;
    return arc;
  });

  return (
    <div className="tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:p-5 tw:shadow-sm">
      <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-slate-400">
        Tier Distribution · {total} Wallets
      </div>

      <div className="tw:mt-4 tw:flex tw:items-center tw:gap-5">
        {/* Donut */}
        <div className="tw:relative tw:shrink-0">
          <svg width="112" height="112" viewBox="0 0 112 112" className="tw:-rotate-90">
            {arcs.map((arc) => (
              <circle
                key={arc.key}
                cx="56"
                cy="56"
                r={RADIUS}
                fill="none"
                stroke={arc.color}
                strokeWidth={STROKE}
                strokeDasharray={arc.dashArray}
                strokeDashoffset={arc.dashOffset}
              />
            ))}
          </svg>
          <div className="tw:absolute tw:inset-0 tw:flex tw:flex-col tw:items-center tw:justify-center">
            <span className="tw:text-2xl tw:font-bold tw:text-slate-700">{total}</span>
            <span className="tw:text-[10px] tw:uppercase tw:tracking-wider tw:text-slate-400">
              Wallets
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="tw:flex tw:flex-1 tw:flex-col tw:gap-2">
          {TIERS.map((tier) => (
            <div key={tier.key} className="tw:flex tw:items-center tw:gap-2 tw:text-sm">
              <span
                className="tw:inline-block tw:h-2.5 tw:w-2.5 tw:rounded-sm"
                style={{ backgroundColor: tier.color }}
              />
              <span className="tw:flex-1 tw:text-slate-600">{tier.label}</span>
              <span className="tw:font-semibold tw:text-slate-700">{tier.count}</span>
              <span className="tw:w-14 tw:text-right tw:text-[11px] tw:text-slate-400">
                {tier.delta}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TierDistribution;
