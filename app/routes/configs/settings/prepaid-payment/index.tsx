import { produce } from "immer";
import {
  Building,
  IndianRupee,
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
import NoData from "~/components/core/no-data/NoData";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
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
    label: "Enable COD Payment",
    key: "cod",
    icon: <IndianRupee />,
    description: "Enable COD payment for all users",
    value: false,
    showToggle: true,
    apiKey: "codEnabled",
  },
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
          setting.value =
            currentConfigRef.current?.overallCustomers?.[setting.apiKey];

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
              it.codEnabled = !!allowed?.cod;
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
      <AppHeader title="Prepaid Payment" />
      <div className="app-page tw:p-4 page-bg">
        <div className="app-container">
          <AppBreadcrumbs data={defaultBreadcrumbs} className="tw:mb-4" />
          <AppTab
            tabs={tabItems}
            activeTab={activeTab}
            onTabChange={onTabChange}
            className="tw:mb-4"
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
              <AppCard
                title="Global Settings"
                icon={<Settings />}
                subtitle="Configure global settings for all users"
              >
                <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
                  {globalSettings.map((setting) => (
                    <div
                      key={setting.key}
                      className="tw:flex tw:items-center tw:gap-2 tw:border tw:border-gray-200 tw:rounded-lg tw:p-4 tw:bg-white"
                    >
                      <div className="tw:shrink-0 tw:text-gray-500">
                        {setting.icon}
                      </div>
                      <div className="tw:flex-1">
                        <div className="tw:text-sm tw:font-medium tw:mb-0.5">
                          {setting.label}
                        </div>
                        {!setting.showToggle ? (
                          <span className="tw:text-xs tw:text-red-500">
                            Please configure payment methods first in the
                            payment config section{" "}
                            <button
                              className="tw:text-blue-500 tw:cursor-pointer tw:underline"
                              onClick={handleConfigureNow}
                            >
                              Configure Now
                            </button>
                          </span>
                        ) : (
                          <div className="tw:text-xs tw:text-gray-500">
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
