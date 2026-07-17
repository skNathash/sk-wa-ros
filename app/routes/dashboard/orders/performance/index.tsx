import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import OrderTabs from "../components/tabs/OrderTabs";
import AppHeader from "~/components/core/header/AppHeader";
import TopCustomers from "./components/customer/TopCustomers";
import TopRetailers from "./components/retailer/TopRetailers";
import AppChart from "~/components/core/chart/AppChart";
import AppCard from "~/components/core/card/AppCard";

const breadcrumbs = [
  {
    label: "Dashboard",
    to: "/dashboard",
  },
  {
    label: "Orders",
  },
];

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "#2563eb",
  },
  mobile: {
    label: "Mobile",
    color: "#60a5fa",
  },
};

const Performance = () => {
  return (
    <>
      <AppHeader title="Orders Management" showCart={true} />
      <div className="tw:p-4 app-page page-bg">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} />
          <div className="tw:mt-2 tw:text-sm tw:text-gray-500 tw:mb-4">
            Track all B2C and B2B sales performance and orders
          </div>
          <OrderTabs activeTab="performance" className="tw:mb-4" />

          <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
            <AppCard
              title="Orders Performance"
              icon="chart-bar"
              className="tw:col-span-2"
            >
              <AppChart
                config={chartConfig}
                data={chartData}
                className="tw:h-[200px] tw:w-full"
                xAxisDataKey="month"
              />
            </AppCard>
            <TopCustomers />
            <TopRetailers />
          </div>
        </div>
      </div>
    </>
  );
};

export default Performance;
