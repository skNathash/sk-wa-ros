import React from "react";
import { useTranslation } from "react-i18next";
import AppModal from "~/components/core/modal/AppModal";
import ClubDealSetting from "./ClubDealSetting";
import ReserveSetting from "./ReserveSetting";

interface SettingsModalProps {
  show: boolean;
  callback: (a: { action: string; data: any }) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ show, callback }) => {
  const { t } = useTranslation(["common"]);
  const handleClose = () => {
    callback({ action: "close", data: {} });
  };

  return (
    <AppModal show={show} callback={callback}>
      <AppModal.Title onClose={handleClose}>
        <span className="tw:text-base tw:font-bold">{t("settingsTitle")}</span>
      </AppModal.Title>

      <AppModal.Content>
        <div className="tw:flex tw:flex-col tw:gap-3">
          <ReserveSetting onSaved={handleClose} />

          <ClubDealSetting onSaved={handleClose} />
        </div>
      </AppModal.Content>
    </AppModal>
  );
};

export default SettingsModal;
