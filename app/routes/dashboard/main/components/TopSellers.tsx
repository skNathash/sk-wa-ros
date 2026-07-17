import { topSellers } from "../data";

/** Horizontally scrollable "Top seller · Today" product cards. */
const TopSellers = () => {
  return (
    <div className="tw:rounded-2xl tw:bg-white tw:p-4 tw:shadow-sm tw:ring-1 tw:ring-slate-200/70">
      <div className="tw:flex tw:items-center tw:justify-between">
        <h3 className="tw:text-base tw:font-bold tw:text-slate-900">
          Top seller · Today
        </h3>
        <button
          type="button"
          className="tw:text-xs tw:font-semibold tw:text-emerald-600 tw:hover:underline"
        >
          View all
        </button>
      </div>

      <div className="tw:mt-3 tw:flex tw:gap-3 tw:overflow-x-auto tw:pb-1">
        {topSellers.map((p) => (
          <div key={p.rank} className="tw:w-32 tw:shrink-0">
            <div
              className={`tw:relative tw:flex tw:aspect-square tw:items-center tw:justify-center tw:rounded-xl tw:bg-linear-to-br ${p.gradient}`}
            >
              <span className="tw:absolute tw:left-1.5 tw:top-1.5 tw:rounded-md tw:bg-black/25 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold tw:text-white">
                #{p.rank}
              </span>
              <span className="tw:text-4xl tw:font-black tw:text-white/95">
                {p.letter}
              </span>
            </div>
            <p className="tw:mt-2 tw:truncate tw:text-xs tw:font-semibold tw:text-slate-800">
              {p.name}
            </p>
            <div className="tw:mt-0.5 tw:flex tw:items-center tw:justify-between tw:text-xs">
              <span className="tw:font-semibold tw:text-slate-500">
                {p.units}×
              </span>
              <span className="tw:font-semibold tw:text-slate-700">
                ₹{p.amount}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopSellers;
