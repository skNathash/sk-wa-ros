import React, { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import AppSwitch from "~/components/core/form/AppSwitch";
import useAppToast from "~/hooks/useAppToast";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AuthService from "~/services/AuthService";
import SellerCatalogService from "~/services/SellerCatalogService";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import { MAX_RESERVE_QTY } from "~/constants";

interface ReserveSettingProps {
  onSaved?: () => void;
}

const ReserveSetting: React.FC<ReserveSettingProps> = ({ onSaved }) => {
  const { t } = useTranslation(["common"]);
  const [active, setActive] = useState(false);
  const [maxReserveQty, setMaxReserveQty] = useState(MAX_RESERVE_QTY);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingValue, setPendingValue] = useState(false);
  const toast = useAppToast();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const userId = AuthService.getLoggedInUserId();
      const res: any = await SellerCatalogService.getReserveConfig({
        filter: {
          configType: "Global",
          "franchiseInfo.id": userId,
        },
      });
      if (res?.statusCode === 200 && res?.data) {
        const config = res.data.data[0];
        setActive(config.isActive ?? false);
        setMaxReserveQty(config.maxReserveQty ?? MAX_RESERVE_QTY);
      }
    } catch {
      // use defaults
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (checked: boolean) => {
    setPendingValue(checked);
    setShowConfirm(true);
  };

  const confirmToggle = async () => {
    const checked = pendingValue;
    setShowConfirm(false);
    setSaving(true);
    try {
      const payload: any = {
        configType: "Global",
        isActive: checked,
        maxReserveQty: checked ? Number(maxReserveQty) || MAX_RESERVE_QTY : 0,
        remarks: checked
          ? "Enable reserve for this franchise"
          : "Disable reserve",
      };

      const res: any = await SellerCatalogService.updateReserveConfig(payload);

      if (res?.statusCode === 200 || res?.statusCode === 201) {
        setActive(checked);
        toast.show({
          msg: res?.message || t("reserveConfigSaved"),
          color: "success",
        });
        onSaved && onSaved();
      } else {
        toast.show({
          msg: res?.message || t("reserveConfigSaveFailed"),
          color: "error",
        });
      }
    } catch (err: any) {
      toast.show({
        msg: err?.message || t("somethingWentWrong"),
        color: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-slate-50 tw:p-4 tw:text-base tw:text-slate-500">
        {t("loading")}
      </div>
    );
  }

  return (
    <div
      className={`tw:relative tw:overflow-hidden tw:rounded-2xl tw:border tw:bg-white tw:shadow-sm tw:transition ${
        active ? "tw:border-amber-300" : "tw:border-slate-200"
      }`}
    >
      <div
        className={`tw:h-1.5 tw:w-full ${
          active
            ? "tw:bg-gradient-to-r tw:from-amber-400 tw:to-orange-500"
            : "tw:bg-slate-100"
        }`}
      />
      <div className="tw:flex tw:items-center tw:gap-4 tw:p-4">
        <div
          className={`tw:flex tw:h-14 tw:w-14 tw:flex-shrink-0 tw:items-center tw:justify-center tw:rounded-2xl tw:shadow-sm ${
            active
              ? "tw:bg-gradient-to-br tw:from-amber-400 tw:to-orange-500 tw:text-white"
              : "tw:bg-amber-50 tw:text-amber-600"
          }`}
        >
          <ShieldCheck size={28} />
        </div>
        <div className="tw:flex-1 tw:min-w-0">
          <div className="tw:text-base tw:font-semibold tw:text-slate-900">
            {t("stockReservation")}
          </div>
          <div className="tw:mt-0.5 tw:text-sm tw:text-slate-600">
            {t("stockReservationDesc")}
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
        {t("stockReservationExample")}
      </div>
      <AppAlertDialog
        show={showConfirm}
        title={
          pendingValue
            ? t("enableStockReservationTitle")
            : t("disableStockReservationTitle")
        }
        description={
          pendingValue
            ? t("enableStockReservationDesc")
            : t("disableStockReservationDesc")
        }
        onConfirm={confirmToggle}
        onCancel={() => setShowConfirm(false)}
        okText={pendingValue ? t("enable") : t("disable")}
        cancelText={t("cancel")}
      />
    </div>
  );
};

export default ReserveSetting;
