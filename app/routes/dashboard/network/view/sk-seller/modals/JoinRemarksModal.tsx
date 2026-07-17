import React from "react";
import { useForm } from "react-hook-form";
import { Users } from "lucide-react";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import AppTextarea from "~/components/core/form/AppTextarea";
import useAppToast from "~/hooks/useAppToast";
import FranchiseService from "~/services/FranchiseService";
import { useTranslation } from "react-i18next";

interface JoinRemarksModalProps {
  show: boolean;
  sellerName?: string;
  sellerId?: string;
  callback: (action: {
    action: string;
    remarks?: string;
    sellerId?: string;
  }) => void;
}

interface FormData {
  remarks: string;
}

const JoinRemarksModal: React.FC<JoinRemarksModalProps> = ({
  show,
  sellerName,
  sellerId,
  callback,
}) => {
  const appToast = useAppToast();
  const { t } = useTranslation();

  const { register, setValue, getValues, reset } = useForm<FormData>({
    defaultValues: {
      remarks: "",
    },
  });

  const [submitting, setSubmitting] = React.useState(false);

  const handleClose = () => {
    callback({ action: "close" });
    reset();
  };

  const handleSubmit = async () => {
    const remarks = getValues("remarks") || "";
    if (!remarks.trim()) {
      appToast.show({ msg: "Remarks cannot be empty", color: "error" });
      return;
    }
    if (!sellerId) {
      appToast.show({ msg: "Missing seller information", color: "error" });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        skSellerId: sellerId,
        requestMessage: remarks.trim(),
      };
      const resp = await FranchiseService.joinSeller(payload);
      if (resp.statusCode === 200) {
        appToast.show({ msg: "Join request submitted", color: "success" });
        callback({ action: "submit", remarks, sellerId });
        reset();
      } else {
        appToast.show({
          msg: resp.data?.message || "Failed to submit request",
          color: "error",
        });
      }
    } catch (e: any) {
      appToast.show({
        msg: e?.message || "Something went wrong",
        color: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppModal show={show} callback={handleClose} className="tw:max-w-md">
      <AppModal.Title onClose={handleClose}>
        <div className="tw:flex tw:items-center tw:gap-2">
          {/* <Users className="tw:w-5 tw:h-5 tw:text-primary" /> */}
          <div>
            <div className="tw:font-semibold tw:text-lg">{t("joinSeller")}</div>
          </div>
        </div>
      </AppModal.Title>

      <AppModal.Content>
        <div className="tw:space-y-4">
          {(sellerName || sellerId) && (
            <div className="tw:border tw:border-gray-200 tw:rounded-lg tw:bg-white tw:p-3 tw:shadow-sm">
              <div className="tw:flex tw:items-center tw:gap-2">
                <Users className="tw:w-4 tw:h-4 tw:text-gray-500" />
                <div className="tw:min-w-0">
                  <div className="tw:text-[11px] tw:uppercase tw:text-gray-500">
                    Seller
                  </div>
                  <div className="tw:font-semibold tw:text-base tw:truncate">
                    {sellerName || "—"}
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="tw:text-xs tw:text-gray-600">
            Please provide your remarks for joining this seller. This will help
            in the approval process.
          </div>

          <AppTextarea
            placeholder="Enter your remarks for joining this seller..."
            maxLength={500}
            rows={4}
            name="remarks"
            register={register}
            label="Remarks"
            isRequired
            className="tw:mb-4"
          />

          <div className="tw:text-xs tw:text-gray-500">
            Maximum 500 characters
          </div>
        </div>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-2">
          <AppButton color="light" fill="outline" onClick={handleClose}>
            Cancel
          </AppButton>
          <AppButton
            color="success"
            onClick={handleSubmit}
            disabled={submitting}
          >
            Join Seller
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default JoinRemarksModal;
