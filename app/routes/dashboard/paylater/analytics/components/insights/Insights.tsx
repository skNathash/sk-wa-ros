import AgingBuckets from "./components/AgingBuckets";
import CashFlowChart from "./components/CashFlow";

/**
 * PayLater insights row — the aging split of the outstanding book beside the
 * weekly issued-vs-recovered cash flow. Each card fetches its own slice of the
 * insights dashboard endpoint.
 */
const Insights = () => {
  return (
    <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:lg:grid-cols-5 tw:items-stretch">
      <div className="tw:lg:col-span-2">
        <AgingBuckets />
      </div>
      <div className="tw:lg:col-span-3">
        <CashFlowChart />
      </div>
    </div>
  );
};

export default Insights;
