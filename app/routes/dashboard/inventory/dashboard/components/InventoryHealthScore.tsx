import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppStatsCard from "~/components/core/stats-card/AppStatsCard";
import type { HealthScore } from "../helper";

const getScoreColor = (score: number) => {
  if (score >= 80) return "tw:text-green-600";
  if (score >= 60) return "tw:text-yellow-600";
  if (score >= 40) return "tw:text-orange-600";
  return "tw:text-red-600";
};

const healthInfo = (
  <div className="tw:text-xs tw:text-gray-700 tw:space-y-2 tw:max-w-[260px]">
    <p className="tw:font-semibold tw:text-gray-900">
      What is Inventory Health Score?
    </p>
    <p>
      A 0–100 score that shows the overall health of your stock. A higher score
      means your stock is selling well and your money is not stuck.
    </p>
    <div className="tw:space-y-1">
      <div className="tw:flex tw:items-center tw:gap-2">
        <span className="tw:w-2 tw:h-2 tw:rounded-full tw:bg-green-500" />
        <span>80 and above: Excellent</span>
      </div>
      <div className="tw:flex tw:items-center tw:gap-2">
        <span className="tw:w-2 tw:h-2 tw:rounded-full tw:bg-yellow-500" />
        <span>60–79: Good</span>
      </div>
      <div className="tw:flex tw:items-center tw:gap-2">
        <span className="tw:w-2 tw:h-2 tw:rounded-full tw:bg-orange-500" />
        <span>40–59: Average</span>
      </div>
      <div className="tw:flex tw:items-center tw:gap-2">
        <span className="tw:w-2 tw:h-2 tw:rounded-full tw:bg-red-500" />
        <span>Below 40: Poor</span>
      </div>
    </div>
    {/* <div className="tw:pt-2 tw:border-t tw:border-gray-200 tw:space-y-1">
      <p className="tw:font-semibold tw:text-gray-900">How is it calculated?</p>
      <p>
        Health Score = Fast Moving × 0.45 + SKU Movement × 0.20 + In Stock ×
        0.25 + (100 − Non Moving %) × 0.10
      </p>
    </div> */}
  </div>
);

const InventoryHealthScore = ({
  data,
  loading,
}: {
  data: HealthScore;
  loading: boolean;
}) => {
  return (
    <AppStatsCard
      template={2}
      label="Health Score"
      icon="activity"
      color="success"
      info={healthInfo}
    >
      {loading ? (
        <AppSpinner size="sm" />
      ) : (
        <span
          className={`tw:text-xl tw:font-bold ${getScoreColor(data.score)}`}
        >
          {data.score}
          <span className="tw:text-sm">%</span>
          {data.status && (
            <span className="tw:text-xs tw:font-medium tw:text-gray-400 tw:ml-1">
              {data.status}
            </span>
          )}
        </span>
      )}
    </AppStatsCard>
  );
};

export default InventoryHealthScore;
