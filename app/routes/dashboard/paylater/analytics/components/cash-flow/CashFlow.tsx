/**
 * Static weekly issued-vs-recovered ("back") series for {@link CashFlow}.
 * One entry per week; only a few weeks are labelled on the axis.
 */
const WEEKS = [
  { week: "W17", issued: 3.2, back: 2.8 },
  { week: "W18", issued: 4.1, back: 3.0 },
  { week: "W19", issued: 3.6, back: 4.2 },
  { week: "W20", issued: 4.8, back: 3.9 },
  { week: "W21", issued: 3.9, back: 4.6 },
  { week: "W22", issued: 5.1, back: 4.0 },
  { week: "W23", issued: 4.4, back: 5.2 },
  { week: "W24", issued: 4.9, back: 4.3 },
  { week: "W25", issued: 3.7, back: 4.8 },
  { week: "W26", issued: 5.3, back: 4.5 },
  { week: "W27", issued: 4.2, back: 5.4 },
  { week: "W28", issued: 4.6, back: 5.0 },
  { week: "W29", issued: 3.8, back: 5.1 },
];

const LABELLED_WEEKS = ["W17", "W23", "W29"];

/**
 * PayLater "Cash Flow · 12 Weeks" card — a paired bar chart contrasting weekly
 * credit issued (violet) against amount recovered / "back" (green), headlined by
 * the net (recovered − issued) figure.
 *
 * Renders from static {@link WEEKS} for now.
 */
const CashFlow = () => {
  const max = Math.max(...WEEKS.flatMap((w) => [w.issued, w.back]));

  return (
    <div className="tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:p-5 tw:shadow-sm">
      {/* Header */}
      <div className="tw:flex tw:items-start tw:justify-between tw:gap-4">
        <div>
          <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-slate-400">
            Cash Flow · 12 Weeks
          </div>
          <div className="tw:mt-1 tw:text-2xl tw:font-bold tw:text-emerald-600">
            +₹1.9K net
          </div>
          <div className="tw:text-xs tw:text-slate-400">recovered − issued</div>
        </div>
        <button
          type="button"
          className="tw:text-xs tw:font-medium tw:text-violet-600 tw:hover:underline"
        >
          See detail
        </button>
      </div>

      {/* Legend */}
      <div className="tw:mt-3 tw:flex tw:items-center tw:gap-4 tw:text-[11px] tw:text-slate-500">
        <span className="tw:flex tw:items-center tw:gap-1.5">
          <span className="tw:inline-block tw:h-2.5 tw:w-2.5 tw:rounded-sm tw:bg-violet-500" />
          Issued
        </span>
        <span className="tw:flex tw:items-center tw:gap-1.5">
          <span className="tw:inline-block tw:h-2.5 tw:w-2.5 tw:rounded-sm tw:bg-emerald-500" />
          Back
        </span>
      </div>

      {/* Bars */}
      <div className="tw:mt-4 tw:flex tw:h-28 tw:items-end tw:gap-1.5">
        {WEEKS.map((w) => (
          <div key={w.week} className="tw:flex tw:flex-1 tw:items-end tw:justify-center tw:gap-0.5">
            <div
              className="tw:w-1/2 tw:rounded-t-sm tw:bg-violet-500"
              style={{ height: `${(w.issued / max) * 100}%` }}
              title={`${w.week} issued ₹${w.issued}K`}
            />
            <div
              className="tw:w-1/2 tw:rounded-t-sm tw:bg-emerald-500"
              style={{ height: `${(w.back / max) * 100}%` }}
              title={`${w.week} back ₹${w.back}K`}
            />
          </div>
        ))}
      </div>

      {/* Axis */}
      <div className="tw:mt-1.5 tw:flex tw:justify-between tw:text-[10px] tw:text-slate-400">
        {LABELLED_WEEKS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
    </div>
  );
};

export default CashFlow;
