import RecentCustomerActivity from "./components/recent-customer-activity/RecentCustomerActivity";
import RecentRetailerActivity from "./components/recent-retailer-activity/RecentRetailerActivity";

const NetworkManagementOverview = () => {
  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
        <RecentCustomerActivity />
        <RecentRetailerActivity />
      </div>
    </>
  );
};

export default NetworkManagementOverview;
