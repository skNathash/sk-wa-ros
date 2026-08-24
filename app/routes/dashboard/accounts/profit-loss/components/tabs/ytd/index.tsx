import FyForecast from "./components/fy-forecast/FyForecast";
import YearComparison from "./components/year-comparison/YearComparison";
import YtdHero from "./components/ytd-hero/YtdHero";

/**
 * "YTD" — the financial year so far: what it has kept, how each line of the
 * P&L reads against the same months last year, and where the year lands if the
 * current pace holds.
 *
 * Every block owns its own data through its `helper.ts`; the tab only lays them
 * out.
 */
const Ytd = () => (
  <>
    <YtdHero />

    <YearComparison />

    <FyForecast />
  </>
);

export default Ytd;
