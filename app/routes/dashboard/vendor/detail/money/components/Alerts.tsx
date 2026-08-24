import { AlertTriangle } from "lucide-react";
import React from "react";
import type { MoneyAlerts } from "../helper";

interface AlertsProps {
  alerts: MoneyAlerts;
  onSnoozeAll?: () => void;
}

/**
 * "Need action" alert stack shown at the top of the Money tab. A soft amber
 * card with a coloured dot per alert — red for high-severity alerts, amber
 * for softer nudges. Bound directly to the money summary API's alerts block.
 */
const Alerts: React.FC<AlertsProps> = ({ alerts, onSnoozeAll }) => {
  if (!alerts.items.length) return null;

  return (
    <div className="tw:rounded-2xl tw:border tw:border-slate-200 tw:border-l-4 tw:border-l-red-500 tw:bg-white tw:p-4 tw:shadow-sm">
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
        <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-amber-700">
          <AlertTriangle className="tw:size-3.5" />
          <span>
            {alerts.count} Alerts · Need action
          </span>
        </div>
        <button
          type="button"
          onClick={onSnoozeAll}
          className="tw:text-[11px] tw:font-medium tw:text-slate-400 tw:cursor-pointer hover:tw:text-slate-600"
        >
          Snooze all
        </button>
      </div>

      <ul className="tw:mt-3 tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-3">
        {alerts.items.map((alert) => (
          <li key={alert.id} className="tw:flex tw:items-start tw:gap-2.5">
            <span
              className={`tw:mt-1.5 tw:size-2 tw:shrink-0 tw:rounded-full ${
                alert.severity === "high"
                  ? "tw:bg-red-500"
                  : "tw:bg-amber-500"
              }`}
            />
            <div className="tw:min-w-0">
              <div className="tw:text-sm tw:font-semibold tw:text-slate-800">
                {alert.title}
              </div>
              <div className="tw:mt-0.5 tw:text-xs tw:leading-snug tw:text-slate-500">
                {alert.message}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Alerts;
