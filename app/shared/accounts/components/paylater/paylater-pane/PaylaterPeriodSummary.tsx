import clsx from "clsx";
import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import {
  formatDpdMovement,
  getPeriodSummary,
  type PaylaterPeriodSummary as PeriodSummary,
  type PaylaterSummaryPeriod,
} from "./helper";

interface PaylaterPeriodSummaryProps {
  /** Which window the strip reads. Defaults to the current week. */
  period?: PaylaterSummaryPeriod;
  /** Section label above the cards. */
  title?: string;
  className?: string;
}

/** One card in the strip: accent rail, label, headline figure, supporting line. */
interface SummaryCard {
  key: string;
  label: string;
  /** Rendered value — a rupee figure or a plain count. */
  value: React.ReactNode;
  caption: string;
  railClassName: string;
  valueClassName: string;
}

/**
 * The pane's period strip — what the book did this week, one figure per card:
 * credit issued, money recovered, which way days-past-due moved, and how the
 * nudges landed. Reads `type=summary` off the insights dashboard.
 *
 * The nudge card only appears once the endpoint sends nudge counters; the
 * summary payload does not carry them yet.
 */
const PaylaterPeriodSummary = ({
  period = "week",
  title = "This week",
  className,
}: PaylaterPeriodSummaryProps) => {
  const [summary, setSummary] = useState<PeriodSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchSummary = async () => {
      setLoading(true);
      try {
        const result = await getPeriodSummary(period);
        if (mounted) setSummary(result);
      } catch (error) {
        console.error("Error fetching paylater period summary:", error);
        if (mounted) setSummary(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchSummary();
    return () => {
      mounted = false;
    };
  }, [period]);

  const cards: SummaryCard[] = summary
    ? [
        {
          key: "issued",
          label: "Issued",
          value: <Amount value={summary.issued} decimalPlaces={0} />,
          caption: `${summary.issuedWalletCount} ${
            summary.issuedWalletCount === 1 ? "wallet" : "wallets"
          }`,
          railClassName: "tw:bg-violet-500",
          valueClassName: "tw:text-violet-600",
        },
        {
          key: "recovered",
          label: "Recovered",
          value: <Amount value={summary.recovered} decimalPlaces={0} />,
          caption: `${summary.recoveredPaymentCount} ${
            summary.recoveredPaymentCount === 1 ? "payment" : "payments"
          }`,
          railClassName: "tw:bg-emerald-500",
          valueClassName: "tw:text-emerald-600",
        },
        {
          key: "dpd",
          label: "DPD movement",
          value: formatDpdMovement(summary.dpdMovement),
          caption: `${summary.backOnTrack} back on track`,
          railClassName: "tw:bg-amber-400",
          valueClassName: "tw:text-amber-500",
        },
      ]
    : [];

  if (summary?.nudges) {
    cards.push({
      key: "nudges",
      label: "Nudges sent",
      value: summary.nudges.sent,
      caption: `${summary.nudges.read} read · ${summary.nudges.paid} pay`,
      railClassName: "tw:bg-blue-500",
      valueClassName: "tw:text-blue-600",
    });
  }

  return (
    <div className={clsx("tw:flex tw:flex-col tw:gap-2", className)}>
      <p className="app-pane-label">
        {title}
      </p>

      {loading ? (
        <div className="tw:flex tw:flex-col tw:gap-2">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="tw:h-19 tw:animate-pulse tw:rounded-xl tw:bg-slate-100"
            />
          ))}
        </div>
      ) : !cards.length ? (
        <p className="tw:rounded-xl tw:bg-slate-50 tw:px-2.5 tw:py-3 tw:text-center tw:text-[11px] tw:text-slate-400">
          No activity in this period
        </p>
      ) : (
        cards.map((card) => (
          <div
            key={card.key}
            className="tw:flex tw:items-stretch tw:gap-3 tw:overflow-hidden tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:py-3 tw:pr-3"
          >
            {/* Accent rail — the card's whole colour cue. */}
            <span
              className={clsx(
                "tw:ml-3 tw:w-1 tw:shrink-0 tw:rounded-full",
                card.railClassName,
              )}
            />

            <div className="tw:min-w-0">
              <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-400">
                {card.label}
              </div>
              <div
                className={clsx(
                  "tw:mt-0.5 tw:text-xl tw:font-bold tw:tabular-nums",
                  card.valueClassName,
                )}
              >
                {card.value}
              </div>
              <div className="tw:mt-0.5 tw:truncate tw:text-[11px] tw:text-slate-400">
                {card.caption}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default PaylaterPeriodSummary;
