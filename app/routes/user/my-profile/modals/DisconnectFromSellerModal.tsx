import React, { useState } from "react";
import { useForm } from "react-hook-form";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import AppTextarea from "~/components/core/form/AppTextarea";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import FranchiseService from "~/services/FranchiseService";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";

type DisconnectFromSellerModalProps = {
  show: boolean;
  onClose: (r?: { action: string; data?: any }) => void;
  title?: string;
};

type FormValues = {
  remarks: string;
};

const DisconnectFromSellerModal: React.FC<DisconnectFromSellerModalProps> = ({
  show,
  onClose,
  title = "Disconnect from Seller",
}) => {
  const { show: toast } = useAppToast();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const {
    register,
    getValues,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    defaultValues: { remarks: "" },
  });

  const userInfo = AuthService.getLoggedInUser();

  const handleClose = () => {
    reset();
    onClose({ action: "close" });
  };

  const handleSubmit = async () => {
    if (submitting) return;
    const data = getValues();
    const disconnectRequestMessage = data?.remarks || "";
    try {
      setSubmitting(true);
      const resp = await FranchiseService.createDisconnectionRequest({
        disconnectRequestMessage,
        // status: "Disconnected",
      });
      if (resp?.statusCode === 200) {
        toast({ msg: "Disconnect request sent", color: "success" });
        reset();
        onClose({ action: "submit", data });
      } else {
        const msg = resp?.data?.message || "Failed to send disconnect request";
        toast({ msg, color: "danger" });
      }
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.message ||
        "Failed to send disconnect request";
      toast({ msg, color: "danger" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppModal show={show} callback={handleClose}>
      <AppModal.Title onClose={handleClose} noShadow>
        <div className="tw:font-semibold">
          {title} - &quot;{userInfo?.linkedFranchise?.name}&quot;
        </div>
      </AppModal.Title>

      <AppModal.Content className="tw:py-4">
        <div className="tw:flex tw:flex-col tw:gap-4">
          <InfoBlock variant="warning" size="sm">
            A disconnect request will be sent to the seller. Please provide your
            remarks to help us process this request. No changes will be made
            immediately.
          </InfoBlock>

          <AppTextarea
            name="remarks"
            label="Remarks"
            placeholder="Enter your remarks"
            register={register}
            rules={{ required: "Remarks are required", maxLength: 500 }}
            error={errors?.remarks?.message as string}
            rows={5}
            inputClassName="tw:text-sm"
          />
        </div>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-2">
          <AppButton
            type="button"
            fill="outline"
            color="medium"
            onClick={handleClose}
          >
            Cancel
          </AppButton>
          <AppButton
            type="button"
            color="primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit"}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default DisconnectFromSellerModal;
