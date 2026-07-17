import { CheckCircle2, MessageCircle, Phone, Store } from "lucide-react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
import ShareService from "~/services/ShareService";

interface SuccessModalProps {
  show: boolean;
  onClose: () => void;
  retailerData: {
    name?: string;
    mobile?: string;
    storeName?: string;
    ownerName?: string;
    displayType?: { name: string; type: string } | null;
  };
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  show,
  onClose,
  retailerData,
}) => {
  const { t } = useTranslation(["common"]);

  const displayTypeLabel =
    retailerData.displayType?.name || retailerData.displayType?.type || "";

  const handleSendWhatsApp = useCallback(() => {
    const retailerName =
      retailerData.ownerName ||
      retailerData.storeName ||
      retailerData.name ||
      "";
    const mobile = retailerData.mobile || "";

    // Create registration message
    const registrationMessage = `Hi ${retailerName}\n\nWelcome to StoreKing! Your B2B retailer registration has been successfully completed.\n\nYour account details:\n• Name: ${retailerName}\n• Mobile: ${mobile}\n\nYou can now start using StoreKing services. If you have any questions, please contact our support team.\n\nThank you for choosing StoreKing!`;

    // Send message via ShareService
    ShareService.share({
      msg: registrationMessage,
      phone: mobile,
    });
  }, [retailerData]);

  return (
    <AppModal show={show} callback={onClose} className="tw:max-w-md">
      <AppModal.Content>
        <div className="tw:flex tw:flex-col tw:items-center tw:py-6 tw:px-1">
          {/* Success Icon */}
          <div className="tw:mb-4">
            <div className="tw:w-16 tw:h-16 tw:bg-green-50 tw:rounded-full tw:flex tw:items-center tw:justify-center">
              <CheckCircle2 className="tw:w-10 tw:h-10 tw:text-green-600" />
            </div>
          </div>

          {/* Title */}
          <h2 className="tw:text-xl tw:font-semibold tw:mb-6 tw:text-gray-900 tw:text-center">
            {t("b2bRetailerCreatedSuccessfully", { type: displayTypeLabel })}
          </h2>

          {/* Retailer Details */}
          <div className="tw:w-full tw:space-y-3 tw:mb-6">
            {retailerData.storeName && (
              <div className="tw:bg-gray-50 tw:border tw:border-gray-200 tw:rounded-lg tw:p-4">
                <div className="tw:flex tw:items-start tw:gap-3">
                  <div className="tw:flex-shrink-0 tw:mt-0.5">
                    <Store className="tw:w-5 tw:h-5 tw:text-gray-600" />
                  </div>
                  <div className="tw:flex-1 tw:min-w-0">
                    <div className="tw:text-xs tw:font-medium tw:text-gray-500 tw:uppercase tw:tracking-wide tw:mb-1">
                      {t("storeName") || "Store Name"}
                    </div>
                    <div className="tw:text-base tw:font-semibold tw:text-gray-900 tw:break-words">
                      {retailerData.storeName}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {retailerData.mobile && (
              <div className="tw:bg-gray-50 tw:border tw:border-gray-200 tw:rounded-lg tw:p-4">
                <div className="tw:flex tw:items-start tw:gap-3">
                  <div className="tw:flex-shrink-0 tw:mt-0.5">
                    <Phone className="tw:w-5 tw:h-5 tw:text-gray-600" />
                  </div>
                  <div className="tw:flex-1 tw:min-w-0">
                    <div className="tw:text-xs tw:font-medium tw:text-gray-500 tw:uppercase tw:tracking-wide tw:mb-1">
                      {t("mobileNumber") || "Mobile Number"}
                    </div>
                    <div className="tw:text-base tw:font-semibold tw:text-gray-900">
                      {retailerData.mobile}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Info Message */}
          {/* <div className="tw:w-full tw:bg-blue-50 tw:border tw:border-blue-100 tw:rounded-lg tw:p-4">
            <p className="tw:text-sm tw:text-blue-900 tw:leading-relaxed tw:text-center">
              The retailer has been successfully registered. You can send a
              registration confirmation message via WhatsApp.
            </p>
          </div> */}
        </div>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:gap-3 tw:justify-end tw:w-full">
          <AppButton
            size="small"
            color="light"
            fill="outline"
            onClick={onClose}
          >
            Close
          </AppButton>
          {/* <AppButton
            size="small"
            color="primary"
            onClick={handleSendWhatsApp}
            disabled={!retailerData.mobile}
          >
            <MessageCircle size={16} className="tw:mr-2" />
            Send WhatsApp
          </AppButton> */}
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default SuccessModal;
