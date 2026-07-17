import React from "react";
import { useForm } from "react-hook-form";
import AppModal from "~/components/core/modal/AppModal";
import AppTextarea from "~/components/core/form/AppTextarea";
import AppButton from "~/components/core/button/AppButton";
import { useTranslation } from "react-i18next";

interface MarkDeliveryModalProps {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  orderId: string;
  customerName: string;
  deliveryTime: string;
}

const MarkDeliveryModal: React.FC<MarkDeliveryModalProps> = ({
  show,
  callback,
  orderId,
  customerName,
  deliveryTime,
}) => {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<{ remarks: string }>({
    defaultValues: { remarks: "" },
  });

  React.useEffect(() => {
    if (show) reset({ remarks: "" });
  }, [show, reset]);

  const onClose = () => {
    callback({ action: "close" });
  };

  const onSubmit = (data: { remarks: string }) => {
    callback({ action: "submit", data });
  };

  return (
    <AppModal show={show} callback={callback}>
      <AppModal.Title onClose={onClose}>
        <div className="tw:font-semibold">{t("confirmDelivery")}</div>
      </AppModal.Title>
      <AppModal.Content>
        <div className="tw:bg-gray-50 tw:rounded tw:p-4 tw:mb-4 tw:text-sm">
          <div className="tw:mb-2 tw:flex tw:justify-between tw:gap-2">
            <span className="tw:font-medium">{t("orderId")}:</span>
            <span>{orderId}</span>
          </div>
          <div className="tw:mb-2 tw:flex tw:justify-between tw:gap-2">
            <span className="tw:font-medium">{t("customer")}:</span>
            <span>{customerName}</span>
          </div>
          <div className="tw:flex tw:justify-between tw:gap-2">
            <span className="tw:font-medium">{t("deliveryTime")}:</span>
            <span>{deliveryTime}</span>
          </div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="tw:mb-4">
            <AppTextarea
              label={t("deliveryRemarks")}
              name="remarks"
              register={register}
              error={errors.remarks?.message}
              placeholder={t("anyNotesAboutTheDeliveryOptional")}
              rows={4}
            />
          </div>
          <div className="tw:flex tw:justify-end tw:gap-2">
            <AppButton
              type="button"
              color="light"
              fill="outline"
              onClick={onClose}
            >
              {t("cancel")}
            </AppButton>
            <AppButton type="submit" color="dark">
              {t("confirmDelivery")}
            </AppButton>
          </div>
        </form>
      </AppModal.Content>
    </AppModal>
  );
};

export default MarkDeliveryModal;
