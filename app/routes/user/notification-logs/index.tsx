import { redirect } from "react-router";
import { useTranslation } from "react-i18next";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import useTheme from "~/hooks/useTheme";
import AuthService from "~/services/AuthService";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import NotificationLogs from "~/shared/notifications/logs/NotificationLogs";
import ProfileSidePane from "~/shared/profile/components/ProfileSidePane";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import useScreenView from "~/hooks/useScreenView";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "dashboard",
    redirect: { path: "/dashboard" },
    langKey: "dashboard",
  },
  {
    label: "myProfile",
    redirect: { path: "/user/my-profile" },
    langKey: "myProfile",
  },
  {
    label: "notificationLogs",
    langKey: "notificationLogs",
  },
];

export const clientLoader = async () => {
  const userId = AuthService.getLoggedInUserId();
  if (!userId) {
    return redirect("/auth/login");
  }
  return null;
};

export const meta = () => {
  return [{ title: "Notification Logs" }];
};

const NotificationLogsPage = () => {
  const { t } = useTranslation(["common"]);
  const isTheme2 = useTheme() === "theme-2";
  const user = AuthService.getLoggedInUser();

  const { isMobile } = useScreenView();

  const userId = AuthService.getLoggedInUserId();
  const mobileNo = user?.mobile;
  const email = user?.email;

  const title = t("notificationLogs", "Notification Logs");

  return (
    <>
      {/* Notification logs is reached from My Profile, so the section rail and
          the mobile pill bar both keep that tab highlighted. */}
      <AppHeader
        title={title}
        subtitle="Everything we sent to this store"
        sectionKey="profile"
        activeTab="my-profile"
        mobileLead="menu"
      />

      <div className="app-page page-bg tw:p-3 tw:sm:p-4">
        <div className="app-container">
          {/* Profile section switcher — theme-2 mobile only (see theme-2.css);
              the desktop equivalent is the rail below. */}
          <SectionTabs
            sectionKey="profile"
            activeTab="my-profile"
            noShadow
            sticky
          />

          <div className="section-layout">
            {/* Desktop-only left rail — profile section menu. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="profile"
                  activeTab="my-profile"
                  title="Manage profile"
                />
              </div>
            </aside>

            <div className="section-content">
              <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
                {/* Full span: in theme-2 desktop the CSS lifts the side column
                    out of the grid into the fixed pane, so the main column
                    owns all 12. */}
                <AppPaneMain className="tw:lg:col-span-12">
                  {/* Theme-2 carries this context in the header and the pane,
                      and dropping it (rather than hiding it) keeps the tab
                      strip flush under the sticky section bar. */}
                  {!isTheme2 && <AppBreadcrumbs data={breadcrumbs} />}

                  {!userId || !mobileNo ? (
                    <div className="tw:py-12 tw:text-center tw:text-gray-500">
                      {t("userNotFound", "User not found")}
                    </div>
                  ) : (
                    <NotificationLogs
                      userId={userId}
                      mobileNo={mobileNo}
                      type="b2b"
                      email={email}
                      tabClassName={
                        isTheme2 && isMobile
                          ? "edge-tabs app-tabs-tray app-tabs-sticky"
                          : "subscribe-tabs-sticky barcode-tabs-pills"
                      }
                    />
                  )}
                </AppPaneMain>

                {/* Side column — only rendered inside the theme-2 split layout,
                    where the CSS re-homes it as the fixed profile pane. */}
                <AppPaneSide className="app-pane-only">
                  <ProfileSidePane />
                </AppPaneSide>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationLogsPage;
