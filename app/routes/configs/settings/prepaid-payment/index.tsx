import { produce } from "immer";
import {
  Building,
  Plus,
  Settings,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppSwitch from "~/components/core/form/AppSwitch";
import AppHeader from "~/components/core/header/AppHeader";
import { AppPaneMain } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import SettingsSidePane from "~/shared/settings/components/settings-side-pane/SettingsSidePane";
import { settingsSectionTabs } from "~/shared/settings/components/settings-side-pane/helper";
import NoData from "~/components/core/no-data/NoData";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import { useIsMobile } from "~/hooks/use-mobile";
import useTheme from "~/hooks/useTheme";
import RemarksModal from "~/modals/feature/remarks/RemarksModal";
import AuthService from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";
import UserPaymentConfigModal from "~/shared/configs/modals/user-payment-config/UserPaymentConfigModal";
import type { BreadcrumbItem, TabItem } from "~/types/CommonTypes";
import SpecificUsers from "./components/customers/SpecificUsers";
import UserSearchModal from "./modals/UserSearchModal";
import ActivityLog from "./components/audit-log/ActivityLog";

const defaultBreadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    redirect: { path: "/dashboard" },
    langKey: "dashboard",
  },
  {
    label: "Configs",
    redirect: { path: "/configs/settings" },
    langKey: "configs",
  },
  { label: "Prepaid Payment" },
];

const tabItems: TabItem[] = [
  {
    name: "B2C Payment",
    key: "b2c",
    icon: <User />,
  },
  {
    name: "B2B Payment",
    key: "b2b",
    icon: <Building />,
  },
  {
    name: "Logs",
    key: "logs",
    icon: <Settings />,
  },
];

const defaultGlobalSettings = [
  {
    label: "Enable Prepaid Payment",
    key: "prepaid",
    icon: <Wallet />,
    description: "Enable Prepaid payment for all users",
    value: false,
    showToggle: true,
    apiKey: "prepaidEnabled",
  },
];

const PrepaidPayment = () => {
  const appNav = useAppNav();
  const isMobile = useIsMobile();
  // theme-2 reads sub-navs as free-standing pills, not the grey segmented bar.
  const isTheme2 = useTheme() === "theme-2";

  const { show: showToast } = useAppToast();
  const [activeTab, setActiveTab] = useState("b2c");

  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const [userSearchModal, setUserSearchModal] = useState({
    show: false,
    data: null,
  });

  const [globalSettings, setGlobalSettings] = useState([
    ...defaultGlobalSettings,
  ]);

  const [specificCustomers, setSpecificCustomers] = useState<any[]>([]);

  const [userPaymentModal, setUserPaymentModal] = useState<{
    show: boolean;
    userId?: string | null;
  }>({ show: false, userId: null });

  const [showRemarksModal, setShowRemarksModal] = useState<boolean>(false);
  const [selectedRemoveUser, setSelectedRemoveUser] = useState<any>(null);

  const [busyloader, setBusyloader] = useState({
    loading: false,
    msg: "",
  });

  const currentConfigRef = useRef<any>(null);

  useEffect(() => {
    // The logs tab renders its own data — no payment config to load for it.
    if (activeTab === "logs") return;
    fetchPaymentConfig();
  }, [activeTab]);

  const fetchPaymentConfig = async () => {
    let params = {
      filter: {
        businessType: activeTab === "b2c" ? "B2C" : "B2B",
      },
    };

    setLoading(true);

    const res = await FranchiseService.getPaymentConfig(params);

    currentConfigRef.current = res?.data?.data?.[0] || {};
    setSpecificCustomers(currentConfigRef.current?.specificCustomers || []);

    const pcResp = await FranchiseService.getConfigs({});
    const paymentConfig = pcResp?.data?.data?.[0]?.paymentMethodConfig || [];

    setGlobalSettings(
      produce((draft) => {
        draft.forEach((setting) => {
          // Coerce: an unset key comes back undefined, which would both skip
          // the "at least one enabled" guard and go into the payload as-is.
          setting.value =
            !!currentConfigRef.current?.overallCustomers?.[setting.apiKey];

          if (setting.key === "prepaid") {
            setting.showToggle = paymentConfig.length > 0;
          }
        });
      }),
    );
    setLoading(false);
  };

  const onTabChange = (tab: TabItem) => {
    setActiveTab(tab.key);
  };

  const handleSwitchChange = async (key: string, value: boolean) => {
    const setting = globalSettings.find((setting) => setting.key === key);

    if (!setting) {
      showToast({
        msg: "Setting not found",
        color: "error",
      });
      return;
    }

    if (!value) {
      const otherEnabled = globalSettings.some(
        (s) => s.key !== key && s.value === true,
      );

      if (!otherEnabled) {
        showToast({
          msg: "At least one payment option must be enabled",
          color: "error",
        });
        return;
      }
    }

    let payments: Record<string, boolean> = {};
    globalSettings.forEach((s) => {
      payments[s.apiKey] = s.value;
    });

    const payload = {
      businessType: activeTab === "b2c" ? "B2C" : "B2B",
      isActive: true,
      overallCustomers: {
        ...currentConfigRef.current?.overallCustomers,
        ...payments,
        [setting?.apiKey as string]: value,
      },
      networkCustomers: {
        ...currentConfigRef.current?.networkCustomers,
        ...payments,
        [setting?.apiKey as string]: value,
      },
    };

    setBusyloader({ loading: true, msg: "Updating global settings..." });
    const res = await FranchiseService.createPaymentConfig(payload);
    setBusyloader({ loading: false, msg: "" });

    if (res?.statusCode === 200 || res?.statusCode === 201) {
      showToast({
        msg: "Global settings updated successfully",
        color: "success",
      });

      // Update ref to keep it in sync with latest successful state
      currentConfigRef.current = {
        ...currentConfigRef.current,
        overallCustomers: payload.overallCustomers,
        networkCustomers: payload.networkCustomers,
      };

      setGlobalSettings(
        produce((draft) => {
          const i = draft.findIndex((s) => s.key === key);
          if (i !== -1) {
            draft[i].value = value;
          }
        }),
      );
    } else {
      showToast({
        msg: res?.data?.message || "Failed to update global settings",
        color: "error",
      });
    }
  };

  const handleConfigureNow = () => {
    appNav.to("/configs/settings/payment-config");
  };

  const handleAddUser = () => {
    setUserSearchModal({ show: true, data: null });
  };

  const handleUserSearchModalCallback = async (params: {
    action: string;
    data?: any;
  }) => {
    setUserSearchModal({ show: false, data: null });

    if (params?.action === "saved") {
      await fetchPaymentConfig();
    }
  };

  const handleUserCallback = (args: { action: string; data?: any }) => {
    // handle edit action from SpecificUsers
    if (args?.action === "edit") {
      const item = args.data || {};
      const id = item.buyerId || item._id || item.id;
      setUserPaymentModal({ show: true, userId: id });
      return;
    }
    if (args?.action === "delete" || args?.action === "remove") {
      // open remarks modal to confirm removal
      setSelectedRemoveUser(args.data || null);
      setShowRemarksModal(true);
    }
  };

  const handleRemarksModalCallback = async (payload: {
    action: string;
    remarks?: string;
  }) => {
    if (payload?.action === "close") {
      setShowRemarksModal(false);
      setSelectedRemoveUser(null);
      return;
    }

    if (payload?.action === "submit") {
      const remarks = payload.remarks || "";
      const user = selectedRemoveUser || {};
      const buyerId = user.buyerId || user._id || user.id || null;
      if (!buyerId) {
        showToast({ msg: "Invalid user", color: "error" });
        setShowRemarksModal(false);
        setSelectedRemoveUser(null);
        return;
      }

      setBusyloader({ loading: true, msg: "Removing user..." });

      try {
        const res = await FranchiseService.removePaymentConfigUser({
          buyerId,
          remarks,
          businessType: activeTab === "b2c" ? "B2C" : "B2B",
        });

        setBusyloader({ loading: false, msg: "" });

        if (res?.statusCode === 200 || res?.statusCode === 201) {
          showToast({ msg: "User removed successfully", color: "success" });

          setSpecificCustomers(
            produce((draft) => {
              const idx = draft.findIndex((d: any) => {
                const id = d.buyerId || d._id || d.id;
                return id === buyerId;
              });
              if (idx !== -1) draft.splice(idx, 1);
            }),
          );
        } else {
          showToast({
            msg: res?.data?.message || "Failed to remove user",
            color: "error",
          });
        }
      } catch (e) {
        setBusyloader({ loading: false, msg: "" });
        showToast({ msg: "Failed to remove user", color: "error" });
      } finally {
        setShowRemarksModal(false);
        setSelectedRemoveUser(null);
      }
    }
  };

  const refreshSpecificUser = async (userId: string) => {
    if (!userId) return;

    try {
      const businessType = activeTab === "b2c" ? "B2C" : "B2B";

      const cfgRes = await FranchiseService.getSpecificUserConfig(
        userId,
        AuthService.getLoggedInUserId(),
        businessType,
      );

      const allowed = cfgRes?.data?.data?.allowedPayments || {};

      setSpecificCustomers(
        produce((draft) => {
          for (let i = 0; i < draft.length; i++) {
            const it = draft[i] as any;
            const bid = it.buyerId || it._id || it.id;
            if (bid === userId) {
              it.prepaidEnabled = !!allowed?.prepaid;
            }
          }
        }),
      );
    } catch (e) {
      // ignore refresh errors
    }
  };

  return (
    <>
      <AppHeader
        title="Prepaid Payment"
        sectionKey="profile"
        activeTab="settings"
        mobileLead="menu"
      />
      {/* theme-2 runs this page edge to edge: no page gutter and no centred
          container — every block (tab tray, cards) owns its own spacing.
          See `.settings-page-flush` in theme-2.css. */}
      <div
        className={`app-page page-bg ${
          isTheme2 ? "settings-page-flush" : "tw:p-4"
        }`}
      >
        <div className={isTheme2 ? "" : "app-container"}>
          {/* Settings menu on mobile — theme-2 only (see theme-2.css); the
              desktop equivalent is the side pane below. */}
          <SectionTabs
            tabs={settingsSectionTabs}
            activeTab={"prepaid-payment"}
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
                  title={"Settings"}
                />
              </div>
            </aside>

            <div className="section-content">
              <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
                {/* Full span: in theme-2 desktop the pane is lifted out of the
                    grid, so the main column owns all 12 columns. */}
                <AppPaneMain className="tw:lg:col-span-12">
                  {/* Breadcrumbs are dropped entirely in theme-2 (they'd be
                      hidden there anyway). Not rendered rather than CSS-hidden
                      so the tab strip below is the column's first child and
                      lands flush under the sticky section bar — same treatment
                      as the payment config page. */}
                  {!isTheme2 && (
                    <AppBreadcrumbs
                      data={defaultBreadcrumbs}
                      className="tw:mb-4"
                    />
                  )}

                  {/* theme-2 mobile renders the sub-nav as the full-bleed
                      underlined tray pinned right below the sticky section pill
                      bar; theme-2 desktop pins the pills on their own white
                      band so they don't float on page-bg; the other themes keep
                      the segmented control. Kept outside the `loading` branch
                      so the strip stays the column's first child. */}
                  <AppTab
                    tabs={tabItems}
                    activeTab={activeTab}
                    onTabChange={onTabChange}
                    variant={
                      isTheme2 ? (isMobile ? "underline" : "pills") : "tabs"
                    }
                    className={
                      isTheme2
                        ? isMobile
                          ? "edge-tabs app-tabs-tray app-tabs-sticky app-tabs-bleed"
                          : "subscribe-tabs-sticky barcode-tabs-pills"
                        : "tw:mb-4"
                    }
                    scrollable={isTheme2 && isMobile}
                  />

                  {loading ? (
                    <div className="tw:flex tw:items-center tw:justify-center tw:h-full">
                      <AppSpinner />
                    </div>
                  ) : activeTab === "logs" ? (
                    <>
                      <ActivityLog />
                    </>
                  ) : (
                    <>
                      {/* theme-2 drops the card box (same `app-flat-sheet`
                          treatment as the bulk pricing preview): the body is
                          already a stack of bordered blocks, so the outer
                          rounded surface is a box around boxes. The title sits
                          straight on the page ground instead. */}
                      <AppCard
                        title="Global Settings"
                        icon={<Settings />}
                        subtitle="Configure global settings for all users"
                        className={isTheme2 ? "app-flat-sheet" : ""}
                      >
                        <div className="tw:space-y-3">
                          {globalSettings.map((setting) => (
                            <div
                              key={setting.key}
                              className="tw:flex tw:items-center tw:gap-4 tw:border tw:border-gray-200 tw:rounded-xl tw:p-4 tw:bg-white tw:shadow-sm tw:transition-shadow hover:tw:shadow-md"
                            >
                              <div className="tw:shrink-0 tw:h-11 tw:w-11 tw:rounded-full tw:bg-blue-50 tw:flex tw:items-center tw:justify-center tw:text-blue-600">
                                {setting.icon}
                              </div>
                              <div className="tw:flex-1 tw:min-w-0">
                                <div className="tw:text-sm tw:font-semibold tw:text-gray-800">
                                  {setting.label}
                                </div>
                                {!setting.showToggle ? (
                                  <div className="tw:mt-1 tw:text-xs tw:text-red-500 tw:flex tw:items-center tw:gap-1 tw:flex-wrap">
                                    Please configure payment methods first in
                                    the payment config section{" "}
                                    <button
                                      className="tw:font-medium tw:text-blue-600 tw:cursor-pointer tw:underline-offset-2 hover:tw:underline"
                                      onClick={handleConfigureNow}
                                    >
                                      Configure Now
                                    </button>
                                  </div>
                                ) : (
                                  <div className="tw:mt-0.5 tw:text-xs tw:text-gray-500">
                                    {setting.description}
                                  </div>
                                )}
                              </div>
                              <div className="tw:shrink-0">
                                {setting.showToggle && (
                                  <AppSwitch
                                    checked={setting.value}
                                    onCheckedChange={(checked) =>
                                      handleSwitchChange(setting.key, checked)
                                    }
                                    label={""}
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </AppCard>

                      <AppCard
                        title={
                          <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:w-full">
                            <div>Configure to Specific Users</div>
                            <div>
                              <AppButton
                                color="primary"
                                size="small"
                                onClick={handleAddUser}
                                fill="outline"
                              >
                                <Plus size={14} />
                                Add User
                              </AppButton>
                            </div>
                          </div>
                        }
                        icon={<Users />}
                        className={isTheme2 ? "app-flat-sheet" : ""}
                      >
                        {specificCustomers?.length > 0 ? (
                          <>
                            <SpecificUsers
                              users={specificCustomers || []}
                              callback={handleUserCallback}
                            />
                          </>
                        ) : (
                          <NoData />
                        )}
                      </AppCard>
                    </>
                  )}
                </AppPaneMain>

                <SettingsSidePane activeKey="prepaid-payment" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <BusyLoader show={busyloader.loading} message={busyloader.msg} />

      <UserPaymentConfigModal
        show={userPaymentModal.show}
        userId={userPaymentModal.userId || undefined}
        type={activeTab === "b2c" ? "B2C" : "B2B"}
        callback={async (params: { action: string; data?: any }) => {
          setUserPaymentModal({ show: false, userId: null });

          if (params?.action === "saved") {
            const uid = userPaymentModal.userId || null;
            if (uid) {
              await refreshSpecificUser(uid);
            }
          }
        }}
      />

      <UserSearchModal
        show={userSearchModal.show}
        type={activeTab === "b2c" ? "B2C" : "B2B"}
        callback={handleUserSearchModalCallback}
      />
      <RemarksModal
        show={showRemarksModal}
        title="Remove User"
        callback={handleRemarksModalCallback}
      />
    </>
  );
};

export default PrepaidPayment;
