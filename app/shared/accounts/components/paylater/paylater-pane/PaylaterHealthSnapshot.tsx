import clsx from "clsx";
import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import CommonService from "~/services/CommonService";
import PaylaterService from "~/services/PaylaterService";
import { portfolioHealthBand } from "./helper";

export interface PaylaterHealthTotals {
  outstanding: number;
  creditLimit: number;
  wallets: number;
  overdueCount: number;
}

const EMPTY = {
  outstanding: 0,
  creditLimit: 0,
  wallets: 0,
  active: 0,
  overdueCount: 0,
  dueSoonCount: 0,
  health: 0,
};

interface PaylaterHealthSnapshotProps {
  /** Bubbles the resolved totals up so the pane header can label itself. */
  onTotals?: (totals: PaylaterHealthTotals) => void;
  className?: string;
}

/**
 * The pane's health snapshot — one card carrying what the whole book looks
 * like right now: outstanding against the limit issued, the health score, and
 * how the wallets split across active / overdue / due soon.
 *
 * Reads the same portfolio dashboard endpoint as the analytics banner.
 */
const PaylaterHealthSnapshot = ({
  onTotals,
  className,
}: PaylaterHealthSnapshotProps) => {
  const [snapshot, setSnapshot] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSnapshot = async () => {
      setLoading(true);
      try {
        const resp: any = await PaylaterService.getPortfolioDashboard();
        const payload = resp?.data?.data ?? {};

        const totals: PaylaterHealthTotals = {
          outstanding: payload?.outstanding?.amount || 0,
          creditLimit: payload?.outstanding?.limitIssued || 0,
          wallets: payload?.wallets || 0,
          overdueCount: payload?.overdueCount || 0,
        };

        setSnapshot({
          ...totals,
          active: payload?.active || 0,
          dueSoonCount: payload?.dueSoonCount || 0,
          health: payload?.health || 0,
        });
        onTotals?.(totals);
      } catch (e) {
        setSnapshot(EMPTY);
      } finally {
        setLoading(false);
      }
    };

    fetchSnapshot();
    // Fetched once per mount; the callback is only a read-out.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const health = portfolioHealthBand(snapshot.health);

  const tiles = [
    { key: "active", label: "Active", value: snapshot.active },
    {
      key: "overdue",
      label: "Overdue",
      value: snapshot.overdueCount,
      valueClassName: "tw:text-amber-300",
    },
    { key: "due-soon", label: "Due soon", value: snapshot.dueSoonCount },
  ];

  return (
    <div
      className={clsx(
        "tw:rounded-2xl tw:bg-linear-to-br tw:from-violet-600 tw:to-purple-500 tw:p-4 tw:text-white tw:shadow-lg",
        className,
      )}
    >
      <div className="tw:flex tw:items-start tw:justify-between tw:gap-3">
        <div className="tw:min-w-0">
          <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-white/70">
            Outstanding
          </div>

          <div className="tw:mt-1 tw:text-2xl tw:font-bold tw:leading-tight">
            {loading ? (
              <AppSpinner className="tw:h-6 tw:w-6" />
            ) : (
              <Amount value={snapshot.outstanding} decimalPlaces={0} />
            )}
          </div>

          <div className="tw:mt-0.5 tw:text-[11px] tw:text-white/70">
            of {CommonService.formatCompact(snapshot.creditLimit)} limit issued ·{" "}
            {snapshot.wallets} wallets
          </div>
        </div>

        <div className="tw:shrink-0 tw:text-right">
          <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-white/70">
            Health
          </div>
          <div className="tw:mt-1 tw:flex tw:items-center tw:justify-end tw:gap-1.5 tw:text-2xl tw:font-bold tw:leading-tight">
            <span
              className={clsx(
                "tw:h-2 tw:w-2 tw:rounded-full",
                health.dotClass,
              )}
            />
            {loading ? "—" : snapshot.health}
          </div>
          <div className="tw:mt-0.5 tw:text-[11px] tw:text-white/70">
            {loading ? "" : health.label}
          </div>
        </div>
      </div>

      <div className="tw:mt-3 tw:grid tw:grid-cols-3 tw:gap-2">
        {tiles.map((tile) => (
          <div
            key={tile.key}
            className="tw:rounded-xl tw:bg-white/15 tw:px-2.5 tw:py-2"
          >
            <div className="tw:text-[9px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-white/70">
              {tile.label}
            </div>
            <div
              className={clsx(
                "tw:mt-0.5 tw:text-lg tw:font-bold tw:tabular-nums",
                tile.valueClassName,
              )}
            >
              {loading ? "—" : tile.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaylaterHealthSnapshot;
