import CommonService from "~/services/CommonService";
import PaymentBreakdown from "./components/PaymentBreakdown";
import RecentSales from "./components/recent-sales/RecentSales";

const Revenue = () => {
  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
      <PaymentBreakdown />
      <div className="tw:md:col-span-2">
        <RecentSales />
      </div>
    </div>
  );
};

export default Revenue;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Revenue"),
    },
  ];
}
