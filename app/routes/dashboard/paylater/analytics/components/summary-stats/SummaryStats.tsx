import clsx from "clsx";
import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppNav from "~/hooks/useAppNav";
import CommonService from "~/services/CommonService";
import PaylaterService from "~/services/PaylaterService";

/**
 * The unlock queue has no endpoint yet — literals until those keys exist;
 * nothing here is derived on the client.
 */
const STATIC = {
  readyToUnlock: 8,
  readyToUnlockScore: 88,
};

const EMPTY = {
  outstanding: 0,
  limitIssued: 0,
  utilisationPercent: 0,
  overdueAmount: 0,
  overdueCustomers: 0,
  avgDaysPastDue: 0,
  recoveredAmount: 0,
  recoveredWallets: 0,
  recoveredPeriod: "",
};

/** "LIFETIME" → "Lifetime", "7D" → "7d" — the period label on the recovered tile. */
const formatPeriod = (period: string) =>
  period ? period.charAt(0) + period.slice(1).toLowerCase() : "";

/**
 * The four headline paylater numbers under the portfolio banner: what is
 * outstanding, what is overdue, what came back, and how many customers are
 * queued for a limit unlock.
 *
 * The first three tiles come from the portfolio dashboard endpoint; the unlock
 * tile renders from {@link STATIC}.
 */
const SummaryStats = () => {
  const nav = useAppNav();
  const [summary, setSummary] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const resp: any = await PaylaterService.getPortfolioDashboard();
        const payload = resp?.data?.data ?? {};

        setSummary({
          outstanding: payload?.outstanding?.amount || 0,
          limitIssued: payload?.outstanding?.limitIssued || 0,
          utilisationPercent: payload?.outstanding?.utilisationPercent || 0,
          overdueAmount: payload?.overdue?.amount || 0,
          overdueCustomers: payload?.overdue?.customers || 0,
          avgDaysPastDue: payload?.overdue?.avgDaysPastDue || 0,
          recoveredAmount: payload?.recovered?.amount || 0,
          recoveredWallets: payload?.recovered?.wallets || 0,
          recoveredPeriod: payload?.recovered?.period || "",
        });
      } catch (e) {
        setSummary(EMPTY);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const recoveredPeriod = formatPeriod(summary.recoveredPeriod);

  /** Opens the portfolio list for the slice the tile stands for. */
  const openPortfolio = (type: string) => {
    nav.to("/dashboard/paylater/portfolio", { tab: "portfolio", type });
  };

  const tiles = [
    {
      key: "outstanding",
      type: "outstanding",
      label: "Outstanding",
      value: <Amount value={summary.outstanding} decimalPlaces={0} />,
      note: `of ${CommonService.formatCompact(summary.limitIssued)} limit issued · ${summary.utilisationPercent}%`,
      valueClassName: "tw:text-violet-600",
      cardClassName: "tw:border-violet-500",
      progress: summary.utilisationPercent,
      progressClassName: "tw:bg-violet-600",
    },
    {
      key: "overdue",
      type: "overdue",
      label: "Overdue",
      value: <Amount value={summary.overdueAmount} decimalPlaces={0} />,
      note: `${summary.overdueCustomers} customers · avg DPD ${summary.avgDaysPastDue}`,
      valueClassName: "tw:text-rose-500",
      cardClassName: "tw:border-slate-200",
    },
    {
      key: "recovered",
      type: "recovered",
      label: recoveredPeriod ? `Recovered · ${recoveredPeriod}` : "Recovered",
      value: <Amount value={summary.recoveredAmount} decimalPlaces={0} />,
      note: `${summary.recoveredWallets} wallets`,
      valueClassName: "tw:text-primary",
      cardClassName: "tw:border-slate-200",
    },
    {
      key: "unlock",
      // No list slice behind the unlock queue yet — the tile stays inert.
      type: "",
      label: "Ready to unlock",
      value: STATIC.readyToUnlock,
      note: `auto-eligible · avg score ${STATIC.readyToUnlockScore}`,
      valueClassName: "tw:text-primary",
      cardClassName: "tw:border-primary",
    },
  ];

  return (
    <div className="tw:grid tw:grid-cols-2 tw:gap-3 tw:lg:grid-cols-4 tw:lg:gap-4">
      {tiles.map((tile) => (
        <div
          key={tile.key}
          role={tile.type ? "button" : undefined}
          tabIndex={tile.type ? 0 : undefined}
          onClick={tile.type ? () => openPortfolio(tile.type) : undefined}
          onKeyDown={
            tile.type
              ? (event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openPortfolio(tile.type);
                  }
                }
              : undefined
          }
          className={clsx(
            "tw:rounded-xl tw:border tw:bg-white tw:p-4 tw:shadow-sm",
            tile.type && "tw:cursor-pointer tw:transition tw:hover:shadow-md",
            tile.cardClassName,
          )}
        >
          <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-slate-400">
            {tile.label}
          </div>

          <div
            className={clsx(
              "tw:mt-1.5 tw:text-xl tw:md:text-2xl tw:font-bold",
              tile.valueClassName,
            )}
          >
            {loading ? <AppSpinner className="tw:h-5 tw:w-5" /> : tile.value}
          </div>

          <div className="tw:mt-1 tw:text-[11px] tw:text-slate-500">
            {tile.note}
          </div>

          {tile.progress !== undefined && (
            <div className="tw:mt-2.5 tw:h-1.5 tw:overflow-hidden tw:rounded-full tw:bg-slate-100">
              <div
                className={clsx("tw:h-full tw:rounded-full", tile.progressClassName)}
                style={{ width: `${tile.progress}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SummaryStats;
