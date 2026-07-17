import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppStatsCard from "~/components/core/stats-card/AppStatsCard";
import type { RiskInsights } from "../helper";

const RiskTile = ({
  count,
  label,
  icon,
  color,
  loading,
  info,
}: {
  count: number;
  label: string;
  icon: string;
  color: "primary" | "warning" | "danger";
  loading: boolean;
  info: string;
}) => (
  <AppStatsCard
    template={2}
    label={label}
    icon={icon}
    color={color}
    info={
      <p className="tw:text-xs tw:text-gray-600 tw:max-w-[220px]">{info}</p>
    }
  >
    {loading ? (
      <AppSpinner size="sm" />
    ) : (
      <span className="tw:text-xl tw:font-bold">
        {count}
        <span className="tw:text-xs tw:font-medium tw:text-gray-400 tw:ml-1">
          SKUs
        </span>
      </span>
    )}
  </AppStatsCard>
);

const ReorderRiskInsights = ({
  data,
  loading,
}: {
  data: RiskInsights;
  loading: boolean;
}) => {
  return (
    <>
      <RiskTile
        count={data.reorderRequired}
        label="Reorder Required"
        icon="refresh-cw"
        color="primary"
        loading={loading}
        info="Items that are selling but low in stock. Buy them again soon so you don't run out."
      />
      <RiskTile
        count={data.overstocked}
        label="Overstocked"
        icon="layers"
        color="warning"
        loading={loading}
        info="Items with too much stock and no sales for a long time. They take up space and lock up your money."
      />
      <RiskTile
        count={data.expiryRisk}
        label="Near Expiry"
        icon="calendar-clock"
        color="danger"
        loading={loading}
        info="Items that will expire soon. Sell them fast or you may have to throw them away."
      />
    </>
  );
};

export default ReorderRiskInsights;
