import React from "react";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import { AlertTriangle, Info, XCircle, Wallet } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import FranchiseService from "~/services/FranchiseService";
import useAppToast from "~/hooks/useAppToast";
import { useTranslation } from "react-i18next";

type Props = {
  show: boolean;
  callback: (payload: { action: string; data?: any }) => void;
  plan: any;
};

const CancelPlanModal: React.FC<Props> = ({ show, callback, plan }) => {
  const appToast = useAppToast();
  const { t } = useTranslation("platformFee");
  const [loading, setLoading] = React.useState(false);
  const handleClose = () => {
    callback({ action: "close" });
  };

  const handleConfirm = async () => {
    const planId = plan?.subscriptionId;

    if (!planId) {
      appToast.show({ msg: t("planIdMissing"), color: "danger" });
      return;
    }

    setLoading(true);
    try {
      const resp = await FranchiseService.cancelServiceFeeSubscription(planId);
      if (resp.statusCode === 200) {
        appToast.show({
          msg: resp?.data?.message || t("planCancelledSuccessfully"),
          color: "success",
        });
        callback({ action: "cancelled", data: { planId } });
      } else {
        appToast.show({
          msg: resp.data?.message || t("failedToCancelPlan"),
          color: "danger",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppModal show={show} callback={handleClose} className="tw:max-h-[90vh]">
      <AppModal.Title onClose={handleClose} noShadow>
        <div className="tw:font-bold tw:text-lg tw:text-red-600 tw:flex tw:items-center tw:gap-2">
          <AlertTriangle className="tw:w-5 tw:h-5" />
          {t("cancelSubscription")}
        </div>
      </AppModal.Title>

      <AppModal.Content className="tw:max-h-[90vh]">
        <div className="tw:flex tw:flex-col tw:gap-4 tw:py-2">
          {/* Warning Banner */}
          <div className="tw:bg-red-50 tw:border tw:border-red-100 tw:rounded-xl tw:p-4 tw:flex tw:items-start tw:gap-3">
            <div className="tw:p-2 tw:bg-red-100 tw:rounded-full tw:shrink-0">
              <XCircle className="tw:text-red-600 tw:w-5 tw:h-5" />
            </div>
            <div>
              <h4 className="tw:text-sm tw:font-bold tw:text-red-800 tw:mb-1">
                {t("stopPlan", { planName: plan?.planName || "Plan" })}
              </h4>
              <p className="tw:text-xs tw:text-red-700 tw:leading-relaxed">
                {t("cancelWarning")}
              </p>
            </div>
          </div>

          {/* Balance Loss Warning - show only when there is amount to lose */}
          {Number(plan?.availableAmount || 0) > 0 && (
            <div className="tw:bg-white tw:border-2 tw:border-amber-100 tw:rounded-xl tw:p-4 tw:flex tw:items-center tw:gap-4 tw:shadow-xs">
              <div className="tw:p-2.5 tw:bg-amber-100 tw:rounded-xl">
                <Wallet className="tw:w-6 tw:h-6 tw:text-amber-600" />
              </div>
              <div className="tw:flex-1">
                <div className="tw:text-[10px] tw:font-bold tw:text-gray-500 tw:uppercase tw:tracking-wider tw:mb-0.5">
                  {t("unusedPlanLimit")}
                </div>
                <div className="tw:text-xl tw:font-black tw:text-gray-900">
                  <Amount value={plan?.availableAmount || 0} />
                </div>
              </div>
              <div className="tw:text-right">
                <span className="tw:text-[10px] tw:font-bold tw:text-red-600 tw:bg-red-50 tw:px-2 tw:py-1 tw:rounded-md tw:uppercase">
                  {t("willBeLost")}
                </span>
              </div>
            </div>
          )}

          {/* Impact Summary */}
          <div className="tw:bg-gray-50 tw:rounded-xl tw:p-4 tw:border tw:border-gray-200">
            <h5 className="tw:text-xs tw:font-bold tw:text-gray-500 tw:uppercase tw:tracking-wider tw:mb-3">
              {t("whatHappensNext")}
            </h5>
            <div className="tw:space-y-3">
              <div className="tw:flex tw:items-start tw:gap-2.5">
                <div className="tw:w-1.5 tw:h-1.5 tw:bg-gray-400 tw:rounded-full tw:mt-1.5 tw:shrink-0"></div>
                <p className="tw:text-xs tw:text-gray-600">
                  {t("subscriptionTerminated")}
                </p>
              </div>
              <div className="tw:flex tw:items-start tw:gap-2.5">
                <div className="tw:w-1.5 tw:h-1.5 tw:bg-gray-400 tw:rounded-full tw:mt-1.5 tw:shrink-0"></div>
                <p className="tw:text-xs tw:text-gray-600">{t("noRefund")}</p>
              </div>
              <div className="tw:flex tw:items-start tw:gap-2.5">
                <div className="tw:w-1.5 tw:h-1.5 tw:bg-gray-400 tw:rounded-full tw:mt-1.5 tw:shrink-0"></div>
                <p className="tw:text-xs tw:text-gray-600">
                  {t("needNewPlan")}
                </p>
              </div>
            </div>
          </div>

          {/* Simple Note for rural people */}
          <div className="tw:flex tw:items-center tw:gap-2 tw:bg-amber-50 tw:p-3 tw:rounded-lg tw:border tw:border-amber-100">
            <Info className="tw:w-4 tw:h-4 tw:text-amber-600 tw:shrink-0" />
            <p className="tw:text-[11px] tw:text-amber-800 tw:font-medium">
              {t("confirmCancel")}
            </p>
          </div>
        </div>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:flex-row tw:gap-2 tw:w-full">
          <AppButton
            type="button"
            fill="clear"
            color="medium"
            onClick={handleClose}
            className="tw:flex-1"
          >
            {t("keepPlan")}
          </AppButton>
          <AppButton
            type="button"
            color="danger"
            onClick={handleConfirm}
            isLoading={loading}
            className="tw:flex-1 tw:font-bold"
          >
            {t("yesCancelPlan")}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default CancelPlanModal;
