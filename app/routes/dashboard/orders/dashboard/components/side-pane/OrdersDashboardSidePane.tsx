import clsx from "clsx";
import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import PaneChips, {
  type PaneChipItem,
} from "~/shared/navigation/pane-chips/PaneChips";
import PaneTitle from "~/shared/layout/app-pane/PaneTitle";
import type { SummaryItem } from "../../helper";
import {
  DASHBOARD_CHANNELS,
  formatDateRangeLabel,
  getChannel,
  getShare,
} from "./helper";

interface OrdersDashboardSidePaneProps {
  /** Channel the dashboard is scoped to — the page's `mainTab` value. */
  activeChannel: string;
  onChannelChange: (key: string) => void;

  /** Per-channel totals the page already resolved for its overview cards. */
  allOrders: SummaryItem;
  b2b: SummaryItem;
  b2c: SummaryItem;

  /** Units in the active scope — only known for the B2B/B2C scopes. */
  totalUnits?: number;

  /** Window the filter bar is holding, shown under the pane title. */
  dateFrom?: string | Date;
  dateTo?: string | Date;

  className?: string;
}

const MetricRow = ({
  label,
  value,
  loading,
}: {
  label: string;
  value: React.ReactNode;
  loading?: boolean;
}) => (
  <div className="tw:flex tw:items-baseline tw:justify-between tw:gap-2">
    <span className="app-pane-label">
      {label}
    </span>
    <span className="tw:text-sm tw:font-semibold tw:text-slate-900 app-amount">
      {loading ? <AppSpinner size="sm" /> : value}
    </span>
  </div>
);

/**
 * Side-pane contents for the orders dashboard in theme-2 desktop. Carries the
 * two things the feed drops there (`app-pane-hide`): the channel scope tabs,
 * as chips with their order counts, and the overview totals that the three
 * cards at the top of the feed show on mobile and in the other themes.
 *
 * Every number comes from the page — the pane fetches nothing of its own, so
 * it always reads the same window as the filter bar above the feed.
 */
const OrdersDashboardSidePane = ({
  activeChannel,
  onChannelChange,
  allOrders,
  b2b,
  b2c,
  totalUnits,
  dateFrom,
  dateTo,
  className,
}: OrdersDashboardSidePaneProps) => {
  const summaries: Record<string, SummaryItem> = {
    "all-orders": allOrders,
    "b2b-orders": b2b,
    "b2c-orders": b2c,
  };

  const channel = getChannel(activeChannel);
  const scope = summaries[activeChannel] ?? allOrders;
  const rangeLabel = formatDateRangeLabel(dateFrom, dateTo);

  const chips: PaneChipItem[] = DASHBOARD_CHANNELS.map((item) => ({
    key: item.key,
    label: item.label,
    active: item.key === activeChannel,
    count: summaries[item.key]?.totalOrders,
  }));

  // The lanes always compare against the whole book, whichever scope is on
  // screen — so switching to B2B doesn't hide how big B2B is.
  const lanes = DASHBOARD_CHANNELS.filter((item) => item.key !== "all-orders");

  return (
    <div className={clsx("tw:flex tw:flex-col tw:gap-4", className)}>
      {/* Pane header — section title + the window every number below covers. */}
      <div className="tw:flex tw:items-baseline tw:justify-between tw:gap-2 tw:px-1">
        <PaneTitle title="Orders" />
        {rangeLabel && (
          <span className="tw:shrink-0 tw:text-xs tw:text-slate-400">
            {rangeLabel}
          </span>
        )}
      </div>

      {/* What the feed is scoped to — the channel tabs the feed hides here. */}
      <div>
        <p className="app-pane-label">
          Channels
        </p>
        <PaneChips
          data={chips}
          callback={({ data }) => onChannelChange(data.key)}
          className="tw:mt-1.5"
        />
      </div>

      {/* The overview card for the scope on screen, as the pane's headline. */}
      <div>
        <p className="app-pane-label">
          Scope
        </p>
        <div className="tw:mt-1.5 tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:p-4">
          <div className="tw:flex tw:items-center tw:gap-2">
            <span
              className={clsx(
                "tw:h-2 tw:w-2 tw:shrink-0 tw:rounded-full",
                channel.dotClass,
              )}
            />
            <span className="app-pane-label">
              {channel.label}
            </span>
          </div>

          <div className="tw:mt-3 tw:flex tw:items-baseline tw:gap-2">
            <span
              className={clsx(
                "tw:text-3xl tw:font-bold tw:leading-none app-amount",
                channel.numberClass,
              )}
            >
              {scope.loading ? <AppSpinner size="sm" /> : scope.totalOrders}
            </span>
            <span className="tw:text-xs tw:text-slate-500">Total Orders</span>
          </div>

          <div className="tw:mt-3 tw:space-y-2 tw:border-t tw:border-slate-100 tw:pt-2.5">
            <MetricRow
              label="Customers"
              value={scope.totalCustomers}
              loading={scope.loading}
            />
            <MetricRow
              label="Total Value"
              value={<Amount value={scope.totalValue} />}
              loading={scope.loading}
            />
            {totalUnits !== undefined && (
              <MetricRow
                label="Total Units"
                value={totalUnits}
                loading={scope.loading}
              />
            )}
          </div>
        </div>
      </div>

      {/* How the book splits between the two lanes — the B2B/B2C cards the
          feed drops, kept as a share of all orders so they read together. */}
      <div>
        <p className="app-pane-label">
          Lanes
        </p>
        <div className="tw:mt-1.5 tw:space-y-2">
          {lanes.map((lane) => {
            const laneSummary = summaries[lane.key];
            const share = getShare(
              laneSummary.totalOrders,
              allOrders.totalOrders,
            );

            return (
              <button
                key={lane.key}
                type="button"
                onClick={() => onChannelChange(lane.key)}
                className={clsx(
                  "tw:w-full tw:cursor-pointer tw:rounded-xl tw:border tw:bg-white tw:p-3 tw:text-left tw:transition-colors",
                  lane.key === activeChannel
                    ? "tw:border-slate-900"
                    : "tw:border-slate-200 tw:hover:bg-slate-50",
                )}
              >
                <div className="tw:flex tw:items-baseline tw:justify-between tw:gap-2">
                  <span className="tw:flex tw:min-w-0 tw:items-center tw:gap-2">
                    <span
                      className={clsx(
                        "tw:h-2 tw:w-2 tw:shrink-0 tw:rounded-full",
                        lane.dotClass,
                      )}
                    />
                    <span className="tw:truncate tw:text-sm tw:font-semibold tw:text-slate-900">
                      {lane.shortLabel}
                    </span>
                  </span>
                  <span
                    className={clsx(
                      "tw:text-sm tw:font-bold tw:tabular-nums",
                      lane.numberClass,
                    )}
                  >
                    {laneSummary.loading ? (
                      <AppSpinner size="sm" />
                    ) : (
                      laneSummary.totalOrders
                    )}
                  </span>
                </div>

                <div className="tw:mt-2 tw:h-1 tw:overflow-hidden tw:rounded-full tw:bg-slate-100">
                  <div
                    className={clsx("tw:h-full tw:rounded-full", lane.barClass)}
                    style={{ width: `${share}%` }}
                  />
                </div>

                <div className="tw:mt-1.5 tw:flex tw:items-baseline tw:justify-between tw:gap-2 tw:text-xs tw:text-slate-500">
                  <span>{share}% of orders</span>
                  <span className="tw:font-medium tw:text-slate-700">
                    <Amount value={laneSummary.totalValue} />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrdersDashboardSidePane;
