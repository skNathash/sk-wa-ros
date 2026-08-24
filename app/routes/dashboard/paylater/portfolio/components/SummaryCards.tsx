import clsx from "clsx";
import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import CommonService from "~/services/CommonService";
import {
  formatPeriod,
  type PortfolioSummary,
  type PortfolioType,
} from "../helper";

type Props = {
  summary: PortfolioSummary;
  loading: boolean;
  activeType: PortfolioType;
  /** Tapping a card is what switches the `type` search param. */
  callback: (type: PortfolioType) => void;
};

/**
 * The three portfolio slices as tappable cards — the selected one drives the
 * `type` the list below is fetched for.
 */
const SummaryCards = ({ summary, loading, activeType, callback }: Props) => {
  const recoveredPeriod = formatPeriod(summary.recovered.period);

  const cards: Array<{
    key: PortfolioType;
    label: string;
    /** Mobile squeezes three cards into one row, so labels/notes get shorter. */
    shortLabel: string;
    value: number;
    note: string;
    shortNote: string;
    valueClassName: string;
    activeClassName: string;
    progress?: number;
    progressClassName?: string;
  }> = [
    {
      key: "outstanding",
      label: "Outstanding",
      shortLabel: "Outstanding",
      value: summary.outstanding.amount,
      note: `of ${CommonService.formatCompact(summary.outstanding.limitIssued)} limit issued · ${summary.outstanding.utilisationPercent}%`,
      shortNote: `${summary.outstanding.utilisationPercent}% used`,
      valueClassName: "tw:text-violet-600",
      activeClassName: "tw:border-violet-500 tw:ring-1 tw:ring-violet-500",
      progress: summary.outstanding.utilisationPercent,
      progressClassName: "tw:bg-violet-600",
    },
    {
      key: "overdue",
      label: "Overdue",
      shortLabel: "Overdue",
      value: summary.overdue.amount,
      note: `${summary.overdue.customers} customers · avg DPD ${summary.overdue.avgDaysPastDue}`,
      shortNote: `${summary.overdue.customers} cust · DPD ${summary.overdue.avgDaysPastDue}`,
      valueClassName: "tw:text-rose-500",
      activeClassName: "tw:border-rose-500 tw:ring-1 tw:ring-rose-500",
    },
    {
      key: "recovered",
      label: recoveredPeriod ? `Recovered · ${recoveredPeriod}` : "Recovered",
      shortLabel: "Recovered",
      value: summary.recovered.amount,
      note: `${summary.recovered.wallets} wallets`,
      shortNote: `${summary.recovered.wallets} wallets`,
      valueClassName: "tw:text-primary",
      activeClassName: "tw:border-primary tw:ring-1 tw:ring-primary",
    },
  ];

  return (
    <div className="tw:grid tw:grid-cols-3 tw:gap-2 tw:md:gap-3 tw:lg:gap-4">
      {cards.map((card) => {
        const isActive = card.key === activeType;

        return (
          <button
            key={card.key}
            type="button"
            aria-pressed={isActive}
            onClick={() => callback(card.key)}
            className={clsx(
              "tw:min-w-0 tw:cursor-pointer tw:rounded-xl tw:border tw:bg-white tw:p-2.5 tw:md:p-4 tw:text-left tw:shadow-sm tw:transition",
              isActive
                ? card.activeClassName
                : "tw:border-slate-200 tw:hover:border-slate-300",
            )}
          >
            <div className="tw:truncate tw:text-[10px] tw:md:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:md:tracking-wider tw:text-slate-400">
              <span className="tw:md:hidden">{card.shortLabel}</span>
              <span className="tw:hidden tw:md:inline">{card.label}</span>
            </div>

            <div
              className={clsx(
                "tw:mt-0.5 tw:md:mt-1.5 tw:truncate tw:text-base tw:md:text-2xl tw:font-bold",
                card.valueClassName,
              )}
            >
              {loading ? (
                <AppSpinner className="tw:h-4 tw:w-4 tw:md:h-5 tw:md:w-5" />
              ) : (
                <Amount value={card.value} decimalPlaces={0} />
              )}
            </div>

            <div className="tw:mt-0.5 tw:md:mt-1 tw:truncate tw:text-[10px] tw:md:text-[11px] tw:text-slate-500">
              <span className="tw:md:hidden">{card.shortNote}</span>
              <span className="tw:hidden tw:md:inline">{card.note}</span>
            </div>

            {card.progress !== undefined && (
              <div className="tw:mt-1.5 tw:md:mt-2.5 tw:h-1 tw:md:h-1.5 tw:overflow-hidden tw:rounded-full tw:bg-slate-100">
                <div
                  className={clsx(
                    "tw:h-full tw:rounded-full",
                    card.progressClassName,
                  )}
                  style={{ width: `${Math.min(card.progress, 100)}%` }}
                />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default SummaryCards;
