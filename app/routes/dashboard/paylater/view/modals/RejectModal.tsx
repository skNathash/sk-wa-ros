import { useState } from "react";
import { useForm } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import AppTextarea from "~/components/core/form/AppTextarea";
import AppModal from "~/components/core/modal/AppModal";
import { XCircle, X } from "lucide-react";
import useAppToast from "~/hooks/useAppToast";
import PaylaterService from "~/services/PaylaterService";

type FormData = {
  remarks: string;
};

const RejectModal = ({
  show,
  callback,
  requestId,
  userName,
}: {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  requestId: string;
  userName?: string | null;
}) => {
  const appToast = useAppToast();

  const { register, getValues } = useForm<FormData>({
    defaultValues: {
      remarks: "",
    },
  });

  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    callback({ action: "close" });
  };

  const validateForm = () => {
    const formData = getValues();
    let msg = "";

    if (!formData.remarks?.trim()) {
      msg = "Please enter remarks";
    }

    return {
      msg,
      status: !msg,
    };
  };

  const handleSubmit = async () => {
    const { status, msg } = validateForm();

    if (!status) {
      appToast.show({
        msg,
        color: "error",
      });
      return;
    }

    const formData = getValues();

    try {
      setSubmitting(true);
      const resp = await PaylaterService.rejectRequest(requestId, {
        action: "reject",
        reason: formData.remarks || "",
      });
      if (resp.statusCode === 200) {
        appToast.show({
          msg: "Request rejected successfully",
          color: "success",
        });
        callback({ action: "submit" });
      } else {
        appToast.show({
          msg: resp.data?.message || "Failed to reject request",
          color: "error",
        });
      }
    } catch (error) {
      console.error(error);
      appToast.show({
        msg: "Failed to reject request",
        color: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppModal show={show} callback={callback} backdropDismiss={false}>
      <AppModal.Title onClose={handleClose}>
        <div className="tw:flex tw:items-start tw:gap-3">
          <XCircle className="tw:text-red-500 tw:mt-1" size={20} />
          <div>
            <div className="tw:font-semibold">Reject Request</div>
            <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
              Provide reason for rejecting "{userName || "customer"}"
            </div>
          </div>
        </div>
      </AppModal.Title>
      <AppModal.Content>
        <AppTextarea
          label="Enter Remarks"
          name="remarks"
          isRequired
          register={register}
        />
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-2">
          <AppButton
            onClick={handleClose}
            color="secondary"
            fill="outline"
            disabled={submitting}
          >
            <X size={14} />
            Cancel
          </AppButton>
          <AppButton
            onClick={handleSubmit}
            color="danger"
            fill="solid"
            disabled={submitting}
            isLoading={submitting}
          >
            <XCircle size={14} />

            {submitting ? "Rejecting..." : "Reject Request"}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default RejectModal;
