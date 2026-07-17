import React, { useEffect, useState } from "react";
import AppCard from "~/components/core/card/AppCard";
import { History, Save, ShieldCheck } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import { AppCheckbox } from "~/components/core/form/AppCheckbox";
import FranchiseService from "~/services/FranchiseService";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import ConfigLogModal from "../../modals/logs/ConfigLogModal";

const CONFIG_TYPE = "B2B_ORDER_CONFIG";

const OtpConfig: React.FC = () => {
  const toast = useAppToast();
  const [loading, setLoading] = useState(false);
  const [enableOtp, setEnableOtp] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await FranchiseService.getFranchiseSettings({
          configType: CONFIG_TYPE,
        });
        const configValue = res?.data?.data?.configValue;
        setEnableOtp(configValue?.enableOtpForPOS === true);
      } catch (e: any) {
        toast.show({
          msg: e?.message || "Failed to load OTP settings",
          color: "error",
        });
      } finally {
        setFetching(false);
      }
    };

    if (AuthService.canHandleB2B()) {
      load();
    } else {
      setFetching(false);
    }
  }, []);

  const handleSave = async () => {
    try {
      setLoading(true);
      const res = await FranchiseService.getFranchiseSettings({
        configType: CONFIG_TYPE,
      });

      const existing = res?.data?.data;
      const payload: any = {
        franchiseId: AuthService.getLoggedInUserId(),
        configType: CONFIG_TYPE,
        configValue: {
          ...(existing?.configValue || {}),
          enableOtpForPOS: enableOtp,
        },
      };

      const upd = await FranchiseService.updateFranchiseSettings(payload);
      if (upd.statusCode === 200) {
        toast.show({ msg: "OTP setting updated", color: "success" });
      } else {
        toast.show({
          msg: upd?.data?.message || "Failed to update OTP setting",
          color: "error",
        });
      }
    } catch (e: any) {
      toast.show({
        msg: e?.message || "Error updating setting",
        color: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLogs = () => setShowLogModal(true);

  if (!AuthService.canHandleB2B()) return null;

  return (
    <AppCard
      title="OTP Verification - POS B2B Order"
      subtitle="Configure OTP verification for B2B orders placed via POS"
      icon={<ShieldCheck />}
    >
      <div className="tw:flex tw:flex-col tw:gap-3">
        <div className="tw:bg-gray-50 tw:rounded-lg tw:p-3 tw:space-y-1">
          <AppCheckbox
            label="Enable OTP verification for POS B2B orders"
            value={enableOtp}
            onChange={(val: boolean) => setEnableOtp(val)}
          />
          <p className="tw:text-xs tw:text-gray-600 tw:ml-6 tw:leading-relaxed">
            When enabled, OTP verification will be required during B2B checkout
            in POS
          </p>
        </div>

        <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:pt-1">
          <AppButton
            type="button"
            color="light"
            fill="outline"
            size="small"
            onClick={handleOpenLogs}
          >
            <History size={14} />
            View History
          </AppButton>

          <AppButton
            type="button"
            size="small"
            disabled={loading || fetching}
            onClick={() => setShowConfirm(true)}
          >
            <Save size={14} />
            {loading ? "Saving..." : "Save Changes"}
          </AppButton>
        </div>
      </div>

      <AppAlertDialog
        show={showConfirm}
        title="Confirm Changes"
        description={
          enableOtp
            ? "Are you sure you want to enable OTP verification for POS B2B orders?"
            : "Are you sure you want to disable OTP verification for POS B2B orders?"
        }
        onConfirm={() => {
          setShowConfirm(false);
          handleSave();
        }}
        onCancel={() => setShowConfirm(false)}
      />

      <ConfigLogModal
        show={showLogModal}
        type="enableOtpForPOS"
        callback={({ action }) => {
          if (action === "close") {
            setShowLogModal(false);
          }
        }}
      />
    </AppCard>
  );
};

export default OtpConfig;
