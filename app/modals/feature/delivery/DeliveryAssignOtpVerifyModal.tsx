import { Key } from "lucide-react";
import { useForm } from "react-hook-form";
import { useState } from "react";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import { AppInput } from "~/components/core/form";
import LogisticsService from "~/services/LogisticsService";
import useAppToast from "~/hooks/useAppToast";
import { useTranslation } from "react-i18next";

type Props = {
  show: boolean;
  callback: (params: { action: string; data?: any }) => void;
  data?: {
    orderId?: string;
    orderRefNo?: string;
    assignmentResponse?: any;
    deliveryPersonName?: string;
    deliveryPersonContact?: string;
  };
};

const DeliveryAssignOtpVerifyModal = ({ show, callback, data }: Props) => {
  const { t } = useTranslation(["common"]);
  const appToast = useAppToast();
  const [verifying, setVerifying] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      otp: "",
    },
  });

  const onSubmit = async (formData: { otp: string }) => {
    if (!formData.otp || formData.otp.length !== 6) {
      appToast.show({
        msg: t("pleaseEnterValid6DigitOtp"),
        color: "danger",
      });
      return;
    }

    if (!data?.assignmentResponse?.shipmentId) {
      appToast.show({
        msg: t("shipmentIdNotFoundPleaseTryAgain"),
        color: "danger",
      });
      return;
    }

    setVerifying(true);
    try {
      const response = await LogisticsService.verifyDeliveryCode({
        shipmentId: data.assignmentResponse.shipmentId,
        approveAuthCode: formData.otp,
        remarks: t("verifyingDeliveryCode"),
      });

      if (response.statusCode === 200) {
        appToast.show({
          msg: t("deliveryCodeVerifiedSuccessfully"),
          color: "success",
        });
        callback({ action: "success", data: response.data });
        reset();
      } else {
        appToast.show({
          msg: response.data?.message || t("failedToVerifyDeliveryCode"),
          color: "danger",
        });
      }
    } catch (error) {
      appToast.show({
        msg: t("anErrorOccurredWhileVerifyingTheCode"),
        color: "danger",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleClose = () => {
    reset();
    callback({ action: "close" });
  };

  const handleBack = () => {
    reset();
    callback({ action: "back" });
  };

  return (
    <AppModal show={show} callback={handleClose}>
      <AppModal.Title onClose={handleClose}>
        <div className="tw:text-lg tw:font-semibold tw:text-gray-900">
          {t("verifyDeliveryAssignment")}
        </div>
        <div className="tw:text-xs tw:text-gray-600 tw:mt-1">
          {t("enterTheOtpSentToTheDeliveryPersonnelAgencyToConfirmDispatch")}
        </div>
      </AppModal.Title>

      <AppModal.Content>
        <div className="tw:flex tw:flex-col tw:items-center tw:justify-center">
          {/* Icon */}
          <div className="tw:w-16 tw:h-16 tw:bg-blue-100 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:mb-6">
            <Key className="tw:w-8 tw:h-8 tw:text-blue-600" />
          </div>

          {/* Main Heading */}
          <h2 className="tw:text-xl tw:font-bold tw:text-gray-900 tw:mb-2">
            {t("otpVerification")}
          </h2>

          {/* Compact Order + Assigned Info */}
          {(data?.orderRefNo ||
            data?.deliveryPersonName ||
            data?.deliveryPersonContact) && (
            <div className="tw:w-full tw:rounded tw:border tw:border-slate-200 tw:bg-slate-50 tw:p-2 tw:mb-4">
              <div className="tw:flex tw:flex-col tw:gap-1">
                {data?.orderRefNo && (
                  <div className="tw:text-xs tw:text-gray-600">
                    <span className="tw-text-gray-500">{t("order")}:</span>{" "}
                    <span className="tw-text-gray-900 tw-font-medium">
                      {data.orderRefNo}
                    </span>
                  </div>
                )}
                {(data?.deliveryPersonName || data?.deliveryPersonContact) && (
                  <div className="tw:flex tw:items-center tw:gap-3 tw:text-xs tw:text-gray-600">
                    <span className="tw-text-gray-500">{t("assigned")}:</span>
                    {data?.deliveryPersonName && (
                      <span className="tw-text-gray-900">
                        <span className="tw-text-gray-500">{t("name")}:</span>{" "}
                        <span className="tw-font-medium">
                          {data.deliveryPersonName}
                        </span>
                      </span>
                    )}
                    {data?.deliveryPersonContact && (
                      <span className="tw-text-gray-800">
                        <span className="tw-text-gray-500">
                          {t("contact")}:
                        </span>{" "}
                        {data.deliveryPersonContact}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Instruction Text */}
          <p className="tw:text-sm tw:text-gray-600 tw:mb-6 tw:text-center">
            {t("enterThe6DigitCodeToFinalizeDispatch")}
          </p>

          {/* OTP Input Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="tw:w-full tw:max-w-sm"
          >
            <AppInput
              label=""
              name="otp"
              register={register}
              placeholder={t("enter6DigitOtp")}
              className="tw:text-center tw:text-lg tw:font-mono"
              maxLength={6}
              isRequired={true}
              error={errors.otp?.message}
            />
          </form>
        </div>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-3 tw:w-full">
          <AppButton fill="outline" onClick={handleBack} disabled={verifying}>
            {t("back")}
          </AppButton>
          <AppButton
            onClick={handleSubmit(onSubmit)}
            isLoading={verifying}
            disabled={verifying}
          >
            {t("verifyAndDispatch")}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default DeliveryAssignOtpVerifyModal;
