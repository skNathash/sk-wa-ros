import { format, sub } from "date-fns";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppDateInput from "~/components/core/form/AppDateInput";
import AppHeader from "~/components/core/header/AppHeader";
import useAppNav from "~/hooks/useAppNav";
import OrderTabs from "../components/tabs/OrderTabs";
import Attention from "./components/Attention";
import OrderTypeAnalytics from "./components/OrderTypeAnalytics";
import Performance from "./components/Performance";
import RevenueStatus from "./components/RevenueStatus";
import Summary from "./components/Summary";

const breadcrumbs = [
  {
    label: "Dashboard",
    to: "/dashboard",
  },
  {
    label: "Orders",
  },
];

const last90Days = sub(new Date(), { days: 90 });

const OrdersAnalytics = () => {
  const { replace } = useAppNav();
  const [searchParams] = useSearchParams();

  const fromDate = searchParams.get("from")
    ? new Date(searchParams.get("from") as string)
    : last90Days;
  const toDate = searchParams.get("to")
    ? new Date(searchParams.get("to") as string)
    : new Date();

  // Handles date change and updates query params
  const handleDateChange = (val: any) => {
    if (val && Array.isArray(val) && val.length === 2) {
      replace("/dashboard/orders/analytics", {
        from: format(val[0], "yyyy-MM-dd"),
        to: format(val[1], "yyyy-MM-dd"),
      });
    }
  };

  return (
    <>
      <AppHeader title="Orders Management" showCart={true} />
      <div className="tw:p-4 app-page page-bg">
        <div className="app-container">
          <div className="tw:mb-4 tw:flex tw:flex-col tw:md:flex-row tw:md:items-center tw:md:justify-between tw:gap-2">
            <div className="tw:flex-1">
              <AppBreadcrumbs data={breadcrumbs} />
              <div className="tw:mt-2 tw:text-sm tw:text-gray-500">
                Track all B2C and B2B sales performance and orders
              </div>
            </div>
            <div className="tw:w-full tw:md:w-auto tw:mt-2 tw:md:mt-0">
              <AppDateInput
                value={[fromDate, toDate]}
                callback={handleDateChange}
                size="sm"
                className="tw:min-w-[240px]"
                placeholder="Select date"
                dateConfig={{ mode: "range" }}
                inputClassName="tw:bg-white"
                hideClose={true}
              />
            </div>
          </div>

          <OrderTabs activeTab="analytics" className="tw:mb-4" />
          <Summary
            from={format(fromDate, "yyyy-MM-dd")}
            to={format(toDate, "yyyy-MM-dd")}
          />
          <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
            <OrderTypeAnalytics />
            <Performance />
            <RevenueStatus />
          </div>
          <Attention />
        </div>
      </div>
    </>
  );
};

export default OrdersAnalytics;
