import { Settings, Power, PowerOff } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import PosService from "~/services/PosService";

type Props = {
  isDefaultEnabled: boolean;
  onToggleDefault: (enabled: boolean) => void;
  onRefreshConfig?: () => void;
};

const DefaultConfigBlock = ({
  isDefaultEnabled,
  onToggleDefault,
  onRefreshConfig,
}: Props) => {
  const { t } = useTranslation(["common"]);
  const appToast = useAppToast();
  const [showDefaultSlots, setShowDefaultSlots] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [busyLoader, setBusyLoader] = useState({
    show: false,
    msg: "",
  });

  const handleToggleDefault = async () => {
    if (isDefaultEnabled) {
      // Show confirmation dialog when disabling
      setShowAlertDialog(true);
    } else {
      // Enable directly
      await handleDefaultConfigToggle(true);
    }
  };

  const handleConfirmDisable = async () => {
    setShowAlertDialog(false);
    await new Promise((resolve) => setTimeout(resolve, 300));
    await handleDefaultConfigToggle(false);
  };

  const handleDefaultConfigToggle = async (enabled: boolean) => {
    try {
      setBusyLoader({
        show: true,
        msg: t("pleaseWait"),
      });

      if (!enabled) {
        // Call the API to remove default config when disabling
        const franchiseId = AuthService.getLoggedInUserId();
        const response = await PosService.removeDefaultDeliveryTimeSlot({
          hardDelete: false,
          franchiseId: franchiseId,
        });

        // Handle API response based on statusCode
        if (response.statusCode === 200 || response.statusCode === 201) {
          onToggleDefault(enabled);
          // Refresh parent config data
          if (onRefreshConfig) {
            onRefreshConfig();
          }
          appToast.show({
            msg: t("defaultConfigDisabled"),
            color: "success",
          });
        } else {
          // Show error message from API
          const errorMessage = response.data?.message || t("errorOccurred");
          appToast.show({
            msg: errorMessage,
            color: "danger",
          });
        }
      } else {
        // Call the API to create default config when enabling
        const loggedInUser = AuthService.getLoggedInUser();
        const franchiseId = AuthService.getLoggedInUserId();

        const response = await PosService.createDefaultDeliveryTimeSlotConfig({
          franchiseId: franchiseId,
          franchiseInfo: {
            name: loggedInUser.name || "",
            id: franchiseId,
            refId: loggedInUser.franchiseId,
          },
        });

        // Handle API response based on statusCode
        if (response.statusCode === 200 || response.statusCode === 201) {
          onToggleDefault(enabled);
          // Refresh parent config data
          if (onRefreshConfig) {
            onRefreshConfig();
          }
          appToast.show({
            msg: t("defaultConfigEnabled"),
            color: "success",
          });
        } else {
          // Show error message from API
          const errorMessage = response.data?.message || t("errorOccurred");
          appToast.show({
            msg: errorMessage,
            color: "danger",
          });
        }
      }
    } catch (error: any) {
      // Handle error response
      const errorMessage =
        error?.response?.data?.message || error?.message || t("errorOccurred");
      appToast.show({
        msg: errorMessage,
        color: "danger",
      });
    } finally {
      setBusyLoader({
        show: false,
        msg: "",
      });
    }
  };

  const handleCancelDisable = () => {
    setShowAlertDialog(false);
  };

  const handleDefaultSlotsModalCallback = (action: "close" | "submit") => {
    setShowDefaultSlots(false);
  };

  return (
    <>
      <AppCard
        className={`tw:mb-3 tw:transition-all tw:duration-200 ${
          isDefaultEnabled
            ? "tw:border-l-4 tw:border-l-green-500 tw:bg-green-50/50"
            : "tw:border-l-4 tw:border-l-gray-300 tw:bg-gray-50/50"
        }`}
      >
        <div className="tw:flex tw:flex-col tw:sm:flex-row tw:sm:items-center tw:sm:justify-between tw:gap-3">
          <div className="tw:flex tw:items-center tw:gap-3 tw:flex-1 tw:min-w-0">
            <div
              className={`tw:p-2 tw:rounded-full tw:transition-colors tw:duration-200 tw:flex-shrink-0 ${
                isDefaultEnabled ? "tw:bg-green-100" : "tw:bg-gray-100"
              }`}
            >
              <Settings
                size={16}
                className={`tw:transition-colors tw:duration-200 ${
                  isDefaultEnabled ? "tw:text-green-600" : "tw:text-gray-500"
                }`}
              />
            </div>
            <div className="tw:flex-1 tw:min-w-0">
              <div className="tw:flex tw:items-center tw:gap-2 tw:mb-0.5">
                <h3
                  className={`tw:text-sm tw:font-semibold tw:transition-colors tw:duration-200 tw:truncate ${
                    isDefaultEnabled ? "tw:text-green-900" : "tw:text-gray-700"
                  }`}
                >
                  {t("defaultDeliveryConfiguration")}
                </h3>
                <div
                  className={`tw:w-2 tw:h-2 tw:rounded-full tw:flex-shrink-0 ${
                    isDefaultEnabled
                      ? "tw:bg-green-500 tw:animate-pulse"
                      : "tw:bg-gray-400"
                  }`}
                ></div>
              </div>
              <p
                className={`tw:text-xs tw:transition-colors tw:duration-200 tw:line-clamp-1 ${
                  isDefaultEnabled ? "tw:text-green-700" : "tw:text-gray-500"
                }`}
              >
                {isDefaultEnabled
                  ? t("defaultConfigActive")
                  : t("defaultConfigInactive")}
              </p>
            </div>
          </div>

          <AppButton
            onClick={handleToggleDefault}
            color={isDefaultEnabled ? "danger" : "success"}
            fill="solid"
            size="small"
            className="tw:text-xs tw:px-3 tw:py-1.5 tw:w-full tw:sm:w-auto tw:flex-shrink-0"
          >
            {isDefaultEnabled ? (
              <>
                <PowerOff size={12} />
                <span className="tw:ml-1">{t("disable")}</span>
              </>
            ) : (
              <>
                <Power size={12} />
                <span className="tw:ml-1">{t("enable")}</span>
              </>
            )}
          </AppButton>
        </div>
      </AppCard>

      <AppAlertDialog
        show={showAlertDialog}
        title={t("disableDefaultConfig")}
        description={t("disableDefaultConfigConfirmation")}
        onConfirm={handleConfirmDisable}
        onCancel={handleCancelDisable}
        type="confirm"
        okText={t("disable")}
        cancelText={t("cancel")}
      />

      <BusyLoader show={busyLoader.show} message={busyLoader.msg} />
    </>
  );
};

export default DefaultConfigBlock;
