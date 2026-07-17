import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Edit, MapPin } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import KeyValue from "~/components/core/key-value/KeyValue";
import UpdateOwnerInformationModal from "../modals/UpdateOwnerInformationModal";
import AuthService from "~/services/AuthService";
import useAppToast from "~/hooks/useAppToast";

interface OwnerInformationProps {
  name: string;
  phone: string;
  email: string;
  alternateMobile?: string;
  title?: string;
  type?: "main" | "secondary";
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  onUpdate?: () => void; // Callback to refresh parent data after update
}

const OwnerInformation: React.FC<OwnerInformationProps> = ({
  name,
  phone,
  email,
  alternateMobile,
  title,
  type,
  addressLine1,
  addressLine2,
  city,
  district,
  state,
  pincode,
  onUpdate,
}) => {
  const { t } = useTranslation(["common"]);
  const appToast = useAppToast();
  const [modalState, setModalState] = useState<{
    show: boolean;
    data?: {
      name: string;
      phone: string;
      email: string;
      alternateMobile?: string;
      addressLine1?: string;
      addressLine2?: string;
      pincode?: string;
      state?: string;
      district?: string;
      city?: string;
    };
  }>({ show: false });

  const handleEditClick = () => {
    if (AuthService.isMasterLogin()) {
      appToast.show({
        msg: t("youAreNotAuthorizedToDoThisAction"),
        color: "danger",
      });
      return;
    }
    setModalState({
      show: true,
      data: {
        name,
        phone,
        email,
        alternateMobile,
        addressLine1,
        addressLine2,
        pincode,
        state,
        district,
        city,
      },
    });
  };

  const handleModalClose = (result: { action: string; data?: any }) => {
    setModalState({ show: false });
    if (result.action === "submit") {
      // Call the parent's refresh function to update the data
      onUpdate?.();
    }
  };

  return (
    <AppCard
      title={
        <div className="tw:flex tw:justify-between tw:items-center tw:w-full">
          <span>{title || t("ownerInformation")}</span>
          <AppButton
            size="small"
            fill="outline"
            color="light"
            onClick={handleEditClick}
            className="tw:ml-2"
          >
            <Edit className="tw:w-4 tw:h-4 tw:mr-1" />
            Edit
          </AppButton>
        </div>
      }
      icon="user"
      iconClassName={type === "main" ? "tw:text-blue-600" : "tw:text-green-600"}
    >
      <div className="tw-space-y-4">
        {/* Personal Information */}
        <div className="tw-space-y-2">
          <KeyValue label={t("name")} className="tw:mb-2" size="sm">
            {name || "--"}
          </KeyValue>
          {/*<KeyValue label={t("mobile")} className="tw:mb-2" size="sm">
            {phone || "--"}
          </KeyValue>*/}
          {/* {alternateMobile ? (
            <KeyValue
              label={t("alternateContactMobileNumber")}
              className="tw:mb-2"
              size="sm"
            >
              {alternateMobile}
            </KeyValue>
          ) : null} */}
        </div>

        {/* Address Information */}
        {(addressLine1 ||
          addressLine2 ||
          city ||
          district ||
          state ||
          pincode) && (
          <div className="tw:border-t tw:pt-4">
            <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3">
              <MapPin className="tw:w-4 tw:h-4 tw:text-gray-600" />
              <span className="tw:text-sm tw:font-medium tw:text-gray-700">
                {t("residenceAddress")}
              </span>
            </div>
            <div className="tw:space-y-2">
              {addressLine1 && (
                <KeyValue
                  label={t("addressLine1")}
                  className="tw:mb-2"
                  size="sm"
                >
                  {addressLine1}
                </KeyValue>
              )}
              {addressLine2 && (
                <KeyValue
                  label={t("addressLine2")}
                  className="tw:mb-2"
                  size="sm"
                >
                  {addressLine2}
                </KeyValue>
              )}
              <div className="tw:grid tw:grid-cols-2 tw:gap-4">
                {city && (
                  <KeyValue label={t("city")} className="tw:mb-2" size="sm">
                    {city}
                  </KeyValue>
                )}
                {district && (
                  <KeyValue label={t("district")} className="tw:mb-2" size="sm">
                    {district}
                  </KeyValue>
                )}
                {state && (
                  <KeyValue label={t("state")} className="tw:mb-2" size="sm">
                    {state}
                  </KeyValue>
                )}
                {pincode && (
                  <KeyValue label={t("pincode")} className="tw:mb-2" size="sm">
                    {pincode}
                  </KeyValue>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Update Owner Information Modal */}
      <UpdateOwnerInformationModal
        show={modalState.show}
        type={type}
        data={modalState.data}
        callback={handleModalClose}
      />
    </AppCard>
  );
};

export default OwnerInformation;
