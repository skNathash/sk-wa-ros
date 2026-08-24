import { useTranslation } from "react-i18next";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import { AppPaneMain } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import SettingsSidePane from "~/shared/settings/components/settings-side-pane/SettingsSidePane";
import { settingsSectionTabs } from "~/shared/settings/components/settings-side-pane/helper";
import PageDescription from "~/components/core/page-description/PageDescription";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import AcceptPreOrderConfig from "../AcceptPreOrderConfig";
import ShowOnlinePriceOnAppConfig from "../ShowOnlinePriceOnAppConfig";
import ShowUnsubscribedDealsConfig from "../ShowUnsubscribedDealsConfig";
import MinCart from "./components/min-cart/MinCart";
import OtpConfig from "./components/otp-config/OtpConfig";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["CONFIGS.ADVANCE-SETTINGS"]);
}

const defaultBreadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    redirect: {
      path: "/dashboard",
    },
    langKey: "dashboard",
  },
  {
    label: "Configs",
    langKey: "configs",
    redirect: {
      path: "/configs/settings",
    },
  },
  { label: "Others", langKey: "settings.others" },
];

const OthersSettings = () => {
  const { t } = useTranslation(["common"]);

  return (
    <>
      <AppHeader
        title={t("settings.title")}
        sectionKey="profile"
        activeTab="settings"
        mobileLead="menu"
      />

      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          {/* Settings menu on mobile — theme-2 only (see theme-2.css); the
              desktop equivalent is the side pane below. */}
          <SectionTabs
            tabs={settingsSectionTabs}
            activeTab={"advanced-setting"}
            noShadow
            sticky
            outerClassName="section-menu-gap"
          />

          <div className="section-layout">
            {/* Desktop-only left rail. Settings is a tab of the Profile
                section, so the rail keeps listing the profile entries with
                "Settings" highlighted; moving between the individual config
                pages is the side pane's job. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="profile"
                  activeTab="settings"
                  title={t("settings.title")}
                />
              </div>
            </aside>

            <div className="section-content">
              <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
                {/* Full span: in theme-2 desktop the pane is lifted out of the
                    grid, so the main column owns all 12 columns. */}
                <AppPaneMain className="tw:lg:col-span-12">
                  <AppBreadcrumbs data={defaultBreadcrumbs} />
                  <PageDescription
                    description="settings.others"
                    className="tw:mb-4"
                  />
                  <MinCart />

                  <OtpConfig />

                  <AcceptPreOrderConfig />
                  <ShowUnsubscribedDealsConfig />
                  <ShowOnlinePriceOnAppConfig />
                </AppPaneMain>

                <SettingsSidePane activeKey="advanced-setting" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OthersSettings;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Other Settings"),
    },
  ];
}
