import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import OmsService from "~/services/OmsService";

const AcceptPreOrderConfig: React.FC = () => {
  const { t } = useTranslation(["settings"]);
  const { show: showToast } = useAppToast();

  // Local optimistic state. Initialize from stored logged in user config.
  const [acceptPreOrder, setAcceptPreOrder] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);

  const [appAlertDialog, setAppAlertDialog] = useState({
    show: false,
    title: "",
    description: "",
    onConfirm: () => {},
    onCancel: () => {},
  });

  const handleToggleClick = () => {
    const turningOn = !acceptPreOrder;
    const title = turningOn
      ? t("acceptPreOrder.enableAcceptOrdersWithoutStock")
      : t("acceptPreOrder.disableAcceptOrdersWithoutStock");
    const description = turningOn
      ? t("acceptPreOrder.enableAcceptOrdersWithoutStockDescription")
      : t("acceptPreOrder.disableAcceptOrdersWithoutStockDescription");

    setAppAlertDialog({
      show: true,
      title,
      description,
      onConfirm: async () => {
        setAppAlertDialog((p) => ({ ...p, show: false }));
        await new Promise((r) => setTimeout(r, 150));
        await saveConfig(turningOn);
      },
      onCancel: () => {
        setAppAlertDialog((p) => ({ ...p, show: false }));
      },
    });
  };

  // Initialize from AuthService stored user config on mount
  useEffect(() => {
    try {
      const loggedInUser = AuthService.getLoggedInUser();
      // new shape: acceptPreOrder is stored under configParams.acceptPreOrder
      const current = Boolean(
        loggedInUser?.configParams?.acceptPreOrder ?? false
      );
      setAcceptPreOrder(current);
    } catch (e) {
      // ignore and keep default
    }
  }, []);

  const saveConfig = async (value: boolean) => {
    setIsSaving(true);
    try {
      const resp: any = await OmsService.updateOrderConfig({
        acceptPreOrder: value,
      });

      if (resp?.statusCode === 200) {
        setAcceptPreOrder(value);
        // Update the local stored user config so other parts of the app see the new value.
        try {
          const loggedInUser = AuthService.getLoggedInUser() || {};
          // prefer nested configParams.acceptPreOrder, but also support legacy top-level key
          const updatedUser = {
            ...loggedInUser,
            configParams: {
              ...(loggedInUser?.configParams || {}),
              acceptPreOrder: value,
            },
            // keep legacy top-level key for backwards compatibility
            acceptPreOrder: value,
          };
          // AuthService exposes setloggedInUser to persist franchise (_f) object
          AuthService.setloggedInUser(updatedUser);
        } catch (e) {
          // ignore storage update errors
        }
        showToast({
          msg: t("acceptPreOrder.updatedSuccessfully"),
          color: "success",
        });
      } else {
        showToast({
          msg: resp?.data?.message || t("acceptPreOrder.updateFailed"),
          color: "error",
        });
      }
    } catch (err: any) {
      console.error("Error updating order config:", err);
      showToast({ msg: t("acceptPreOrder.updateFailed"), color: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppCard
      title={t("acceptPreOrder.acceptOrdersWithoutStock")}
      icon="settings"
    >
      <div className="tw:flex tw:flex-col tw:gap-3">
        <p className="tw:text-sm tw:text-gray-600">
          {t(
            "acceptPreOrder.acceptOrdersWithoutStockDescription",
            "Allow accepting orders even when stock is not available. Useful for pre-orders or backorders."
          )}
        </p>

        <div className="tw:flex tw:items-center tw:justify-between">
          <div className="tw:flex tw:items-center tw:gap-3">
            <div
              className={
                "tw:w-3 tw:h-3 tw:rounded-full " +
                (acceptPreOrder ? "tw:bg-emerald-500" : "tw:bg-gray-400")
              }
            />

            <div
              className={
                "tw:font-medium " +
                (acceptPreOrder ? "tw:text-emerald-600" : "tw:text-gray-600")
              }
            >
              {acceptPreOrder
                ? t("acceptPreOrder.acceptingPreOrders")
                : t("acceptPreOrder.rejectingPreOrders")}
            </div>
          </div>

          <div className="tw:flex tw:items-center tw:gap-2">
            <AppButton
              onClick={() => handleToggleClick()}
              isLoading={isSaving}
              color={acceptPreOrder ? "light" : "primary"}
              fill={acceptPreOrder ? "outline" : "solid"}
            >
              {acceptPreOrder ? t("disable") : t("enable")}
            </AppButton>
          </div>
        </div>

        <AppAlertDialog
          title={appAlertDialog.title}
          description={appAlertDialog.description}
          show={appAlertDialog.show}
          onConfirm={appAlertDialog.onConfirm}
          onCancel={appAlertDialog.onCancel}
        />
      </div>
    </AppCard>
  );
};

export default AcceptPreOrderConfig;
