import React, { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import AppSwitch from "~/components/core/form/AppSwitch";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";

interface ClubDealSettingProps {
  onSaved?: () => void;
}

const ClubDealSetting: React.FC<ClubDealSettingProps> = ({ onSaved }) => {
  const { t } = useTranslation(["settings", "common"]);
  const [active, setActive] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingValue, setPendingValue] = useState(false);
  const toast = useAppToast();

  useEffect(() => {
    try {
      const loggedInUser = AuthService.getLoggedInUser();
      const current = Boolean(
        loggedInUser?.configParams?.forceShowDefaultStoreDeals ?? false
      );
      setActive(current);
    } catch (e) {
      // ignore
    }
  }, []);

  const handleToggle = (checked: boolean) => {
    setPendingValue(checked);
    setShowConfirm(true);
  };

  const confirmToggle = async () => {
    const checked = pendingValue;
    setShowConfirm(false);
    setSaving(true);
    try {
      const resp: any = await FranchiseService.updateFranchise({
        forceShowDefaultStoreDeals: checked,
      });

      if (resp?.statusCode === 200 || resp?.statusCode === 201) {
        setActive(checked);
        try {
          const loggedInUser = AuthService.getLoggedInUser() || {};
          const updatedUser = {
            ...loggedInUser,
            configParams: {
              ...(loggedInUser?.configParams || {}),
              forceShowDefaultStoreDeals: checked,
            },
            forceShowDefaultStoreDeals: checked,
          };
          AuthService.setloggedInUser(updatedUser);
        } catch (e) {
          // ignore
        }
        toast.show({
          msg: t("acceptPreOrder.updatedSuccessfully"),
          color: "success",
        });
        onSaved && onSaved();
      } else {
        toast.show({
          msg: resp?.data?.message || t("acceptPreOrder.updateFailed"),
          color: "error",
        });
      }
    } catch (err: any) {
      toast.show({
        msg: t("acceptPreOrder.updateFailed"),
        color: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`tw:relative tw:overflow-hidden tw:rounded-2xl tw:border tw:bg-white tw:shadow-sm tw:transition ${
        active ? "tw:border-emerald-300" : "tw:border-slate-200"
      }`}
    >
      <div
        className={`tw:h-1.5 tw:w-full ${
          active
            ? "tw:bg-gradient-to-r tw:from-emerald-400 tw:to-teal-500"
            : "tw:bg-slate-100"
        }`}
      />
      <div className="tw:flex tw:items-center tw:gap-4 tw:p-4">
        <div
          className={`tw:flex tw:h-14 tw:w-14 tw:flex-shrink-0 tw:items-center tw:justify-center tw:rounded-2xl tw:shadow-sm ${
            active
              ? "tw:bg-gradient-to-br tw:from-emerald-400 tw:to-teal-500 tw:text-white"
              : "tw:bg-emerald-50 tw:text-emerald-600"
          }`}
        >
          <Eye size={28} />
        </div>
        <div className="tw:flex-1 tw:min-w-0">
          <div className="tw:text-base tw:font-semibold tw:text-slate-900">
            {t("common:showDefaultItemsOnClub")}
          </div>
          <div className="tw:mt-0.5 tw:text-sm tw:text-slate-600">
            {t("common:showDefaultItemsOnClubDesc")}
          </div>
        </div>
        <div className="tw:flex tw:flex-shrink-0 tw:items-center">
          {saving ? (
            <AppSpinner size="xs" />
          ) : (
            <AppSwitch
              checked={active}
              onCheckedChange={(c) => handleToggle(!!c)}
              disabled={saving}
            />
          )}
        </div>
      </div>
      <div className="tw:border-t tw:border-slate-100 tw:bg-slate-50/60 tw:px-4 tw:py-2 tw:text-xs tw:text-slate-500">
        {t("common:showDefaultItemsOnClubExample")}
      </div>

      <AppAlertDialog
        show={showConfirm}
        title={
          pendingValue
            ? t("common:showDefaultItemsOnClubTitle")
            : t("common:hideDefaultItemsOnClubTitle")
        }
        description={
          pendingValue
            ? t("common:showDefaultItemsOnClubConfirmDesc")
            : t("common:hideDefaultItemsOnClubConfirmDesc")
        }
        onConfirm={confirmToggle}
        onCancel={() => setShowConfirm(false)}
        okText={pendingValue ? t("common:enable") : t("common:disable")}
        cancelText={t("common:cancel")}
      />
    </div>
  );
};

export default ClubDealSetting;
