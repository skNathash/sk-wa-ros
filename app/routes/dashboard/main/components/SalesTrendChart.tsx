import { useState } from "react";
import { salesTrend } from "../data";

const kFmt = (n: number) => `₹${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;

/** 7-day sales trend as a lightweight CSS bar chart (static data). */
const SalesTrendChart = () => {
  const [range, setRange] = useState<"week" | "month">("week");
  const max = Math.max(...salesTrend.map((d) => d.value));

  return (
    <div className="tw:rounded-2xl tw:bg-white tw:p-4 tw:shadow-sm tw:ring-1 tw:ring-slate-200/70">
      <div className="tw:flex tw:items-center tw:justify-between">
        <div>
          <p className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
            Last 7 days
          </p>
          <h3 className="tw:text-base tw:font-bold tw:text-slate-900">
            Sales trend
          </h3>
        </div>
        <div className="tw:flex tw:rounded-full tw:bg-slate-100 tw:p-0.5 tw:text-xs tw:font-semibold">
          {(["week", "month"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`tw:rounded-full tw:px-3 tw:py-1 tw:capitalize tw:transition-colors ${
                range === r
                  ? "tw:bg-emerald-500 tw:text-white"
                  : "tw:text-slate-500"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="tw:mt-5 tw:flex tw:h-40 tw:items-end tw:justify-between tw:gap-2">
        {salesTrend.map((d) => (
          <div
            key={d.label}
            className="tw:flex tw:flex-1 tw:flex-col tw:items-center tw:gap-2"
          >
            <span className="tw:text-[10px] tw:font-semibold tw:text-slate-400">
              {kFmt(d.value)}
            </span>
            <div
              className={`tw:w-full tw:rounded-t-md tw:transition-all ${
                d.today
                  ? "tw:bg-linear-to-t tw:from-emerald-500 tw:to-emerald-400"
                  : "tw:bg-teal-700/80"
              }`}
              style={{ height: `${Math.round((d.value / max) * 100)}%` }}
            />
            <span
              className={`tw:text-xs ${
                d.today
                  ? "tw:font-bold tw:text-emerald-600"
                  : "tw:text-slate-500"
              }`}
            >
              {d.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SalesTrendChart;
