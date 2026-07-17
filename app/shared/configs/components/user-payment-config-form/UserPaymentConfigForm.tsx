import { IndianRupee, Phone, User, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import AppCard from "~/components/core/card/AppCard";
import AppSwitch from "~/components/core/form/AppSwitch";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import NoData from "~/components/core/no-data/NoData";
import { produce } from "immer";
import FranchiseService from "~/services/FranchiseService";
import CustomerService from "~/services/CustomerService";
import AuthService from "~/services/AuthService";
import useAppToast from "~/hooks/useAppToast";

const defaultGlobalSettings = [
  {
    label: "Enable COD Payment",
    key: "cod",
    icon: <IndianRupee />,
    description: "Enable COD payment for all users",
    value: false,
    showToggle: true,
    apiKey: "codEnabled",
    initApiKey: "cod",
  },
  {
    label: "Enable Prepaid Payment",
    key: "prepaid",
    icon: <Wallet />,
    description: "Enable Prepaid payment for all users",
    value: false,
    showToggle: true,
    apiKey: "prepaidEnabled",
    initApiKey: "prepaid",
  },
];

type Props = {
  userId: string;
  type?: "B2C" | "B2B";
  callback: (params: { action: string; data?: any }) => void;
};

const UserPaymentConfigForm = ({ userId, type = "B2C", callback }: Props) => {
  const [globalSettings, setGlobalSettings] = useState(defaultGlobalSettings);
  const [isSpecificCustomer, setIsSpecificCustomer] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setUser(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch user details depending on type
        let uRes: any = null;
        if (type === "B2C") {
          uRes = await CustomerService.getCustomer(userId);
        } else {
          uRes = await FranchiseService.getFranchise(userId);
        }

        const u = uRes?.data?.data || uRes?.data || uRes || null;
        setUser(u || null);

        if (!u) {
          setLoading(false);
          return;
        }

        // Fetch specific user config
        const res = await FranchiseService.getSpecificUserConfig(
          u._id,
          AuthService.getLoggedInUserId(),
          type,
        );

        const config = res?.data?.data?.allowedPayments || {};

        setGlobalSettings(
          produce(defaultGlobalSettings, (draft) => {
            draft.forEach((setting) => {
              setting.value = config[setting.initApiKey];
            });
          }),
        );

        // Check if this user exists in franchise payment config's specificCustomers
        try {
          const pcRes = await FranchiseService.getPaymentConfig({
            filter: { businessType: type },
          });

          const pc = pcRes?.data?.data?.[0] || {};
          const specific = pc?.specificCustomers || [];

          const exists = specific.some((item: any) => {
            if (!item) return false;
            const buyerId = item.buyerId;
            return buyerId && buyerId === u._id;
          });

          setIsSpecificCustomer(Boolean(exists));
        } catch (e) {
          // ignore errors from optional check
          setIsSpecificCustomer(false);
        }
      } catch (e) {
        setUser(null);
        setGlobalSettings(defaultGlobalSettings);
        setIsSpecificCustomer(false);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, type]);

  useEffect(() => {
    if (!user) return;

    let keys: Record<string, boolean> = {};
    globalSettings.forEach((setting) => {
      keys[setting.key] = setting.value;
    });
    callback({ action: "switch-change", data: keys });
  }, [globalSettings, user]);

  const { show: showToast } = useAppToast();

  const handleSwitchChange = (key: string, value: boolean) => {
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

    const nextChange = produce(globalSettings, (draft) => {
      const setting = draft.find((setting: any) => setting.key === key);
      if (setting) {
        setting.value = value;
      }
    });

    setGlobalSettings(nextChange);
  };

  const handleConfigureNow = () => {
    // placeholder for navigation
  };

  if (loading) {
    return (
      <div className="tw:flex tw:items-center tw:justify-center tw:h-48">
        <AppSpinner />
      </div>
    );
  }

  if (!user) {
    return <NoData />;
  }

  return (
    <>
      {isSpecificCustomer && (
        <InfoBlock variant="success" size="sm" className="tw:mb-4">
          This customer is already configured with your payment methods. You can
          update their settings below.
        </InfoBlock>
      )}
      <AppCard noPadding>
        <div className="tw:flex tw:items-center tw:justify-between tw:p-4">
          <div>
            <div className="tw:text-xs tw:text-slate-600 tw:mb-2">
              Selected User Details
            </div>
            <div className="tw:font-medium tw:flex tw:items-center tw:gap-2 tw:text-lg">
              <User size={18} /> {user.name}
            </div>
            <div className="tw:text-xs tw:text-gray-500 tw:mb-1">
              {user.addressStr}
            </div>
            <div className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-500">
              <Phone size={12} />
              {user.mobile || "-"}
            </div>
          </div>
        </div>
      </AppCard>

      {globalSettings.map((setting) => (
        <div
          key={setting.key}
          className="tw:flex tw:items-center tw:gap-2 tw:border tw:border-gray-200 tw:rounded-lg tw:p-4 tw:bg-white tw:mb-2"
        >
          <div className="tw:shrink-0 tw:text-gray-500">{setting.icon}</div>
          <div className="tw:flex-1">
            <div className="tw:text-sm tw:font-medium tw:mb-0.5">
              {setting.label}
            </div>
            {!setting.showToggle ? (
              <span className="tw:text-xs tw:text-red-500">
                Please configure payment methods first in the payment config
                section{" "}
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
    </>
  );
};

export default UserPaymentConfigForm;
