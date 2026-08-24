import { format } from "date-fns";
import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import PaylaterService from "~/services/PaylaterService";
import { portfolioHealthBand } from "~/shared/accounts/components/paylater/paylater-pane/helper";

const EMPTY = {
  wallets: 0,
  active: 0,
  overdueCount: 0,
  dueSoonCount: 0,
  health: 0,
  outstanding: 0,
  limitIssued: 0,
  utilisationPercent: 0,
};

/**
 * PayLater portfolio banner — the top-of-page snapshot of the book: total
 * outstanding, how many wallets carry it, the active/overdue/due-soon split,
 * and the limit issued against the book.
 *
 * Reads the paylater portfolio dashboard endpoint.
 */
const PortfolioHero = () => {
  const [summary, setSummary] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const resp: any = await PaylaterService.getPortfolioDashboard();
        const payload = resp?.data?.data ?? {};

        setSummary({
          wallets: payload?.wallets || 0,
          active: payload?.active || 0,
          overdueCount: payload?.overdueCount || 0,
          dueSoonCount: payload?.dueSoonCount || 0,
          health: payload?.health || 0,
          outstanding: payload?.outstanding?.amount || 0,
          limitIssued: payload?.outstanding?.limitIssued || 0,
          utilisationPercent: payload?.outstanding?.utilisationPercent || 0,
        });
      } catch (e) {
        setSummary(EMPTY);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  return (
    <div className="tw:rounded-2xl tw:bg-linear-to-r tw:from-violet-600 tw:to-purple-500 tw:p-5 tw:text-white tw:shadow-lg">
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-4">
        <div className="tw:min-w-0">
          <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-white/70">
            Paylater portfolio · {format(new Date(), "MMM yyyy")}
          </div>

          {loading ? (
            <div className="tw:mt-1.5">
              <AppSpinner className="tw:h-6 tw:w-6" />
            </div>
          ) : (
            <>
              <div className="tw:mt-1.5 tw:text-2xl tw:md:text-3xl tw:font-bold tw:leading-tight">
                <Amount value={summary.outstanding} decimalPlaces={0} />{" "}
                outstanding · {summary.wallets} wallets
              </div>

              <div className="tw:mt-1.5 tw:text-xs tw:md:text-sm tw:text-white/70">
                {summary.active} active · {summary.overdueCount} overdue ·{" "}
                {summary.dueSoonCount} due this week · Portfolio health{" "}
                {summary.health} ({portfolioHealthBand(summary.health).label})
              </div>
            </>
          )}
        </div>

        <div className="tw:hidden tw:shrink-0 tw:rounded-xl tw:bg-white/15 tw:px-4 tw:py-3 tw:text-right tw:sm:block">
          <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-white/70">
            Limit issued
          </div>
          <div className="tw:mt-0.5 tw:text-lg tw:font-bold">
            <Amount value={summary.limitIssued} decimalPlaces={0} />
          </div>
          <div className="tw:mt-0.5 tw:text-[11px] tw:text-white/70">
            {summary.utilisationPercent}% utilised
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioHero;
