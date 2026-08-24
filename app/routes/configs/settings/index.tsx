import { ChevronRight, Image, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import ImgRender from "~/components/core/img/ImgRender";
import PageDescription from "~/components/core/page-description/PageDescription";
import Rbac from "~/components/core/rbac/Rbac";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import FranchiseService from "~/services/FranchiseService";
import PageAccessService from "~/services/PageAccessService";
import UserService from "~/services/UserService";
import { AppPaneMain } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import SettingsSidePane from "~/shared/settings/components/settings-side-pane/SettingsSidePane";
import { settingsSectionTabs } from "~/shared/settings/components/settings-side-pane/helper";
import {
  masterLoginAllowedSettings,
  settingsEntries,
} from "~/shared/settings/components/settings-side-pane/helper";

export async function clientLoader() {
  return PageAccessService.canAccessPage([
    "CONFIGS.DELIVERY-SLOT",
    "CONFIGS.PAYMENT-CONFIG",
    "CONFIGS.DELIVERY-CHARGE",
    "CONFIGS.ADVANCE-SETTINGS",
    "CONFIGS.PRICE-LABEL-PRINT",
  ]);
}

const defaultBreadcrumbs = [
  { label: "Dashboard", url: "/dashboard", langKey: "dashboard" },
  { label: "Configs", langKey: "configs" },
  { label: "Settings", langKey: "settings.title" },
];

const SettingsIndex = () => {
  const appNav = useAppNav();
  const { t } = useTranslation(["common"]);
  const appToast = useAppToast();

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (AuthService.isManpowerLoggedIn()) {
        const resp = await UserService.getUser(AuthService.getLoggedInUserId());
        const d = resp?.data?.data || {};
        const mapped = {
          image: d.profileImages?.[0],
          name: d.name,
          mobile: d.mobile,
          email: d.email,
          id: d.referenceId,
        };
        setUser(mapped);
      } else {
        const resp = await AuthService.getLoggedInFranchiseDetails();
        const d = FranchiseService.formatFranchise(resp?.data?.data || {});
        setUser({
          image: d?.approvedShopImage,
          name: d?.name,
          mobile: d?.mobile,
          email: d?.email,
          id: d?.franchiseId,
        });
      }
    };
    fetchUser();
  }, []);

  const handleCardClick = (route: string, key: string) => {
    if (AuthService.isMasterLogin()) {
      if (
        !AuthService.isMasterLoginWithFullAccess() &&
        !masterLoginAllowedSettings.includes(key)
      ) {
        appToast.show({
          msg: t("youAreNotAuthorizedToDoThisAction"),
          color: "danger",
        });
        return;
      }
    }
    appNav.to(route);
  };

  const handleViewProfile = () => {
    if (AuthService.isManpowerLoggedIn()) {
      appNav.to("/user/emp-profile");
      return;
    }
    appNav.to("/user/my-profile");
  };

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
            activeTab=""
            noShadow
            sticky
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
                  <div className="tw:flex tw:justify-between tw:items-center">
                    <AppBreadcrumbs data={defaultBreadcrumbs} />
                  </div>
                  <PageDescription description="settings" className="tw:mb-4" />

                  <AppCard>
                    <div className="tw:flex tw:gap-4">
                      <div className="tw:w-16 tw:h-16 tw:overflow-hidden tw:bg-gray-100 tw:p-2 tw:rounded-full tw:flex tw:items-center tw:justify-center">
                        {user?.image ? (
                          <ImgRender
                            assetId={user?.image}
                            alt="Shop"
                            className="tw:w-full tw:h-full tw:object-cover"
                          />
                        ) : (
                          <Image size={16} color="#9CA3AF" />
                        )}
                      </div>
                      <div className="tw:flex-1 tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:gap-4 tw:md:items-center">
                        <div>
                          <div className="tw:text-xl tw:font-bold tw:line-clamp-2 tw:mb-2">
                            {user?.name}
                          </div>
                          <div className="tw:flex tw:gap-2">
                            <span className="tw:text-sm tw:md:text-xs tw:text-gray-500">
                              ID: {user?.id}
                            </span>

                            {user?.mobile && (
                              <span className="tw:text-sm tw:md:text-xs tw:text-gray-500 tw:flex tw:items-center tw:gap-1">
                                <Phone size={12} />
                                {user?.mobile}
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <AppButton
                            onClick={handleViewProfile}
                            size="small"
                            color="primary"
                            className="tw:w-full tw:sm:w-auto"
                          >
                            View Profile
                          </AppButton>
                        </div>
                      </div>
                    </div>
                  </AppCard>

                  {/* The same destinations the side pane lists, as cards — the pane is
            desktop-only, so this grid is the menu everywhere else. */}
                  <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-6">
                    {settingsEntries.map((entry) => {
                      const Icon = entry.icon;
                      return (
                        <Rbac
                          roles={entry.rbac}
                          key={entry.key}
                          forceDisplay={AuthService.isMasterLogin()}
                        >
                          <div
                            className="tw:cursor-pointer tw:transition-all tw:duration-200 hover:tw:shadow-md hover:tw:scale-105"
                            onClick={() =>
                              handleCardClick(entry.path, entry.key)
                            }
                          >
                            <div className="tw:border tw:border-gray-200 tw:rounded-lg tw:p-4 tw:bg-white">
                              <div className="tw:flex tw:items-start tw:gap-4">
                                <span
                                  className={`tw:flex tw:size-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg ${entry.accent}`}
                                >
                                  <Icon className="tw:w-5 tw:h-5" />
                                </span>
                                <div className="tw:flex-1">
                                  <h3 className="tw:text-lg tw:font-semibold tw:text-gray-900 tw:mb-2">
                                    {t(entry.labelLangKey, {
                                      defaultValue: entry.label,
                                    })}
                                  </h3>
                                  <p className="tw:text-sm tw:text-gray-600 tw:mb-3">
                                    {t(entry.descriptionLangKey, {
                                      defaultValue: entry.description,
                                    })}
                                  </p>
                                  <div className="tw:flex tw:items-center tw:text-blue-600 tw:text-sm tw:font-medium">
                                    {t("settings.configureSettings")}
                                    <ChevronRight className="tw:ml-1 tw:w-4 tw:h-4" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Rbac>
                      );
                    })}
                  </div>
                </AppPaneMain>

                <SettingsSidePane />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsIndex;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Settings"),
    },
  ];
}
