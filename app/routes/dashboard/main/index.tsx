import { useSearchParams } from "react-router";
import AppHeader from "~/components/core/header/AppHeader";
import useAppNav from "~/hooks/useAppNav";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import type { SectionTab } from "~/types/CommonTypes";
import AllModules from "./components/all-modules/AllModules";
import BrightStoreJourney from "./components/bright-store-journey/BrightStoreJourney";
import GreetingHeader from "./components/greeting-header/GreetingHeader";
import HomeSidePane from "./components/home-side-pane/HomeSidePane";
import Milestones from "./components/milestones/Milestones";
import NeighborhoodSignals from "./components/neighborhood-signals/NeighborhoodSignals";
import TeamOnShift from "./components/team-on-shift/TeamOnShift";
import TodayLive from "./components/today-live/TodayLive";
import WhatsappContainer from "./components/whatsapp-container/WhatsappContainer";

/**
 * Section-menu key → id of the block it scrolls to. Keys absent here (Journey,
 * Modules, Settings) are real routes and navigate through their redirect
 * instead.
 */
const VIEW_ANCHORS: Record<string, string> = {
  today: "home-today",
  team: "home-team",
  awards: "home-awards",
  signals: "home-signals",
};

const DEFAULT_VIEW = "today";

/**
 * Home dashboard ("main"). Mobile is the Sathi chat and nothing else; desktop
 * puts the dashboard feed in the main column with the same chat re-homed as
 * the fixed side pane, and the Home section rail on the left.
 *
 * The rail's entries are blocks of this one page rather than separate routes
 * (see the `home` section in SectionTabService), so selecting one scrolls to
 * the block and records it in `?view=` instead of navigating.
 */
const DashboardMain = () => {
  const appNav = useAppNav();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeView = searchParams.get("view") || DEFAULT_VIEW;

  const handleSectionSelect = (tab: SectionTab) => {
    const anchor = VIEW_ANCHORS[tab.key];
    // Journey and Settings (and anything else added later that lives on its own
    // route) still navigate the normal way.
    if (!anchor) {
      if (tab.redirect) appNav.to(tab.redirect.url, tab.redirect.params);
      return;
    }

    setSearchParams(
      (params) => {
        params.set("view", tab.key);
        return params;
      },
      { replace: true, preventScrollReset: true },
    );
    document
      .getElementById(anchor)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      {/* Home is a top-level landing, so mobile leads with the hamburger
          instead of a back arrow; `sectionKey` also turns the title into the
          tappable section dropdown there. */}
      <AppHeader
        title="Home"
        sectionKey="home"
        activeTab={activeView}
        mobileLead="menu"
      />

      {/* `app-home` scopes every rule in dashboard-home.css — including the
          ones for the chat pane, which the theme lifts out of the grid but
          leaves inside this subtree. */}
      <div className="app-home">
        {/* Mobile / tablet: the chat is the whole screen — no page gutter, so
            it can fill the viewport under the header. */}
        <div className="tw:lg:hidden">
          <WhatsappContainer />
        </div>

        <div className="app-page page-bg page-bg-muted tw:p-4 tw:max-lg:hidden">
          <div className="app-container">
            <div className="section-layout">
              {/* Desktop-only left rail — Home section menu. */}
              <aside className="section-menu-aside">
                <div className="tw:sticky tw:top-20">
                  <SectionMenu
                    sectionKey="home"
                    activeTab={activeView}
                    onSelect={handleSectionSelect}
                    title="Home"
                  />
                </div>
              </aside>

              <div className="section-content">
                <div className="tw:grid tw:grid-cols-12 tw:items-start tw:gap-4">
                  {/* Main column spans the full grid — the side pane only
                      exists in theme-2 desktop, where the CSS lifts it out of
                      the grid into the fixed pane (see AppPane). */}
                  <AppPaneMain className="tw:lg:col-span-12">
                    {/* Greeting, then the journey hero, then the live tiles —
                        the day's headline before the day's numbers. */}
                    <section id="home-today" className="tw:scroll-mt-20">
                      <GreetingHeader />
                    </section>

                    {/* No anchor id: the rail's Journey entry opens the full
                        map route rather than scrolling to this hero. */}
                    <section className="tw:scroll-mt-20">
                      <BrightStoreJourney />
                    </section>

                    <section className="tw:scroll-mt-20">
                      <TodayLive />
                    </section>

                    <section id="home-modules" className="tw:scroll-mt-20">
                      <AllModules />
                    </section>

                    {/* Ambient row — three peripheral panels that share one
                        band; each is still its own rail target. */}
                    <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:lg:grid-cols-3">
                      <div id="home-team" className="tw:scroll-mt-20">
                        <TeamOnShift />
                      </div>
                      <div id="home-signals" className="tw:scroll-mt-20">
                        <NeighborhoodSignals />
                      </div>
                      <div id="home-awards" className="tw:scroll-mt-20">
                        <Milestones />
                      </div>
                    </div>
                  </AppPaneMain>

                  {/* Side pane — the Sathi chat, and nothing else. In theme-2
                      the CSS lifts it out of the grid into the fixed pane
                      beside the icon rail (the screenshot layout); in the
                      other themes it stays the 3/12 column. No `app-pane-only`
                      here: the chat is the desktop's home screen either way,
                      so it must not blank out when the theme isn't theme-2. */}
                  <AppPaneSide className="home-chat-pane">
                    <HomeSidePane />
                  </AppPaneSide>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardMain;
