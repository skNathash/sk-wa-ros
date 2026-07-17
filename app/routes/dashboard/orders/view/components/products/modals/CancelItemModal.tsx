import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppButton from "~/components/core/button/AppButton";
import { AppInput, AppSelect } from "~/components/core/form";
import AppTextarea from "~/components/core/form/AppTextarea";
import AppModal from "~/components/core/modal/AppModal";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppToast from "~/hooks/useAppToast";
import OmsService from "~/services/OmsService";

interface Props {
  show: boolean;
  callback: (data: { action: string; data?: any }) => void;
  dealName: string;
  orderId: string;
  dealId: string;
  dealRefId: string;
  quantity: number;
}

interface FormData {
  remarks: string;
  quantity: number;
  reason: string;
}

const reasons = [
  {
    label: "Out of stock / inventory issue",
    value: "Out of stock / inventory issue",
  },
  {
    label: "Wrong item",
    value: "Wrong item",
  },
  {
    label: "Pricing error",
    value: "Pricing error",
  },
  {
    label: "Damage",
    value: "Damage",
  },
  {
    label: "Item discontinued",
    value: "Item discontinued",
  },
  {
    label: "Cannot ship to customer’s location",
    value: "Cannot ship to customer’s location",
  },
  {
    label: "Other",
    value: "Other",
  },
];

const CancelItemModal = ({
  show,
  callback,
  dealName,
  orderId,
  dealId,
  dealRefId,
  quantity,
}: Props) => {
  const { t } = useTranslation(["common"]);
  const { show: showToast } = useAppToast();
  const {
    register,
    getValues,
    setValue,
    handleSubmit,
    formState: { errors },
    control,
    reset,
  } = useForm<FormData>({
    defaultValues: {
      remarks: "",
      quantity: 0,
      reason: "",
    },
  });

  const [loading, setLoading] = useState(false);

  const [appAlertDialog, setAppAlertDialog] = useState({
    show: false,
    title: "",
    description: "",
    onConfirm: () => {},
    onCancel: () => {},
  });

  const reason = useWatch({ control, name: "reason" });

  useEffect(() => {
    if (show) {
      reset({
        remarks: "",
        quantity: quantity || 0,
      });
    }
  }, [quantity, show]);

  const onSubmit = async (data: FormData) => {
    setAppAlertDialog({
      show: true,
      title: t("cancelItem"),
      description: t("doYouWantToProceed"),
      onConfirm: async () => {
        setAppAlertDialog({
          show: false,
          title: "",
          description: "",
          onConfirm: () => {},
          onCancel: () => {},
        });

        await new Promise((resolve) => setTimeout(resolve, 300));

        doSubmit(data);
      },
      onCancel: () => {
        setAppAlertDialog({
          show: false,
          title: "",
          description: "",
          onConfirm: () => {},
          onCancel: () => {},
        });
      },
    });
  };

  const doSubmit = async (data: FormData) => {
    setLoading(true);
    let remarks = data.reason;
    if (data.reason === "Other") {
      remarks = data.remarks;
    }
    try {
      const response = await OmsService.cancelOrderItem(orderId, {
        orderId: orderId,
        items: [
          {
            dealId: dealId,
            dealName: dealName,
            cancelQty: data.quantity,
            remainingQty: quantity - data.quantity,
            reason: remarks,
          },
        ],
      });
      if (response.statusCode === 200) {
        showToast({
          msg: t("itemCancelledSuccessfully"),
          color: "success",
        });
        callback({ action: "submit", data: { success: true } });
      } else {
        showToast({
          msg: response.data?.message || t("failedToCancelItem"),
          color: "error",
        });
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      showToast({
        msg: t("errorCancellingOrder"),
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

  const handleQuantityChange = () => {
    const value = getValues("quantity");
    if (value > quantity) {
      setValue("quantity", quantity);
    }
    if (value < 0) {
      setValue("quantity", 0);
    }

    if (value % 1 !== 0) {
      setValue("quantity", Math.round(value));
    }
  };

  return (
    <>
      <AppModal show={show} callback={handleClose}>
        <AppModal.Title onClose={handleClose}>
          <div className="tw:text-lg tw:font-semibold">
            {t("cancelItem")} - {dealName}
          </div>
        </AppModal.Title>

        <AppModal.Content>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="tw:mb-4">
              <div className="tw:grid tw:grid-cols-2 tw:gap-3">
                <AppInput
                  type="number"
                  label={t("qtyToCancel")}
                  name="quantity"
                  register={register}
                  className="tw:mb-4"
                  onChange={handleQuantityChange}
                  isRequired={true}
                />

                <Controller
                  control={control}
                  name="reason"
                  render={({ field }) => (
                    <AppSelect
                      label={t("cancellationReason")}
                      options={reasons}
                      onChange={field.onChange}
                      value={field.value}
                      isRequired={true}
                      inputClassName="tw:w-full"
                      placeholder="Select reason"
                    />
                  )}
                />
              </div>

              {reason === "Other" && (
                <AppTextarea
                  label={t("cancellationReason")}
                  name="remarks"
                  register={register}
                  rules={{
                    required: t("cancellationReasonRequired"),
                    minLength: {
                      value: 10,
                      message: t("reasonMinLength"),
                    },
                  }}
                  placeholder={t("cancelOrderPlaceholder")}
                  rows={4}
                  isRequired
                  error={errors.remarks?.message}
                  maxLength={500}
                />
              )}
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
                  <span>{t("cancelling")}</span>
                </div>
              ) : (
                t("cancelItem")
              )}
            </AppButton>
          </div>
        </AppModal.Footer>
      </AppModal>

      <AppAlertDialog
        description={t("doYouWantToProceed")}
        onConfirm={appAlertDialog.onConfirm}
        onCancel={appAlertDialog.onCancel}
        title={t("cancelItem")}
        show={appAlertDialog.show}
      />
    </>
  );
};

export default CancelItemModal;
