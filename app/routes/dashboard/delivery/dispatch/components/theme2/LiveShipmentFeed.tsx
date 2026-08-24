import { RefreshCw } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import type { LiveShipment } from "./helper";

interface LiveShipmentFeedProps {
  shipments: LiveShipment[];
  autoRefreshSeconds?: number;
  className?: string;
  onRefresh?: () => void;
}

const statusToneClasses: Record<string, string> = {
  "ON ROUTE":
    "tw:bg-blue-50 tw:text-blue-700 tw:border-blue-100",
  DELIVERED:
    "tw:bg-emerald-50 tw:text-emerald-700 tw:border-emerald-100",
  DELAYED:
    "tw:bg-red-50 tw:text-red-700 tw:border-red-100",
};

/**
 * Theme-2 live shipment feed panel.
 *
 * Shows the current on-route list with ETA, runner context, and order value.
 * Designed to sit beside {@link DispatchTrackerMap} on the dispatch desk.
 */
const LiveShipmentFeed = ({
  shipments,
  autoRefreshSeconds = 5,
  className = "",
  onRefresh,
}: LiveShipmentFeedProps) => {
  return (
    <AppCard className={className} noPadding>
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border-b tw:border-gray-100 tw:px-4 tw:py-3">
        <h3 className="tw:text-sm tw:font-semibold tw:text-gray-900">
          Live shipment feed
        </h3>
        <button
          type="button"
          onClick={onRefresh}
          className="tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:text-gray-500 tw:transition-colors hover:tw:text-gray-700"
        >
          auto-refresh · {autoRefreshSeconds}s
          <RefreshCw size={12} className="tw:opacity-70" />
        </button>
      </div>

      <div className="tw:max-h-80 tw:overflow-y-auto sm:tw:max-h-96">
        {shipments.length === 0 ? (
          <div className="tw:px-4 tw:py-8 tw:text-center tw:text-sm tw:text-gray-500">
            No active shipments right now.
          </div>
        ) : (
          <ul className="tw:divide-y tw:divide-gray-100">
            {shipments.map((shipment, index) => {
              const isUrgent = shipment.etaMinutes > 15;
              return (
                <li
                  key={shipment.id}
                  className={`tw:flex tw:items-center tw:justify-between tw:gap-3 tw:px-4 tw:py-3 tw:transition-colors hover:tw:bg-gray-50 ${
                    index === 0 ? "tw:bg-gray-50/50" : ""
                  }`}
                >
                  <div className="tw:min-w-0 tw:flex-1">
                    <div className="tw:flex tw:items-center tw:gap-2">
                      <span
                        className={`tw:inline-flex tw:items-center tw:rounded tw:border tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-semibold uppercase tw:tracking-wide ${
                          statusToneClasses[shipment.status] ||
                          statusToneClasses["ON ROUTE"]
                        }`}
                      >
                        {shipment.status}
                      </span>
                      <span className="tw:truncate tw:text-sm tw:font-semibold tw:text-gray-900">
                        #{shipment.orderRef}
                      </span>
                      <span className="tw:truncate tw:text-sm tw:text-gray-600">
                        · {shipment.customerName}
                      </span>
                    </div>
                    <div className="tw:mt-1 tw:truncate tw:text-xs tw:text-gray-500">
                      {shipment.runnerName} · {shipment.location}{" "}
                      <span className="tw:text-gray-400">
                        · {shipment.distanceKm} km
                      </span>
                    </div>
                  </div>

                  <div className="tw:flex tw:shrink-0 tw:flex-col tw:items-end tw:gap-0.5">
                    <span
                      className={`tw:text-sm tw:font-semibold ${
                        isUrgent ? "tw:text-red-600" : "tw:text-emerald-600"
                      }`}
                    >
                      {shipment.etaMinutes} min
                    </span>
                    <span className="tw:text-sm tw:font-semibold tw:text-gray-900">
                      <Amount
                        value={shipment.amount}
                        decimalPlaces={0}
                        showSymbol
                      />
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AppCard>
  );
};

export default LiveShipmentFeed;
