import { TrendingUp } from "lucide-react";
import useAppNav from "~/hooks/useAppNav";
import { quickActions, todaySummary } from "../data";
import { actionIcon } from "./actionIcons";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

type Props = {
  /** "light" = white card with inline action pills (mobile), "dark" = compact hero (desktop rail). */
  variant?: "light" | "dark";
  /** Show the 2x2 quick-action pills (light variant only). */
  showActions?: boolean;
};

/**
 * "Today" sales summary. Light variant matches the mobile card (with quick
 * action pills); dark variant matches the desktop left-rail sales hero.
 */
const TodaySalesCard = ({ variant = "light", showActions = true }: Props) => {
  const appNav = useAppNav();
  const { amount, changePct, date, billCount, onKhata, yesterday, aheadBy } =
    todaySummary;

  if (variant === "dark") {
    return (
      <div className="tw:relative tw:overflow-hidden tw:rounded-2xl tw:bg-linear-to-br tw:from-emerald-950 tw:to-teal-900 tw:p-5 tw:shadow-sm">
        <div className="tw:absolute tw:-right-8 tw:top-4 tw:text-8xl tw:font-black tw:text-white/5">
          ₹
        </div>
        <div className="tw:relative">
          <p className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-emerald-300/80">
            Today · Sales
          </p>
          <div className="tw:mt-1 tw:flex tw:items-center tw:gap-2">
            <span className="tw:text-3xl tw:font-bold tw:text-white">
              {inr(amount)}
            </span>
            <span className="tw:inline-flex tw:items-center tw:gap-0.5 tw:rounded-full tw:bg-emerald-500/20 tw:px-2 tw:py-0.5 tw:text-xs tw:font-semibold tw:text-emerald-300">
              <TrendingUp className="tw:h-3 tw:w-3" />
              {changePct}%
            </span>
          </div>
          <p className="tw:mt-2 tw:text-xs tw:text-emerald-200/70">
            Yesterday {inr(yesterday)} · You're ahead by {inr(aheadBy)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="tw:rounded-2xl tw:bg-white tw:p-4 tw:shadow-sm tw:ring-1 tw:ring-slate-200/70">
      <div className="tw:flex tw:items-center tw:justify-between">
        <span className="tw:text-sm tw:font-semibold tw:text-slate-700">
          Today
        </span>
        <span className="tw:text-xs tw:text-slate-400">{date}</span>
      </div>

      <div className="tw:mt-1 tw:flex tw:items-center tw:gap-2">
        <span className="tw:text-3xl tw:font-bold tw:text-slate-900">
          {inr(amount)}
        </span>
        <span className="tw:inline-flex tw:items-center tw:gap-0.5 tw:rounded-full tw:bg-emerald-50 tw:px-2 tw:py-0.5 tw:text-xs tw:font-semibold tw:text-emerald-600">
          <TrendingUp className="tw:h-3 tw:w-3" />
          {changePct}%
        </span>
      </div>
      <p className="tw:mt-0.5 tw:text-xs tw:text-slate-500">
        {billCount} Bills · {inr(onKhata)} On khata
      </p>

      {showActions && (
        <div className="tw:mt-4 tw:grid tw:grid-cols-2 tw:gap-2.5">
          {quickActions.map((action) => {
            const Icon = actionIcon[action.icon];
            return (
              <button
                key={action.key}
                type="button"
                onClick={() => appNav.to(action.to)}
                className="tw:flex tw:items-center tw:gap-2 tw:rounded-full tw:border tw:border-slate-200 tw:px-3 tw:py-2.5 tw:text-sm tw:font-semibold tw:text-slate-700 tw:transition-colors tw:hover:border-slate-300 tw:hover:bg-slate-50"
              >
                <Icon
                  className={`tw:h-4 tw:w-4 ${
                    action.icon === "bill"
                      ? "tw:text-emerald-600"
                      : action.icon === "payment"
                        ? "tw:text-amber-600"
                        : action.icon === "scan"
                          ? "tw:text-sky-600"
                          : "tw:text-rose-600"
                  }`}
                />
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TodaySalesCard;
