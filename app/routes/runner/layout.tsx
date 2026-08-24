import { Outlet } from "react-router";
import RunnerBottomTab from "~/shared/runner/bottom-tab/RunnerBottomTab";

/**
 * Runner app shell. Every runner screen scrolls inside this wrapper, which
 * reserves room for the tab bar; the bar itself lives here rather than on each
 * screen so it survives tab changes instead of remounting.
 *
 * The screens are phone-shaped, so they sit in a capped frame while the page
 * box around it stays full width and carries the tint out to the window edges.
 */
const RunnerLayout = () => {
  return (
    <div className="app-page page-bg runner-shell">
      <div className="runner-frame">
        <Outlet />
      </div>

      <RunnerBottomTab />
    </div>
  );
};

export default RunnerLayout;
