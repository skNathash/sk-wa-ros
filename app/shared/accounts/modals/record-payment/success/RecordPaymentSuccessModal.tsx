import { Check } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import Divider from "~/components/core/divider/Divider";
import AppModal from "~/components/core/modal/AppModal";

type RecordPaymentSuccessModalProps = {
  show: boolean;
  callback: (args: { action: string; data?: any }) => void;
  counterpartyName?: string;
  isPayout?: boolean;
  amount: number | string;
};

const RecordPaymentSuccessModal: React.FC<RecordPaymentSuccessModalProps> = ({
  show,
  callback,
  counterpartyName,
  isPayout = false,
  amount,
}) => {
  const { t } = useTranslation(["common"]);

  const title = isPayout ? t("payoutRecorded") : t("paymentReceived");
  const counterpartyLabel = isPayout
    ? t("to", { defaultValue: "To" })
    : t("from", { defaultValue: "From" });

  return (
    <AppModal show={show} callback={callback}>
      <AppModal.Content>
        <div className="tw:text-center tw:pt-6">
          {/* top icon */}
          <div className="tw:flex tw:justify-center">
            <div className="tw:w-16 tw:h-16 tw:bg-green-100 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:p-4">
              <Check size={50} className="tw:text-green-500" />
            </div>
          </div>

          <h2 className="tw:text-xl tw:font-bold tw:text-gray-900 tw:mt-4">
            {title}
          </h2>

          <p className="tw:text-xs tw:text-slate-600 tw:mt-2">
            {isPayout
              ? t("amountPaidOutSuccessfully")
              : t("amountReceivedSuccessfully")}
          </p>

          {/* info card */}
          <div className="tw:bg-gray-50 tw:rounded-lg tw:px-4 tw:py-3 tw:mt-5 tw:border tw:border-gray-200">
            <div className="tw:flex tw:justify-between tw:items-center tw:py-2">
              <div className="tw:text-sm tw:text-gray-500">
                {counterpartyLabel}
              </div>
              <div className="tw:text-base tw:font-semibold">
                {counterpartyName || "-"}
              </div>
            </div>

            <Divider className="tw:!my-2" />

            <div className="tw:flex tw:justify-between tw:items-center tw:py-2">
              <div className="tw:text-sm tw:text-gray-500">{t("amount")}</div>
              <div className="tw:text-lg tw:font-bold">
                <Amount value={Number(amount) || 0} decimalPlaces={2} />
              </div>
            </div>
          </div>
        </div>
      </AppModal.Content>

      <AppModal.Footer className="tw:px-6">
        <AppButton
          onClick={() => callback({ action: "close" })}
          className="tw:w-full"
        >
          {t("done")}
        </AppButton>
      </AppModal.Footer>
    </AppModal>
  );
};

export default RecordPaymentSuccessModal;
