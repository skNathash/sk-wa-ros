import useScreenView from "~/hooks/useScreenView";
import HighExposure from "./components/high-exposure/HighExposure";
import Insights from "./components/insights/Insights";
import LiveWallets from "./components/live-wallets/LiveWallets";
import OverduePanel from "./components/overdue-panel/OverduePanel";
import PortfolioHero from "./components/portfolio-hero/PortfolioHero";
import SummaryStats from "./components/summary-stats/SummaryStats";
import UnlockQueue from "./components/unlock-queue/UnlockQueue";

/**
 * PayLater analytics — the book read top to bottom: portfolio banner, the four
 * headline numbers, what's overdue and needs chasing, then the live wallets
 * beside the customers queued for a wallet.
 */
const Analytics = () => {
  const { isMobile } = useScreenView();

  return (
    <div className="tw:flex tw:flex-col tw:gap-4">
      <PortfolioHero />

      <SummaryStats />

      <OverduePanel />

      <Insights />

      {isMobile ? null : <HighExposure />}

      <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:lg:grid-cols-3 tw:items-start">
        <div className="tw:lg:col-span-2">
          <LiveWallets />
        </div>
        <UnlockQueue />
      </div>
    </div>
  );
};

export default Analytics;
