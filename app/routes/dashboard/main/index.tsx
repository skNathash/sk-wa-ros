import AppHeader from "~/components/core/header/AppHeader";
import ActivityFeed from "./components/ActivityFeed";
import BrightStoreJourney from "./components/BrightStoreJourney";
import DashboardHeading from "./components/DashboardHeading";
import InviteToClub from "./components/InviteToClub";
import NeedsAttention from "./components/NeedsAttention";
import QuickActions from "./components/QuickActions";
import RecentPurchaseOrders from "./components/RecentPurchaseOrders";
import SalesTrendChart from "./components/SalesTrendChart";
import StatTiles from "./components/StatTiles";
import TodaySalesCard from "./components/TodaySalesCard";
import TopSellers from "./components/TopSellers";

/**
 * Home dashboard ("main") page. Static UI for now — mobile shows a compact
 * single-column feed, desktop expands into a three-column dashboard.
 */
const DashboardMain = () => {
  return (
    <>
      <AppHeader title="Home" />
      <div className="app-page page-bg page-bg-muted tw:p-4">
        <div className="app-container">
          <DashboardHeading />

          {/* Mobile / tablet: single-column feed */}
          <div className="tw:space-y-4 tw:lg:hidden">
            <BrightStoreJourney />
            <TodaySalesCard variant="light" />
            <div>
              <div className="tw:mb-2 tw:flex tw:justify-center">
                <span className="tw:rounded-full tw:bg-slate-200/70 tw:px-3 tw:py-1 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-500">
                  Today's activity
                </span>
              </div>
              <ActivityFeed withHeading={false} />
            </div>
          </div>

          {/* Desktop: three-column dashboard */}
          <div className="tw:hidden tw:grid-cols-12 tw:gap-4 tw:lg:grid">
            {/* Left rail */}
            <div className="tw:col-span-3 tw:space-y-4">
              <BrightStoreJourney />
              <TodaySalesCard variant="dark" />
              <InviteToClub />
              <QuickActions />
            </div>

            {/* Center */}
            <div className="tw:col-span-6 tw:space-y-4">
              <StatTiles />
              <SalesTrendChart />
              <TopSellers />
              <RecentPurchaseOrders />
            </div>

            {/* Right rail */}
            <div className="tw:col-span-3 tw:space-y-4">
              <NeedsAttention />
              <ActivityFeed />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardMain;
