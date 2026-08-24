import clsx from "clsx";
import { ChevronRight, Flame, TrendingUp, TriangleAlert } from "lucide-react";
import {
  buildCoinAlerts,
  type CoinAlert,
  type CoinPaneOverview,
} from "./helper";

const ICONS = {
  locked: TriangleAlert,
  silent: Flame,
  milestone: TrendingUp,
} as const;

interface CoinPaneAlertsProps {
  /** The snapshot the alerts are derived from; the pane owns the fetch. */
  overview: CoinPaneOverview;
  loading?: boolean;
  /** Tapping a row hands back the alert. Without it rows are inert. */
  onSelect?: (alert: CoinAlert) => void;
  className?: string;
}

/**
 * The "Alerts" stack in the King Coins pane — what the circulation snapshot is
 * worth acting on today: coins piling up unspent, a week with no redemptions,
 * and the holder sitting on the largest wallet.
 */
const CoinPaneAlerts = ({
  overview,
  loading = false,
  onSelect,
  className,
}: CoinPaneAlertsProps) => {
  const alerts = buildCoinAlerts(overview);

  return (
    <div className={clsx("tw:flex tw:flex-col tw:gap-2", className)}>
      <p className="app-pane-label">
        Alerts
      </p>

      {loading ? (
        <div className="tw:flex tw:flex-col tw:gap-2">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="tw:h-14 tw:animate-pulse tw:rounded-xl tw:bg-slate-100"
            />
          ))}
        </div>
      ) : !alerts.length ? (
        <p className="tw:rounded-xl tw:bg-slate-50 tw:px-2.5 tw:py-3 tw:text-center tw:text-[11px] tw:text-slate-400">
          Nothing needs attention right now
        </p>
      ) : (
        alerts.map((alert) => {
          const Icon = ICONS[alert.icon];

          return (
            <button
              key={alert.key}
              type="button"
              disabled={!onSelect}
              onClick={() => onSelect?.(alert)}
              className={clsx(
                "tw:flex tw:w-full tw:items-center tw:gap-2.5 tw:rounded-xl tw:px-3 tw:py-2.5 tw:text-left",
                alert.toneClassName,
                onSelect && "tw:cursor-pointer tw:transition-opacity tw:hover:opacity-80",
              )}
            >
              <span
                className={clsx(
                  "tw:flex tw:size-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg",
                  alert.iconClassName,
                )}
              >
                <Icon size={16} />
              </span>

              <span className="tw:min-w-0 tw:flex-1">
                <span className="tw:block tw:truncate tw:text-xs tw:font-semibold tw:text-slate-800">
                  {alert.title}
                </span>
                <span className="tw:block tw:truncate tw:text-[11px] tw:text-slate-500">
                  {alert.hint}
                </span>
              </span>

              {onSelect && (
                <ChevronRight size={16} className="tw:shrink-0 tw:text-slate-400" />
              )}
            </button>
          );
        })
      )}
    </div>
  );
};

export default CoinPaneAlerts;
