import { HandHeart } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import { AppInput } from "~/components/core/form";
import AppTextarea from "~/components/core/form/AppTextarea";
import AppModal from "~/components/core/modal/AppModal";
import SellerService from "~/services/SellerService";
import useAppToast from "~/hooks/useAppToast";
import { useTranslation } from "react-i18next";

interface HandoverModalData {
  settlementId: string;
  orderRefId: string;
  customerName: string;
  shipmentUserInfo?: {
    id: string;
    name: string;
  };
  totalAmount: number;
  _id: string;
}

const HandoverModal = ({
  show,
  data,
  callback,
}: {
  show: boolean;
  data: HandoverModalData | null;
  callback: (a: { action: string; success?: boolean }) => void;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [loading, setLoading] = useState(false);
  const { show: showToast } = useAppToast();
  const { t } = useTranslation(["common"]);

  const onSubmit = async (formData: any) => {
    if (!data) return;

    setLoading(true);
    try {
      const response = await SellerService.bulkUpdateSettlements({
        settlementList: [
          {
            id: data._id,
            remarks: formData.remarks || "",
          },
        ],
      });

      if (response.statusCode === 200) {
        showToast({
          msg:
            t("handoverCompletedSuccessfully") ||
            "Handover completed successfully",
          color: "success",
        });
        callback({ action: "handover", success: true });
      } else {
        showToast({
          msg:
            response.data?.message ||
            t("failedToCompleteHandover") ||
            "Failed to complete handover",
          color: "error",
        });
        callback({ action: "handover", success: false });
      }
    } catch (error: any) {
      console.error("Handover error:", error);
      showToast({
        msg:
          error?.message ||
          t("errorDuringHandover") ||
          "An error occurred during handover",
        color: "error",
      });
      callback({ action: "handover", success: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppModal show={show} callback={callback}>
      <AppModal.Title onClose={() => callback({ action: "close" })}>
        <div className="tw:text-sm tw:font-medium tw:flex tw:items-center tw:gap-2">
          <HandHeart />
          {t("codHandover") || "COD Handover"}
        </div>
      </AppModal.Title>
      <AppModal.Content className="tw:max-h-[70vh]">
        {data && (
          <div className="tw:bg-gray-50 tw:p-4 tw:rounded-lg tw:mb-4">
            <div className="tw:flex tw:justify-between tw:items-center tw:gap-2 tw:mb-2">
              <div className="tw:text-sm tw:font-medium">{t("order")}</div>
              <div className="tw:text-sm tw:text-gray-500">
                {data.orderRefId}
              </div>
            </div>

            <div className="tw:flex tw:justify-between tw:items-center tw:gap-2 tw:mb-2">
              <div className="tw:text-sm tw:font-medium">
                {t("collectedBy")}
              </div>
              <div className="tw:text-sm tw:text-gray-500">
                {data.shipmentUserInfo?.name || "N/A"}
              </div>
            </div>

            <div className="tw:flex tw:justify-between tw:items-center tw:gap-2 tw:mb-2">
              <div className="tw:text-sm tw:font-medium">
                {t("settlementId")}
              </div>
              <div className="tw:text-sm tw:text-gray-500">
                {data.settlementId}
              </div>
            </div>

            <div className="tw:flex tw:justify-between tw:items-center tw:gap-2 tw:mb-2">
              <div className="tw:text-sm tw:font-medium">{t("amount")}</div>
              <div className="tw:text-sm tw:text-green-700">
                <Amount value={data.totalAmount} className="tw:font-semibold" />
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <AppTextarea
            name="remarks"
            label={t("handoverRemarks") || "Handover Remarks"}
            placeholder={
              t("handoverRemarksPlaceholder") || "Any notes about the handover"
            }
            register={register}
            className="tw:mb-4"
          />
        </form>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-2">
          <AppButton
            fill="outline"
            size="small"
            color="dark"
            onClick={() => callback({ action: "close" })}
            disabled={loading}
          >
            {t("cancel")}
          </AppButton>
          <AppButton
            size="small"
            color="dark"
            onClick={handleSubmit(onSubmit)}
            isLoading={loading}
            disabled={loading}
          >
            {t("confirmHandover") || "Confirm Handover"}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default HandoverModal;
