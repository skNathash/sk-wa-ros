import React from "react";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import ImgRender from "~/components/core/img/ImgRender";
import AppModal from "~/components/core/modal/AppModal";

type SKSellerSuccessModalProps = {
  show: boolean;
  onClose: () => void;
};

const SKSellerSuccessModal: React.FC<SKSellerSuccessModalProps> = ({
  show,
  onClose,
}) => {
  const { t } = useTranslation(["common"]);
  return (
    <AppModal show={show} callback={() => onClose()} className="tw:!max-w-md">
      <AppModal.Content className="tw:p-0">
        <div className="tw:text-center">
          <div className="tw:inline-block tw:w-48">
            <ImgRender src="upgrade/sk-seller/thankyou.png" />
          </div>
        </div>

        {/* Content Section */}
        <div className="tw:px-6 tw:py-6 tw:text-center">
          <h2 className="tw:text-xl tw:font-bold tw:text-gray-900 tw:mb-3">
            {t("upgradeRequestSubmittedTitle")}
          </h2>

          <p className="tw:text-sm tw:text-gray-600 tw:mb-3">
            {t("upgradeRequestSubmittedMessage")}
          </p>

          <p className="tw:text-sm tw:text-gray-600">
            {t("upgradeRequestSubmittedNotify")}
          </p>
        </div>
      </AppModal.Content>

      <AppModal.Footer className="tw:px-6">
        <AppButton className="tw:w-full" onClick={onClose}>
          {t("gotIt")}
        </AppButton>
      </AppModal.Footer>
    </AppModal>
  );
};

export default SKSellerSuccessModal;
