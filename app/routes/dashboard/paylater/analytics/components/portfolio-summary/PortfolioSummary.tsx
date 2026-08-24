/**
 * Static preview data for {@link PortfolioSummary}. Swap for live metrics once
 * the portfolio endpoint is wired up.
 */
const DATA = {
  outstanding: 12491,
  wallets: 28,
  health: 94,
  healthDelta: 3,
  issued: "₹4.2K",
  issuedNote: "6 new lines",
  recovered: "₹6.1K",
  recoveredNote: "↑ 22% MoM",
  dpd30: "₹1.9K",
  dpd30Note: "2 accounts",
};

/**
 * PayLater "Portfolio · Live" hero card — the top-of-page snapshot of the book:
 * total outstanding across all wallets, a derived health score, and this week's
 * issued / recovered / DPD-30+ figures as chips.
 *
 * Renders from static {@link DATA} for now.
 */
const PortfolioSummary = () => {
  const chips = [
    { key: "issued", label: "Issued · Wk", value: DATA.issued, note: DATA.issuedNote },
    { key: "recovered", label: "Recovered", value: DATA.recovered, note: DATA.recoveredNote },
    { key: "dpd30", label: "DPD 30+", value: DATA.dpd30, note: DATA.dpd30Note },
  ];

  return (
    <div className="tw:rounded-2xl tw:bg-gradient-to-br tw:from-violet-600 tw:to-purple-800 tw:p-5 tw:text-white tw:shadow-lg">
      {/* Headline row */}
      <div className="tw:flex tw:items-start tw:justify-between tw:gap-4">
        <div className="tw:min-w-0">
          <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-white/70">
            Portfolio · Live
          </div>
          <div className="tw:mt-1 tw:text-3xl tw:font-bold tw:leading-tight">
            ₹{DATA.outstanding.toLocaleString("en-IN")}
          </div>
          <div className="tw:mt-1 tw:text-sm tw:text-white/70">
            outstanding · {DATA.wallets} wallets
          </div>
        </div>

        <div className="tw:shrink-0 tw:text-right">
          <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-emerald-300">
            Health
          </div>
          <div className="tw:mt-1 tw:text-2xl tw:font-bold tw:text-emerald-300">
            {DATA.health}
          </div>
          <div className="tw:mt-1 tw:text-xs tw:text-white/70">
            ▲ {DATA.healthDelta} vs last wk
          </div>
        </div>
      </div>

      {/* Chips */}
      <div className="tw:mt-4 tw:grid tw:grid-cols-3 tw:gap-2">
        {chips.map((chip) => (
          <div key={chip.key} className="tw:rounded-xl tw:bg-white/10 tw:px-3 tw:py-2.5">
            <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-white/60">
              {chip.label}
            </div>
            <div className="tw:mt-0.5 tw:text-lg tw:font-bold">{chip.value}</div>
            <div className="tw:mt-0.5 tw:text-[11px] tw:text-white/60">{chip.note}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PortfolioSummary;
