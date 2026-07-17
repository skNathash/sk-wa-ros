import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppButton from "~/components/core/button/AppButton";
import { Edit } from "lucide-react";
import BankDetailModal from "../modals/BankDetailModal";
import AuthService from "~/services/AuthService";

interface BankDetailsProps {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifsc: string;
  onUpdate?: () => void;
}

const BankDetails: React.FC<BankDetailsProps> = ({
  bankName,
  accountHolderName,
  accountNumber,
  ifsc,
  onUpdate,
}) => {
  const { t } = useTranslation(["common"]);
  const [showModal, setShowModal] = useState(false);

  const isMasterLogin = AuthService.isMasterLogin();

  const handleModalClose = (result: { action: string }) => {
    setShowModal(false);
    if (result.action === "submit") {
      onUpdate?.();
    }
  };

  return (
    <AppCard
      title={
        <div className="tw:flex tw:justify-between tw:items-center tw:w-full">
          <span>{t("bankDetails")}</span>
          {!isMasterLogin && (
            <AppButton
              size="small"
              fill="outline"
              color="light"
              onClick={() => setShowModal(true)}
              className="tw:ml-2"
            >
              <Edit className="tw:w-4 tw:h-4 tw:mr-1" />
              Edit
            </AppButton>
          )}
        </div>
      }
      icon="banknote"
      iconClassName="tw:text-blue-600"
    >
      <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:gap-4">
        <KeyValue label={t("bankName")}>{bankName || "--"}</KeyValue>
        <KeyValue label={t("accountHolderName")}>
          {accountHolderName || "--"}
        </KeyValue>
        <KeyValue label={t("accountNumber")}>{accountNumber || "--"}</KeyValue>
        <KeyValue label={t("ifsc")}>{ifsc || "--"}</KeyValue>
      </div>
      <BankDetailModal show={showModal} callback={handleModalClose} />
    </AppCard>
  );
};

export default BankDetails;
