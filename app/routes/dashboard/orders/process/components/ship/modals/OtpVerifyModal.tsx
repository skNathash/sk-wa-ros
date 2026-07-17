import { Key } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import { AppInput } from "~/components/core/form";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import LogisticsService from "~/services/LogisticsService";

type Props = {
  show: boolean;
  callback: (params: { action: string; data?: any }) => void;
  shipmentId: string;
  invoiceRefId?: string;
};

const OtpVerifyModal = ({
  show,
  callback,
  shipmentId,
  invoiceRefId,
}: Props) => {
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

  const onSubmit = async (data: { otp: string }) => {
    if (!data.otp || data.otp.length !== 6) {
      appToast.show({
        msg: "Please enter a valid 6-digit OTP",
        color: "danger",
      });
      return;
    }

    setVerifying(true);
    try {
      const response = await LogisticsService.verifyDeliveryCode({
        shipmentId: shipmentId,
        approveAuthCode: data.otp,
        remarks: "Verifying Delivery Code",
      });

      if (response.statusCode === 200) {
        appToast.show({
          msg: "Delivery code verified successfully",
          color: "success",
        });
        callback({ action: "success", data: response.data });
        reset();
      } else {
        appToast.show({
          msg: response.data?.message || "Failed to verify delivery code",
          color: "danger",
        });
      }
    } catch (error) {
      appToast.show({
        msg: "An error occurred while verifying the code",
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
          Assign Delivery for #{invoiceRefId || shipmentId}
        </div>
        <div className="tw:text-xs tw:text-gray-600 tw:mt-1">
          Enter the OTP sent to the delivery personnel/agency to confirm
          dispatch.
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
            OTP Verification
          </h2>

          {/* Instruction Text */}
          <p className="tw:text-sm tw:text-gray-600 tw:mb-6 tw:text-center">
            Enter the 6-digit code to finalize dispatch.
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
              placeholder="Enter 6-digit OTP"
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
            Back
          </AppButton>
          <AppButton
            onClick={handleSubmit(onSubmit)}
            isLoading={verifying}
            disabled={verifying}
          >
            Verify & Dispatch
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default OtpVerifyModal;
