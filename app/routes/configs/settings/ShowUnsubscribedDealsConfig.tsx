import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";

const ShowUnsubscribedDealsConfig: React.FC = () => {
  const { t } = useTranslation(["settings"]);
  const { show: showToast } = useAppToast();

  const [showUnsubscribedDeals, setShowUnsubscribedDeals] =
    useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);

  const primaryBusiness = AuthService.getLoggedInUserPrimaryBusiness();
  const secondaryBusiness = AuthService.getLoggedInUserSecondaryBusiness();

  const [appAlertDialog, setAppAlertDialog] = useState({
    show: false,
    title: "",
    description: "",
    onConfirm: () => {},
    onCancel: () => {},
  });

  const handleToggleClick = () => {
    const turningOn = !showUnsubscribedDeals;
    const title = turningOn
      ? t("unsubscribedDeals.enableTitle")
      : t("unsubscribedDeals.disableTitle");
    const description = turningOn
      ? t("unsubscribedDeals.enableDescription", {
          primary: primaryBusiness.name,
          secondary: secondaryBusiness.name,
          secondaryText: secondaryBusiness.name
            ? ` ${t("unsubscribedDeals.andSecondaryBusiness")} (${secondaryBusiness.name})`
            : "",
        })
      : t("unsubscribedDeals.disableDescription");

    setAppAlertDialog({
      show: true,
      title,
      description,
      onConfirm: async () => {
        setAppAlertDialog((p) => ({ ...p, show: false }));
        await new Promise((r) => setTimeout(r, 100));
        await saveConfig(turningOn);
      },
      onCancel: () => {
        setAppAlertDialog((p) => ({ ...p, show: false }));
      },
    });
  };

  useEffect(() => {
    try {
      const loggedInUser = AuthService.getLoggedInUser();
      const current = Boolean(
        loggedInUser?.configParams?.forceShowDefaultStoreDeals ?? false,
      );
      setShowUnsubscribedDeals(current);
    } catch (e) {
      // ignore and keep default
    }
  }, []);

  const saveConfig = async (value: boolean) => {
    setIsSaving(true);
    try {
      const resp: any = await FranchiseService.updateFranchise({
        forceShowDefaultStoreDeals: value,
      });

      if (resp?.statusCode === 200 || resp?.statusCode === 201) {
        setShowUnsubscribedDeals(value);
        try {
          const loggedInUser = AuthService.getLoggedInUser() || {};
          const updatedUser = {
            ...loggedInUser,
            configParams: {
              ...(loggedInUser?.configParams || {}),
              forceShowDefaultStoreDeals: value,
            },
            forceShowDefaultStoreDeals: value,
          };
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
      console.error("Error updating show unsubscribed deals config:", err);
      showToast({ msg: t("acceptPreOrder.updateFailed"), color: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppCard title={t("unsubscribedDeals.title")} icon="settings">
      <div className="tw:flex tw:flex-col tw:gap-3">
        <p className="tw:text-sm tw:text-gray-600">
          {t("unsubscribedDeals.description", {
            primary: primaryBusiness.name,
            secondary: secondaryBusiness.name,
            secondaryText: secondaryBusiness.name
              ? ` ${t("unsubscribedDeals.andSecondaryBusiness")} (${secondaryBusiness.name})`
              : "",
          })}
        </p>

        <div className="tw:flex tw:items-center tw:justify-between">
          <div className="tw:flex tw:items-center tw:gap-3">
            <div
              className={
                "tw:w-3 tw:h-3 tw:rounded-full " +
                (showUnsubscribedDeals ? "tw:bg-emerald-500" : "tw:bg-gray-400")
              }
            />

            <div
              className={
                "tw:font-medium " +
                (showUnsubscribedDeals
                  ? "tw:text-emerald-600"
                  : "tw:text-gray-600")
              }
            >
              {showUnsubscribedDeals
                ? t("unsubscribedDeals.showing")
                : t("unsubscribedDeals.notShowing")}
            </div>
          </div>

          <div className="tw:flex tw:items-center tw:gap-2">
            <AppButton
              onClick={() => handleToggleClick()}
              isLoading={isSaving}
              color={showUnsubscribedDeals ? "light" : "primary"}
              fill={showUnsubscribedDeals ? "outline" : "solid"}
            >
              {showUnsubscribedDeals ? t("disable") : t("enable")}
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

export default ShowUnsubscribedDealsConfig;
