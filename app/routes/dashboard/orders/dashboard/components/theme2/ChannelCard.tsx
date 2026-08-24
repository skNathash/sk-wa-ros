import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";

/**
 * Theme-2 channel overview card — the "lane" tile from the Analytics design:
 * a colour-dotted mono eyebrow, the order count as the lead figure, and the
 * two supporting figures (customers / value) on a footer rule.
 *
 * Carries exactly the same three numbers as the theme-1 `OverviewSummary`
 * card; only the arrangement changes.
 */
type Props = {
  title: string;
  totalOrders: number;
  uniqueCustomers: number;
  value: number;
  /** Lane colour — the dot beside the eyebrow and the count. */
  dotClass?: string;
  numberClass?: string;
  icon?: React.ReactNode;
  loading?: boolean;
};

const ChannelCard: React.FC<Props> = ({
  title,
  totalOrders,
  uniqueCustomers,
  value,
  dotClass = "tw:bg-teal-600",
  numberClass = "tw:text-gray-900",
  icon,
  loading = false,
}) => (
  <div className="tw:rounded-2xl tw:border tw:border-gray-200 tw:bg-white tw:p-4">
    <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
      <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-2">
        <span
          className={`tw:h-2 tw:w-2 tw:shrink-0 tw:rounded-full ${dotClass}`}
        />
        <span className="tw:truncate tw:font-mono tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-gray-500">
          {title}
        </span>
      </div>
      {icon && (
        <span className="tw:shrink-0 tw:text-gray-300 [&>svg]:tw:h-4 [&>svg]:tw:w-4">
          {icon}
        </span>
      )}
    </div>

    <div className="tw:mt-3 tw:flex tw:items-baseline tw:gap-2">
      <span
        className={`tw:text-3xl tw:font-bold tw:leading-none app-amount ${numberClass}`}
      >
        {loading ? <AppSpinner size="sm" /> : totalOrders}
      </span>
      <span className="tw:text-xs tw:text-gray-500">Total Orders</span>
    </div>

    <div className="tw:mt-3 tw:grid tw:grid-cols-2 tw:gap-2 tw:border-t tw:border-gray-100 tw:pt-2.5">
      <div>
        <div className="tw:font-mono tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-gray-500">
          Customers
        </div>
        <div className="tw:mt-0.5 tw:text-sm tw:font-semibold tw:text-gray-900 app-amount">
          {loading ? <AppSpinner size="sm" /> : uniqueCustomers}
        </div>
      </div>
      <div className="tw:text-right">
        <div className="tw:font-mono tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-gray-500">
          Total Value
        </div>
        <div className="tw:mt-0.5 tw:text-sm tw:font-semibold tw:text-gray-900">
          {loading ? <AppSpinner size="sm" /> : <Amount value={value} />}
        </div>
      </div>
    </div>
  </div>
);

export default ChannelCard;
