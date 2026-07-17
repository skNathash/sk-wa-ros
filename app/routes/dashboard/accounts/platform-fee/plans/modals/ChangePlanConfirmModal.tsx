import React from "react";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import Amount from "~/components/core/amount/Amount";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

type Props = {
  show: boolean;
  callback: (payload: { action: string; data?: any }) => void;
  data?: {
    name?: string;
    amount?: number;
    gst?: number;
    _id?: string;
    subscriptionAmount?: number;
    newPlanName?: string;
    currentPlan?: {
      name?: string;
      remainingDays?: number;
      availableAmount?: number;
    };
  };
};

const ChangePlanConfirmModal: React.FC<Props> = ({ show, callback, data }) => {
  const { t } = useTranslation("platformFee");
  const currentPlanName = data?.currentPlan?.name || "Current Plan";
  const newPlanName = data?.newPlanName || "New Plan";
  const availableAmount = data?.currentPlan?.availableAmount || 0;

  const isSamePlan = currentPlanName === newPlanName;
  const modalTitle = isSamePlan
    ? t("confirmPlanRenewal")
    : t("confirmPlanChange");

  const handleClose = () => {
    callback({ action: "close" });
  };

  const handleConfirm = () => {
    callback({
      action: "confirm",
    });
  };

  return (
    <AppModal show={show} callback={handleClose} className="tw:max-h-[90vh]">
      <AppModal.Title onClose={handleClose} noShadow>
        <div className="tw:font-semibold tw:text-lg">{modalTitle}</div>
      </AppModal.Title>

      <AppModal.Content className="tw:max-h-[90vh]">
        <div className="tw:flex tw:flex-col tw:gap-3">
          {/* Change Info Header */}
          <div className="tw:p-1">
            <p className="tw:text-sm tw:text-gray-600">
              {isSamePlan ? (
                <>{t("renewingPlan", { currentPlanName })}</>
              ) : (
                <>{t("switchingPlan", { currentPlanName, newPlanName })}</>
              )}
            </p>
          </div>

          {/* Remaining Amount - Loss Warning */}
          {availableAmount > 0 && (
            <div className="tw:bg-red-50 tw:border-2 tw:border-red-300 tw:rounded-lg tw:p-4">
              <div className="tw:flex tw:items-start tw:gap-2">
                <AlertTriangle className="tw:w-6 tw:h-6 tw:text-red-600 tw:flex-shrink-0 tw:mt-0.5" />
                <div className="tw:flex-1">
                  <div className="tw:text-base tw:font-bold tw:text-red-900 tw:mb-2">
                    {t("remainingLimitWillBeLost")}
                  </div>
                  <div className="tw:bg-white tw:rounded-md tw:p-3 tw:mb-2">
                    <div className="tw:text-xs tw:text-gray-600 tw:mb-1">
                      {t("currentAvailableLimit")}
                    </div>
                    <div className="tw:text-2xl tw:font-bold tw:text-red-600">
                      <Amount value={availableAmount} decimalPlaces={2} />
                    </div>
                  </div>
                  <div className="tw:text-sm tw:font-semibold tw:text-red-800">
                    {t("limitNotCarriedForward")}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Warning Section */}
          <div className="tw:bg-amber-50 tw:border tw:border-amber-200 tw:rounded-lg tw:p-3">
            <div className="tw:flex tw:items-start tw:gap-2">
              <AlertTriangle className="tw:w-5 tw:h-5 tw:text-amber-600 tw:flex-shrink-0 tw:mt-0.5" />
              <div className="tw:flex-1">
                <div className="tw:text-sm tw:font-semibold tw:text-amber-800 tw:mb-1">
                  {t("importantNotice")}
                </div>
                <ul className="tw:text-xs tw:text-amber-700 tw:space-y-1 tw:list-disc tw:list-inside">
                  {isSamePlan ? (
                    <>
                      <li>
                        {t("planRenewedImmediately", { currentPlanName })}
                      </li>
                      <li>{t("subscriptionContinues")}</li>
                    </>
                  ) : (
                    <>
                      <li>
                        {t("planTerminatedImmediately", { currentPlanName })}
                      </li>
                      <li>{t("remainingNotTransferred")}</li>
                      <li>{t("newPlanStartsImmediately", { newPlanName })}</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="tw:bg-blue-50 tw:border tw:border-blue-100 tw:rounded-lg tw:p-3">
            <div className="tw:text-sm tw:text-blue-800">
              {isSamePlan ? t("confirmRenew") : t("confirmChange")}
            </div>
          </div>
        </div>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-2 tw:w-full">
          <AppButton
            type="button"
            fill="outline"
            color="medium"
            onClick={handleClose}
          >
            {t("cancel")}
          </AppButton>
          <AppButton type="button" color="primary" onClick={handleConfirm}>
            {t("continue")}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default ChangePlanConfirmModal;
