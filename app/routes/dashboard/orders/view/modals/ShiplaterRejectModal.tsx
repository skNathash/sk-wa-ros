import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppModal from "~/components/core/modal/AppModal";
import AppTextarea from "~/components/core/form/AppTextarea";
import AppButton from "~/components/core/button/AppButton";
import OmsService from "~/services/OmsService";
import useAppToast from "~/hooks/useAppToast";
import AppSpinner from "~/components/core/Spinner/AppSpinner";

interface ShiplaterRejectModalProps {
  show: boolean;
  orderId: string;
  callback: (data: { action: string; data?: any }) => void;
}

interface FormData {
  remarks: string;
}

const ShiplaterRejectModal = ({
  show,
  orderId,
  callback,
}: ShiplaterRejectModalProps) => {
  const { t } = useTranslation(["common"]);
  const [loading, setLoading] = useState(false);
  const { show: showToast } = useAppToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      remarks: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const response: any = await OmsService.respondShipLaterRequest(orderId, {
        acceptRequest: false,
        remarks: data.remarks,
      });
      if (response.statusCode === 200) {
        showToast({
          msg: t("shipLaterRequestRejected"),
          color: "success",
        });
        reset();
        callback({ action: "reject", data: response.data });
      } else {
        showToast({
          msg: response.data?.message || t("failedToRejectShipLaterRequest"),
          color: "error",
        });
      }
    } catch (error) {
      showToast({
        msg: t("failedToRejectShipLaterRequest"),
        color: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    callback({ action: "close" });
  };

  return (
    <AppModal show={show} callback={handleClose}>
      <AppModal.Title onClose={handleClose}>
        <div className="tw:text-lg tw:font-semibold">
          {t("rejectShipLaterRequest")}
        </div>
      </AppModal.Title>

      <AppModal.Content>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="tw:mb-4">
            <p className="tw:text-sm tw:text-gray-600 tw:mb-4">
              {t("rejectShipLaterDescription")}
            </p>

            <AppTextarea
              label={t("remarks")}
              name="remarks"
              register={register}
              rules={{
                required: t("remarksRequired"),
                minLength: {
                  value: 10,
                  message: t("reasonMinLength"),
                },
              }}
              placeholder={t("enterRejectionReason")}
              rows={4}
              isRequired
              error={errors.remarks?.message}
              maxLength={500}
            />
          </div>
        </form>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:gap-2 tw:justify-end">
          <AppButton
            color="light"
            fill="outline"
            onClick={handleClose}
            disabled={loading}
          >
            {t("cancel")}
          </AppButton>
          <AppButton
            color="danger"
            onClick={handleSubmit(onSubmit)}
            disabled={loading}
          >
            {loading ? (
              <div className="tw:flex tw:items-center tw:gap-2">
                <AppSpinner />
                <span>{t("rejecting")}</span>
              </div>
            ) : (
              t("reject")
            )}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default ShiplaterRejectModal;
