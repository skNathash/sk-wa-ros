import { Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import ImgRender from "~/components/core/img/ImgRender";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppModal from "~/components/core/modal/AppModal";
import type { VendorFormData } from "~/types/VendorTypes";

interface ConfirmationModalProps {
  show: boolean;
  callback: (action: "cancel" | "confirm") => void;
  formData: VendorFormData;
  pincodeData: {
    city: string;
    state: string;
    district: string;
  };
  selectedBrands: any[];
  isEditing: boolean;
  isLoading?: boolean;
}

const ConfirmationModal = ({
  show,
  callback,
  formData,
  pincodeData,
  selectedBrands,
  isEditing,
  isLoading = false,
}: ConfirmationModalProps) => {
  const { t } = useTranslation(["common"]);

  const handleModalCallback = ({ action }: { action: string }) => {
    if (action === "close") {
      callback("cancel");
    }
  };

  const handleCancelClick = () => {
    callback("cancel");
  };

  const handleConfirmClick = () => {
    callback("confirm");
  };

  const formatAddress = () => {
    const parts = [];
    if (formData.doorNo) parts.push(formData.doorNo);
    if (formData.addressLine1) parts.push(formData.addressLine1);
    if (formData.landmark) parts.push(`Near ${formData.landmark}`);
    // Prefer values selected in the form (dropdowns). Fall back to pincode-derived values.
    const city = formData.town || pincodeData.city;
    const district = formData.district || pincodeData.district;
    const state = formData.state || pincodeData.state;
    if (city) parts.push(city);
    if (district) parts.push(district);
    if (state) parts.push(state);
    if (formData.pincode) parts.push(`Pincode: ${formData.pincode}`);

    return parts.join(", ");
  };

  const formatBrands = () => {
    if (formData.sourceAllBrands) {
      return t("allBrands");
    }
    if (selectedBrands.length === 0) {
      return t("noBrandsSelected");
    }
    return selectedBrands.map((brand) => brand.label).join(", ");
  };

  return (
    <AppModal
      show={show}
      callback={handleModalCallback}
      className="tw:max-w-4xl tw:max-h-[90vh]"
    >
      <AppModal.Title onClose={handleCancelClick}>
        <div className="tw:font-semibold">{t("confirmVendorDetails")}</div>
      </AppModal.Title>

      <AppModal.Content className="tw:max-h-[80vh]">
        <div className="tw:space-y-4">
          {/* Basic Information */}
          <AppCard title={t("basicInformation")} className="tw:mb-4">
            <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
              <KeyValue
                label={t("vendorName")}
                labelClassName="tw:text-sm tw:font-medium tw:text-gray-600"
                valueClassName="tw:text-sm tw:text-gray-900 tw:mt-1"
              >
                {formData.vendorName || t("notProvided")}
              </KeyValue>

              <KeyValue
                label={t("contactPerson")}
                labelClassName="tw:text-sm tw:font-medium tw:text-gray-600"
                valueClassName="tw:text-sm tw:text-gray-900 tw:mt-1"
              >
                {formData.contactName || t("notProvided")}
              </KeyValue>

              <KeyValue
                label={t("mobileNumber")}
                labelClassName="tw:text-sm tw:font-medium tw:text-gray-600"
                valueClassName="tw:text-sm tw:text-gray-900 tw:mt-1"
              >
                {formData.contactMobile || t("notProvided")}
              </KeyValue>

              <KeyValue
                label={t("emailAddress")}
                labelClassName="tw:text-sm tw:font-medium tw:text-gray-600"
                valueClassName="tw:text-sm tw:text-gray-900 tw:mt-1"
              >
                {formData.contactEmail || t("notProvided")}
              </KeyValue>
            </div>
          </AppCard>

          {/* Address Information */}
          <AppCard title={t("addressInformation")} className="tw:mb-4">
            <div>
              <KeyValue
                label={t("completeAddress")}
                labelClassName="tw:text-sm tw:font-medium tw:text-gray-600"
                valueClassName="tw:text-sm tw:text-gray-900 tw:mt-1"
              >
                {formatAddress() || t("notProvided")}
              </KeyValue>
            </div>
          </AppCard>

          {/* Brand Information */}
          <AppCard title={t("brandInformation")} className="tw:mb-4">
            <div>
              <KeyValue
                label={t("selectedBrands")}
                labelClassName="tw:text-sm tw:font-medium tw:text-gray-600"
                valueClassName="tw:text-sm tw:text-gray-900 tw:mt-1"
              >
                {formatBrands()}
              </KeyValue>
            </div>
          </AppCard>

          {/* Document Upload Status */}
          <AppCard title={t("documentUploadStatus")} className="tw:mb-4">
            <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
              <div>
                <KeyValue
                  label={t("panDocument")}
                  labelClassName="tw:text-sm tw:font-medium tw:text-gray-600"
                  valueClassName="tw:mt-2"
                >
                  <div className="tw:flex tw:flex-col tw:items-start tw:gap-2">
                    {formData.panImg ? (
                      <div className="tw:flex tw:flex-col">
                        <div className="tw:border tw:border-gray-200 tw:rounded tw:p-2 tw:bg-white tw:inline-block">
                          <ImgRender
                            assetId={formData.panImg}
                            alt={t("panDocument")}
                            className="tw:max-w-full tw:max-h-36 tw:object-contain tw:rounded"
                            size="300x300"
                          />
                        </div>
                        <span className="tw:text-sm tw:text-gray-700 tw:mt-2">
                          {formData.pan || "-"}
                        </span>
                      </div>
                    ) : (
                      <p className="tw:text-sm tw:text-gray-900 tw:mt-1">
                        {t("notUploaded")}
                      </p>
                    )}
                  </div>
                </KeyValue>
              </div>

              <div>
                <KeyValue
                  label={t("gstDocument")}
                  labelClassName="tw:text-sm tw:font-medium tw:text-gray-600"
                  valueClassName="tw:mt-2"
                >
                  <div className="tw:flex tw:flex-col tw:items-start tw:gap-2">
                    {formData.gstImg ? (
                      <div className="tw:flex tw:flex-col">
                        <div className="tw:border tw:border-gray-200 tw:rounded tw:p-2 tw:bg-white tw:inline-block">
                          <ImgRender
                            assetId={formData.gstImg}
                            alt={t("gstDocument")}
                            className="tw:max-w-full tw:max-h-36 tw:object-contain tw:rounded"
                            size="300x300"
                          />
                        </div>
                        <span className="tw:text-sm tw:text-gray-700 tw:mt-2">
                          {formData.gst || "-"}
                        </span>
                      </div>
                    ) : (
                      <p className="tw:text-sm tw:text-gray-900 tw:mt-1">
                        {t("notUploaded")}
                      </p>
                    )}
                  </div>
                </KeyValue>
              </div>
            </div>
          </AppCard>
        </div>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-3 tw:w-full">
          <AppButton
            onClick={handleCancelClick}
            fill="outline"
            color="medium"
            disabled={isLoading}
          >
            <X className="tw:w-4 tw:h-4" />
            {t("cancel")}
          </AppButton>
          <AppButton
            onClick={handleConfirmClick}
            color="primary"
            isLoading={isLoading}
          >
            <Check className="tw:w-4 tw:h-4" />
            {isEditing ? t("updateVendor") : t("createVendor")}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default ConfirmationModal;
