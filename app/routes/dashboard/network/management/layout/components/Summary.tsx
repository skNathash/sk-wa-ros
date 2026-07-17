import AppStatsCard from "~/components/core/stats-card/AppStatsCard";

const Summary = () => {
  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-4 tw:gap-4 tw:mb-4">
      <AppStatsCard
        label="B2C Customer"
        color="warning"
        icon="users"
        template={2}
      >
        <span className="tw:text-2xl tw:font-bold tw:mb-1">36/36</span>
        <div className="tw:text-xs tw:text-gray-500 tw:mb-0.5">
          Active/Inactive
        </div>
        <div className="tw:text-xs tw:text-green-500">+12.5%</div>
      </AppStatsCard>

      <AppStatsCard
        label="B2B Retailers"
        color="primary"
        icon="building-2"
        template={2}
      >
        <span className="tw:text-2xl tw:font-bold tw:mb-1">36/36</span>
        <div className="tw:text-xs tw:text-gray-500 tw:mb-0.5">
          Active/Inactive
        </div>
        <div className="tw:text-xs tw:text-green-500">+12.5%</div>
      </AppStatsCard>

      <AppStatsCard
        label="B2C Revenue"
        color="success"
        icon="indian-rupee"
        template={2}
      >
        <span className="tw:text-2xl tw:font-bold tw:mb-1">36/36</span>
        <div className="tw:text-xs tw:text-gray-500 tw:mb-0.5">
          Active/Inactive
        </div>
        <div className="tw:text-xs tw:text-green-500">+12.5%</div>
      </AppStatsCard>

      <AppStatsCard
        label="B2B Revenue"
        color="primary"
        icon="trending-up"
        template={2}
      >
        <span className="tw:text-2xl tw:font-bold tw:mb-1">36/36</span>
        <div className="tw:text-xs tw:text-gray-500 tw:mb-0.5">
          Active/Inactive
        </div>
        <div className="tw:text-xs tw:text-green-500">+12.5%</div>
      </AppStatsCard>
    </div>
  );
};

export default Summary;
