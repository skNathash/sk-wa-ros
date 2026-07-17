import Collect from "./components/collect/Collect";
import Overdue from "./components/Overdue";
import Summary from "./components/Summary";
import TopCreditLimit from "./components/TopCreditLimit";
import TopOutStandingBalance from "./components/TopOutStandingBalance";

const Analytics = () => {
  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4 tw:mb-4">
        <Overdue type="today" />
        <Overdue type="tomorrow" />
      </div>

      <Summary />

      <Collect />

      <div className="tw:hidden">
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-4 tw:gap-4">
          <TopCreditLimit title="Top B2C Credit Limit" type="b2c" />
          <TopCreditLimit title="Top B2B Credit Limit" type="b2b" />
          <TopOutStandingBalance
            title="Top B2C Outstanding Balance"
            type="b2c"
          />
          <TopOutStandingBalance
            title="Top B2B Outstanding Balance"
            type="b2b"
          />
        </div>
      </div>
    </>
  );
};

export default Analytics;
