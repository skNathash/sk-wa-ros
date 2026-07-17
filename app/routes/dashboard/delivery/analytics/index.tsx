import Summary from "./components/Summary";
import TopDeliveries from "./components/top-deliveries/TopDeliveries";

export default function Analytics() {
  return (
    <>
      <Summary />
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-6 tw:mt-6">
        <div>
          <TopDeliveries type="own" />
        </div>
        <div>
          <TopDeliveries type="courier" />
        </div>
      </div>
    </>
  );
}
