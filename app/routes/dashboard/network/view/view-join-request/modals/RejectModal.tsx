import React, { useState } from "react";
import { useForm } from "react-hook-form";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import AppTextarea from "~/components/core/form/AppTextarea";
import FranchiseService from "~/services/FranchiseService";
import useAppToast from "~/hooks/useAppToast";

interface RejectModalProps {
  show: boolean;
  requestId: string;
  callback: (action: { action: string }) => void;
}

interface FormValues {
  remarks: string;
}

const RejectModal: React.FC<RejectModalProps> = ({
  show,
  requestId,
  callback,
}) => {
  const [loading, setLoading] = useState(false);
  const { show: showToast } = useAppToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    defaultValues: {
      remarks: "",
    },
  });

  const handleClose = () => {
    reset();
    callback({ action: "close" });
  };

  const onSubmit = async (data: FormValues) => {
    if (!data.remarks.trim()) {
      showToast({
        msg: "Please provide rejection remarks",
        color: "danger",
      });
      return;
    }

    try {
      setLoading(true);

      const response = await FranchiseService.updateNetworkRequest(requestId, {
        status: "Rejected",
        responseMessage: data.remarks.trim(),
      });

      const statusCode = (response as any)?.statusCode;

      if (statusCode !== 200) {
        showToast({
          msg:
            (response as any)?.message ||
            "Failed to reject the join request. Please try again.",
          color: "danger",
        });
        return;
      }

      showToast({
        msg: "Join request has been rejected successfully.",
        color: "success",
      });

      reset();
      callback({ action: "rejected" });
    } catch (error: any) {
      console.error("Error rejecting join request:", error);
      showToast({
        msg:
          error?.message ||
          "Unable to reject the join request. Please try again.",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppModal show={show} callback={handleClose}>
      <AppModal.Title onClose={handleClose}>
        <div className="tw:font-semibold tw:text-lg">Reject Join Request</div>
        <div className="tw:text-sm tw:text-gray-500">
          Please provide a reason for rejecting this join request
        </div>
      </AppModal.Title>

      <AppModal.Content>
        <form onSubmit={handleSubmit(onSubmit)} className="tw:space-y-4">
          <AppTextarea
            name="remarks"
            register={register}
            label="Rejection Remarks"
            placeholder="Enter the reason for rejecting this join request..."
            rows={5}
            maxLength={500}
            isRequired
            error={errors.remarks?.message}
            rules={{
              required: "Rejection remarks are required",
              minLength: {
                value: 10,
                message: "Please provide at least 10 characters",
              },
            }}
          />

          <div className="tw:flex tw:justify-end tw:gap-3 tw:pt-4">
            <AppButton
              type="button"
              onClick={handleClose}
              color="secondary"
              fill="outline"
              disabled={loading}
            >
              Cancel
            </AppButton>
            <AppButton
              type="submit"
              color="danger"
              fill="solid"
              isLoading={loading}
              disabled={loading}
            >
              {loading ? "Rejecting..." : "Reject Request"}
            </AppButton>
          </div>
        </form>
      </AppModal.Content>
    </AppModal>
  );
};

export default RejectModal;
