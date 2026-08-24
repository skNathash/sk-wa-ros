import FyStats from "./components/fy-stats/FyStats";
// import RunwayReinvestment from "./components/runway-reinvestment/RunwayReinvestment";
import ThreeYearStory from "./components/three-year-story/ThreeYearStory";

/**
 * "FY view" — the year that closed against the year being forecast and the
 * three-year arc that explains the jump.
 *
 * Runway & reinvestment is parked: the API does not serve `type=runway`, so the
 * tab leaves that block out rather than show numbers the ledgers cannot back.
 * The component files are kept in git so they can be revived once a real cash
 * position (wallet + bank + till) is available.
 *
 * Every block owns its own data through its `helper.ts`; the tab only lays them
 * out.
 */
const FyView = () => (
  <>
    <FyStats />

    <ThreeYearStory />

    {/* Runway & reinvestment is parked — see the comment above. */}
    {/* <RunwayReinvestment /> */}
  </>
);

export default FyView;
