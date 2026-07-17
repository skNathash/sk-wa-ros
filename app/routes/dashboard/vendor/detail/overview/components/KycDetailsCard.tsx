import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import OtpModal from "~/modals/core/otp-modal/OtpModal";
import VendorService from "~/services/VendorService";
import useAppToast from "~/hooks/useAppToast";
import clsx from "clsx";

interface KycDetailsCardProps {
  status?: string;
  vendorId?: string;
  mobile?: string;
  isCreatedByMe?: boolean;
}

const KycDetailsCard: React.FC<KycDetailsCardProps> = ({
  status = "Verified",
  vendorId = "",
  mobile = "",
  isCreatedByMe = false,
}) => {
  const { t } = useTranslation(["common"]);
  const appToast = useAppToast();
  const isPending = status === "Pending";

  // OTP related state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpId, setOtpId] = useState<string>("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [generatingOtp, setGeneratingOtp] = useState(false);

  // OTP handlers
  const handleGenerateOtp = async () => {
    if (!vendorId) {
      appToast.show({
        msg: t("vendorIdRequired"),
        color: "danger",
      });
      return;
    }

    try {
      setGeneratingOtp(true);
      const response = await VendorService.resendOtp(vendorId);

      if (response.statusCode === 200) {
        setOtpId(response.data.data.otpRequestId);
        setShowOtpModal(true);
        appToast.show({
          msg: t("otpSentSuccessfully"),
          color: "success",
        });
      } else {
        appToast.show({
          msg: response.data?.message || t("failedToGenerateOtp"),
          color: "danger",
        });
      }
    } catch (error: any) {
      console.error("Error generating OTP:", error);
      appToast.show({
        msg: error?.response?.data?.message || t("failedToGenerateOtp"),
        color: "danger",
      });
    } finally {
      setGeneratingOtp(false);
    }
  };

  const handleVerifyOtp = async ({ otp }: { otp: number }) => {
    try {
      setVerifyingOtp(true);

      // {
      //   id: vendorId,
      //   otp: otp.toString(),
      //   otpId: otpId,
      // }
      const response = await VendorService.verifyOtp(
        vendorId,
        otp.toString(),
        otpId
      );

      if (response.statusCode === 200) {
        appToast.show({
          msg: t("kycVerificationCompleted"),
          color: "success",
        });
        setShowOtpModal(false);
        // Refresh vendor data to update status
        window.location.reload();
      } else {
        appToast.show({
          msg: response.data?.message || t("invalidOtp"),
          color: "danger",
        });
      }
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      appToast.show({
        msg: error?.response?.data?.message || t("failedToVerifyOtp"),
        color: "danger",
      });
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setResendingOtp(true);
      const response = await VendorService.resendOtp(vendorId);

      if (response.statusCode === 200) {
        setOtpId(response.data.data.otpRequestId);
        appToast.show({
          msg: t("otpResentSuccessfully"),
          color: "success",
        });
      } else {
        appToast.show({
          msg: response.data?.message || t("failedToResendOtp"),
          color: "danger",
        });
      }
    } catch (error: any) {
      console.error("Error resending OTP:", error);
      appToast.show({
        msg: error?.response?.data?.message || t("failedToResendOtp"),
        color: "danger",
      });
    } finally {
      setResendingOtp(false);
    }
  };

  const handleCloseOtpModal = () => {
    setShowOtpModal(false);
    setOtpId("");
  };

  return (
    <>
      <AppCard title={t("mobileVerification")} icon="shield-check">
        <div className="tw:flex tw:flex-col">
          <span className="tw:text-sm tw:text-gray-600">{t("status")}</span>
          <div className="tw:flex tw:items-center tw:gap-1">
            {isPending ? (
              <ShieldAlert className="tw:w-4 tw:h-4 tw:text-orange-500" />
            ) : (
              <ShieldCheck className="tw:w-4 tw:h-4 tw:text-green-500" />
            )}
            <span
              className={`tw:text-sm tw:font-semibold ${
                isPending ? "tw:text-orange-600" : "tw:text-green-600"
              }`}
            >
              {status}
            </span>
          </div>
        </div>

        {isPending && vendorId && isCreatedByMe && (
          <div className="tw:pt-2">
            <AppButton
              size="small"
              color="primary"
              onClick={handleGenerateOtp}
              isLoading={generatingOtp}
              className="tw:w-full"
            >
              {t("verifyOtp")}
            </AppButton>
          </div>
        )}

        <div
          className={clsx("tw:text-xs  tw:mt-1", {
            "tw:text-green-500": !isPending,
            "tw:text-orange-500": isPending,
          })}
        >
          {isPending
            ? t("kycVerificationPending")
            : t("kycVerificationCompletedMessage")}
        </div>
      </AppCard>

      <OtpModal
        show={showOtpModal}
        verify={handleVerifyOtp}
        resend={handleResendOtp}
        close={handleCloseOtpModal}
        mobile={mobile}
        validating={verifyingOtp}
        resending={resendingOtp}
      />
    </>
  );
};

export default KycDetailsCard;
