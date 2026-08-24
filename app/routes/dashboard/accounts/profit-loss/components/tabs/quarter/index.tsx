import QuarterOverQuarter from "./components/quarter-over-quarter/QuarterOverQuarter";
import QuarterStats from "./components/quarter-stats/QuarterStats";
import SeasonalityHeatmap from "./components/seasonality-heatmap/SeasonalityHeatmap";

/**
 * "Quarter" — the same P&L pulled back a step: where the quarter stands, how it
 * compares with the three before it, and what the shop's year looks like month
 * by month once two years of margin are laid side by side.
 *
 * Every block owns its own data through its `helper.ts`; the tab only lays them
 * out.
 */
const Quarter = () => (
  <>
    <QuarterStats />

    <QuarterOverQuarter />

    <SeasonalityHeatmap />
  </>
);

export default Quarter;
