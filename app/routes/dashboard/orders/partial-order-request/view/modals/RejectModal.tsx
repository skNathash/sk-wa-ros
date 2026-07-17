import { useState } from "react";
import { useForm } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import AppTextarea from "~/components/core/form/AppTextarea";
import AppModal from "~/components/core/modal/AppModal";
import { XCircle, X } from "lucide-react";
import useAppToast from "~/hooks/useAppToast";
import OmsService from "~/services/OmsService";

type FormData = {
  remarks: string;
};

interface RejectModalProps {
  show: boolean;
  requestId: string;
  callback: (a: { action: string; data?: any }) => void;
}

const RejectModal = ({ show, requestId, callback }: RejectModalProps) => {
  const appToast = useAppToast();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    callback({ action: "close" });
  };

  const onSubmit = async (data: FormData) => {
    try {
      setSubmitting(true);
      const resp: any = await OmsService.rejectSplitRequest(requestId, data.remarks);
      
      if (resp?.statusCode === 200) {
        appToast.show({
          msg: "Request rejected successfully",
          color: "success",
        });
        callback({ action: "submit", data });
      } else {
        appToast.show({
          msg: resp?.data?.message || "Failed to reject request",
          color: "danger",
        });
      }
    } catch (error: any) {
      console.error(error);
      appToast.show({
        msg: error?.message || "Failed to reject request",
        color: "danger",
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
              Provide reason for rejecting request #{requestId}
            </div>
          </div>
        </div>
      </AppModal.Title>
      <AppModal.Content>
        <form id="reject-form" onSubmit={handleSubmit(onSubmit)}>
          <AppTextarea
            label="Remarks"
            name="remarks"
            isRequired
            register={register}
            placeholder="Enter reason for rejection..."
            error={errors.remarks?.message}
          />
        </form>
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
            type="submit"
            form="reject-form"
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
