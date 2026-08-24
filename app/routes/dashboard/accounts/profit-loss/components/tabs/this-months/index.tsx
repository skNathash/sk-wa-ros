import { useCallback } from "react";
import useAppNav from "~/hooks/useAppNav";
import Insights from "./components/insights/Insights";
import LineByLine from "./components/line-by-line/LineByLine";
import NetProfitHero from "./components/net-profit-hero/NetProfitHero";
import OsImpact from "./components/os-impact/OsImpact";
import ProfitDrivers from "./components/profit-drivers/ProfitDrivers";
import ProfitLeaks from "./components/profit-leaks/ProfitLeaks";
import ProfitWaterfall from "./components/profit-waterfall/ProfitWaterfall";
import TrailingMonths from "./components/trailing-months/TrailingMonths";

/**
 * "This month" — the P&L read top-down: the number the month is judged on,
 * where it sits against the last twelve, how it was made, every line of it
 * against two other periods, what the platform contributed, which categories
 * earned and which costs leaked, and finally the findings worth acting on.
 *
 * Every block owns its own data through its `helper.ts`; the tab only lays them
 * out and handles the actions blocks raise.
 */
const ThisMonth = () => {
  const appNav = useAppNav();

  const handleOsImpactCallback = useCallback(
    (payload: { action: string }) => {
      if (payload.action === "breakdown") {
        appNav.to("/dashboard/accounts/platform-fee/benefits");
      }
    },
    [appNav],
  );

  return (
    <>
      <NetProfitHero />

      <TrailingMonths />

      {/* The ladder and the line-by-line are the same month told two ways, so
          they sit side by side from md up. */}
      <div className="tw:mb-3 tw:grid tw:grid-cols-1 tw:gap-3 tw:md:grid-cols-2">
        <ProfitWaterfall />
        <LineByLine />
      </div>

      <OsImpact callback={handleOsImpactCallback} />

      <div className="tw:mb-3 tw:grid tw:grid-cols-1 tw:gap-3 tw:md:grid-cols-2">
        <ProfitDrivers />
        <ProfitLeaks />
      </div>

      <Insights />
    </>
  );
};

export default ThisMonth;
