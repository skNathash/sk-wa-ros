import { Info } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AppSwitch from "~/components/core/form/AppSwitch";
import AppPopover from "~/components/core/popover/AppPopover";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";

const ClubDealConfigCompact: React.FC = () => {
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

  useEffect(() => {
    try {
      const loggedInUser = AuthService.getLoggedInUser();
      const current = Boolean(
        loggedInUser?.configParams?.forceShowDefaultStoreDeals ?? false
      );
      setShowUnsubscribedDeals(current);
    } catch (e) {
      // ignore
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
          // ignore
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
      showToast({ msg: t("acceptPreOrder.updateFailed"), color: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (checked: boolean) => {
    const title = checked
      ? t("unsubscribedDeals.enableTitle")
      : t("unsubscribedDeals.disableTitle");
    const description = checked
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
        await new Promise((r) => setTimeout(r, 150));
        await saveConfig(checked);
      },
      onCancel: () => {
        setAppAlertDialog((p) => ({ ...p, show: false }));
      },
    });
  };

  return (
    <div className="tw:flex tw:items-center tw:gap-2 tw:bg-white/50 tw:backdrop-blur-sm tw:border tw:border-gray-200 tw:px-3 tw:py-1.5 tw:rounded-full tw:shadow-sm">
      <div className="tw:flex tw:items-center tw:gap-1.5">
        <span className="tw:text-[10px] tw:uppercase tw:tracking-wider tw:font-bold tw:text-gray-500">
          Default Products
        </span>
        <AppPopover
          triggerContent={
            <button className="tw:text-gray-400 tw:hover:text-blue-500 tw:transition-colors">
              <Info size={14} />
            </button>
          }
        >
          <div className="tw:p-3 tw:max-w-[250px]">
            <h4 className="tw:font-bold tw:text-sm tw:mb-1">
              Show Default Products
            </h4>
            <p className="tw:text-xs tw:text-gray-600 tw:leading-relaxed">
              When enabled, products from your linked primary business (
              {primaryBusiness.name})
              {secondaryBusiness.name
                ? ` and secondary business (${secondaryBusiness.name})`
                : ""}{" "}
              catalogs will be shown on the CLUB APP even if they are not in
              your subscribed list.
            </p>
          </div>
        </AppPopover>
      </div>

      <div className="tw:h-4 tw:w-[1px] tw:bg-gray-200 tw:mx-1" />

      <AppSwitch
        checked={showUnsubscribedDeals}
        onCheckedChange={handleToggle}
        label={
          <span
            className={
              "tw:text-[11px] tw:font-semibold " +
              (showUnsubscribedDeals
                ? "tw:text-emerald-600"
                : "tw:text-gray-500")
            }
          >
            {showUnsubscribedDeals ? "On" : "Off"}
          </span>
        }
      />

      <AppAlertDialog
        title={appAlertDialog.title}
        description={appAlertDialog.description}
        show={appAlertDialog.show}
        onConfirm={appAlertDialog.onConfirm}
        onCancel={appAlertDialog.onCancel}
      />

      {isSaving && (
        <div className="tw:absolute tw:inset-0 tw:bg-white/20 tw:rounded-full tw:flex tw:items-center tw:justify-center">
          <div className="tw:w-3 tw:h-3 tw:border-2 tw:border-blue-500 tw:border-t-transparent tw:rounded-full tw:animate-spin" />
        </div>
      )}
    </div>
  );
};

export default ClubDealConfigCompact;
