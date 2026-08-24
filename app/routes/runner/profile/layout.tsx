import { Pencil } from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router";
import AppButton from "~/components/core/button/AppButton";
import AppTab from "~/components/core/tab/AppTab";
import RunnerHeader from "~/shared/runner/header/RunnerHeader";
import type { TabItem } from "~/types/CommonTypes";
import ProfileHero from "./components/profile-hero/ProfileHero";
import ProfileSummary from "./components/profile-summary/ProfileSummary";
import {
  DEFAULT_PROFILE_TAB,
  PROFILE_HEADER,
  PROFILE_TAB_PATHS,
  PROFILE_TABS,
} from "./helper";

/**
 * Runner profile shell. The identity block — masthead, hero and standing
 * record — belongs to the profile as a whole, so it lives here and each tab
 * renders only its own panel through the outlet. The active tab is read from
 * the path rather than held in state: a tab is a place the runner can be sent
 * to and can go back from.
 */
const RunnerProfileLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab =
    PROFILE_TABS.find(
      (tab) =>
        tab.key !== DEFAULT_PROFILE_TAB &&
        location.pathname.startsWith(PROFILE_TAB_PATHS[tab.key]),
    )?.key ?? DEFAULT_PROFILE_TAB;

  const onTabChange = (tab: TabItem) => {
    navigate(PROFILE_TAB_PATHS[tab.key]);
  };

  return (
    <>
      <RunnerHeader
        eyebrow={PROFILE_HEADER.eyebrow}
        statusLbl={PROFILE_HEADER.statusLbl}
        title={PROFILE_HEADER.title}
        subtitle={PROFILE_HEADER.subtitle}
      >
        <AppButton fill="clear" size="icon" className="runner-hero-icon-btn">
          <Pencil size={18} />
        </AppButton>
      </RunnerHeader>

      <section className="runner-hero">
        <div className="runner-hero-band">
          <div className="runner-hero-wash" />
          <ProfileHero />
        </div>

        <ProfileSummary />
      </section>

      {/* Panel switch. Sits on the page tint rather than on white: the panels
          under it are cards, so a white bar would fuse the two. */}
      <div className="runner-profile-tabs">
        <AppTab
          tabs={PROFILE_TABS}
          activeTab={activeTab}
          onTabChange={onTabChange}
          variant="pills"
          scrollable
          slideOffset={16}
        />
      </div>

      <Outlet />
    </>
  );
};

export default RunnerProfileLayout;
