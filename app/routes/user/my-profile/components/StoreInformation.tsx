import { format, parse } from "date-fns";
import { Edit, History, Plus } from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import KeyValue from "~/components/core/key-value/KeyValue";
import useAppToast from "~/hooks/useAppToast";
import GenericUpdateModal from "../modals/GenericUpdateModal";
import UpdateStoreInformationModal from "../modals/UpdateStoreInformationModal";
import ProfileRequestLogModal from "../modals/ProfileRequestLogModal";

interface StoreInformationProps {
  storeName: string;
  fssaiLicense: string;
  storeSize: string;
  storeOpenTime: string;
  storeCloseTime: string;
  primaryBusiness: string;
  secondaryBusiness?: string;
  primaryBusinessId?: string;
  secondaryBusinessId?: string;
  deliveryRadius: number;
  latitude?: number;
  longitude?: number;
  monthlyTurnover?: string;
  yearsOfExperience?: string;
  callback?: () => void;
  profileRequestLogs?: any[];
}

// Helper function to convert 24-hour format to 12-hour format using date-fns
const formatTimeTo12Hour = (time24: string): string => {
  if (!time24 || time24 === "--") return "--";

  try {
    // Parse the time string (HH:mm format) using date-fns
    const date = parse(time24, "HH:mm", new Date());

    // Format to 12-hour format with AM/PM using date-fns
    return format(date, "hh:mm a");
  } catch (error) {
    // If parsing fails, return the original value
    return time24;
  }
};

const StoreInformation: React.FC<StoreInformationProps> = ({
  storeName,
  fssaiLicense,
  storeSize,
  storeOpenTime,
  storeCloseTime,
  primaryBusiness,
  secondaryBusiness,
  primaryBusinessId,
  secondaryBusinessId,
  deliveryRadius,
  latitude,
  longitude,
  monthlyTurnover,
  yearsOfExperience,
  callback,
  profileRequestLogs,
}) => {
  const { t } = useTranslation(["common", "profile"]);
  const toast = useAppToast();
  const [storeInfoModalState, setStoreInfoModalState] = useState<{
    show: boolean;
    data?: {
      storeName: string;
      storeOpenTime: string;
      storeCloseTime: string;
      primaryBusiness: string;
      secondaryBusiness?: string;
      primaryBusinessId?: string;
      secondaryBusinessId?: string;
      storeSize: string;
      deliveryRadius: number;
      latitude?: number;
      longitude?: number;
      monthlyTurnover?: string;
      yearsOfExperience?: string;
    };
  }>({
    show: false,
  });

  const [genericModal, setGenericModal] = useState<{
    show: boolean;
    inputs: Array<string>;
    values: Record<string, any>;
  }>({
    show: false,
    inputs: [],
    values: {},
  });

  const [profileRequestLogModalState, setProfileRequestLogModalState] =
    useState<{
      show: boolean;
      profileRequestLogs: any[];
    }>({
      show: false,
      profileRequestLogs: [],
    });

  const handleModalCallback = ({
    action,
    data,
  }: {
    action: string;
    data?: any;
  }) => {
    if (action === "close") {
      setStoreInfoModalState({ show: false });
    } else if (action === "submit") {
      setStoreInfoModalState({ show: false });
      callback?.();
    }
  };

  const handleProfileRequestLogModalCallback = ({
    action,
    data,
  }: {
    action: string;
    data?: any;
  }) => {
    setProfileRequestLogModalState({ show: false, profileRequestLogs: [] });
  };

  const handleEditClick = () => {
    // Check if latitude and longitude are available
    if (!latitude || !longitude) {
      toast.show({
        msg: t("storeLocationRequired"),
        color: "danger",
      });
      return;
    }

    setStoreInfoModalState({
      show: true,
      data: {
        storeName,
        storeOpenTime,
        storeCloseTime,
        primaryBusiness,
        secondaryBusiness,
        primaryBusinessId:
          primaryBusinessId || (primaryBusiness as any) || undefined,
        secondaryBusinessId: secondaryBusinessId || undefined,
        storeSize,
        deliveryRadius,
        latitude,
        longitude,
        monthlyTurnover,
        yearsOfExperience,
      },
    });
  };

  const handleGenericModalCallback = ({
    action,
    data,
  }: {
    action: string;
    data?: any;
  }) => {
    setGenericModal({ show: false, inputs: [], values: {} });
    if (action === "submit" || action === "success") {
      // Inform parent (ProfilePage) to refresh profile data after successful update
      callback?.();
    }
  };

  const openProfileRequestLogModal = () => {
    setProfileRequestLogModalState({
      show: true,
      profileRequestLogs: profileRequestLogs || [],
    });
  };

  // GST requests live in the GST Type block now — only count business updates here
  const businessRequestTypes = [
    "PRIMARY_BUSINESS_UPDATE",
    "SECONDARY_BUSINESS_UPDATE",
  ];
  const pendingRequestCount = Array.isArray(profileRequestLogs)
    ? profileRequestLogs.filter(
        (l) =>
          l && businessRequestTypes.includes(l.type) && l.status === "Pending",
      ).length
    : 0;

  return (
    <>
      <AppCard
        title={
          <div className="tw:flex tw:items-center tw:justify-between tw:w-full">
            <span>{t("storeInformation")}</span>
            <div className="tw:flex tw:items-center tw:gap-1">
              <AppButton
                type="button"
                color="light"
                fill="outline"
                size="small"
                onClick={openProfileRequestLogModal}
                className="tw:flex tw:items-center tw:gap-1"
              >
                <History className="tw:w-4 tw:h-4" />
                <span className="tw:flex tw:items-center tw:gap-1">
                  History
                  {pendingRequestCount > 0 && (
                    <span className="tw:ml-1 tw:inline-flex tw:items-center tw:justify-center tw:w-5 tw:h-5 tw:rounded-full tw:text-xs tw:bg-amber-400 tw:text-black">
                      {pendingRequestCount}
                    </span>
                  )}
                </span>
              </AppButton>
              <AppButton
                type="button"
                color="light"
                fill="outline"
                size="small"
                onClick={handleEditClick}
                className="tw:flex tw:items-center tw:gap-1"
              >
                <Edit className="tw:w-4 tw:h-4" />
                {t("update")}
              </AppButton>
            </div>
          </div>
        }
        icon="package-2"
        iconClassName="tw:text-blue-600"
      >
        <div className="tw:space-y-2">
          <div className="tw:grid tw:grid-cols-2 tw:gap-4">
            <KeyValue label={t("storeOpenTime")} className="tw:mb-2" size="sm">
              {storeOpenTime ? (
                <DateFormat value={storeOpenTime} formatStr="hh:mm a" />
              ) : (
                "--"
              )}
            </KeyValue>
            <KeyValue label={t("storeCloseTime")} className="tw:mb-2" size="sm">
              {storeCloseTime ? (
                <DateFormat value={storeCloseTime} formatStr="hh:mm a" />
              ) : (
                "--"
              )}
            </KeyValue>
            <KeyValue label={t("storeSize")} className="tw:mb-2" size="sm">
              {storeSize ? `${storeSize} sq ft` : "--"}
            </KeyValue>
            <KeyValue label={t("deliveryRadius")} className="tw:mb-2" size="sm">
              {deliveryRadius !== undefined && deliveryRadius !== null
                ? `${deliveryRadius} km`
                : "--"}
            </KeyValue>

            <KeyValue label={t("monthlyTurnover")} className="tw:mb-2" size="sm">
              <div>{monthlyTurnover || "--"}</div>
            </KeyValue>

            <KeyValue label={t("yearsOfExperience")} className="tw:mb-2" size="sm">
              <div>{yearsOfExperience || "--"}</div>
            </KeyValue>

            <KeyValue
              label={
                <div className="tw:flex tw:items-center tw:gap-1 tw:justify-between">
                  <span>{t("primaryBusiness")}</span>
                  <AppButton
                    type="button"
                    color="primary"
                    fill="clear"
                    size="small"
                    onClick={() =>
                      setGenericModal({
                        show: true,
                        inputs: ["primaryBusiness"],
                        values: { primaryBusiness: primaryBusinessId },
                      })
                    }
                    className="tw:text-primary tw:px-0!"
                  >
                    <Plus className="tw:w-4 tw:h-4" />
                    Add
                  </AppButton>
                </div>
              }
              className="tw:mb-2"
              size="sm"
            >
              <div>{primaryBusiness || "--"}</div>
            </KeyValue>

            <KeyValue
              label={
                <div className="tw:flex tw:items-center tw:gap-1 tw:justify-between">
                  <span>{t("secondaryBusiness")}</span>
                  <AppButton
                    type="button"
                    color="primary"
                    fill="clear"
                    size="small"
                    onClick={() =>
                      setGenericModal({
                        show: true,
                        inputs: ["secondaryBusiness"],
                        values: { secondaryBusiness: secondaryBusinessId },
                      })
                    }
                    className="tw:text-primary tw:px-0!"
                  >
                    <Plus className="tw:w-4 tw:h-4" />
                    Add
                  </AppButton>
                </div>
              }
              className="tw:mb-2"
              size="sm"
            >
              <div>{secondaryBusiness || "--"}</div>
            </KeyValue>
          </div>
        </div>
      </AppCard>

      <UpdateStoreInformationModal
        show={storeInfoModalState.show}
        callback={handleModalCallback}
        data={storeInfoModalState.data}
      />

      <GenericUpdateModal
        show={genericModal.show}
        callback={handleGenericModalCallback}
        inputs={genericModal.inputs}
        values={genericModal.values}
      />

      <ProfileRequestLogModal
        show={profileRequestLogModalState.show}
        callback={handleProfileRequestLogModalCallback}
        profileRequestLogs={profileRequestLogModalState.profileRequestLogs}
        types={businessRequestTypes}
      />
    </>
  );
};

export default StoreInformation;
