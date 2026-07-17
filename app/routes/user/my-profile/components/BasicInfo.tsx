import React, { useState } from "react";
import {
  Image,
  Phone,
  Mail,
  Camera,
  Calendar,
  CheckCircle2Icon,
  ShieldCheck,
  MailPlus,
  AlertCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import FileUpload from "~/components/core/file-upload/FileUpload";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import DateFormat from "~/components/core/date/DateFormat";
import ImgRender from "~/components/core/img/ImgRender";
import AuthService from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";
import useAppToast from "~/hooks/useAppToast";
import UserBadge from "~/shared/store/badge/UserBadge";
import AppBadge from "~/components/core/badge/AppBadge";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import VerifyEmailModal from "~/shared/auth/modals/verify-email/VerifyEmailModal";

interface BasicInfoProps {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  createdAt?: string;
  ownerImage?: string;
  storeImage?: string;
  callback?: (params: { action: string; data?: any }) => void;
  isVerified?: boolean;
  franchiseId?: string;
  isEmailVerified?: boolean;
}

const BasicInfo: React.FC<BasicInfoProps> = ({
  name,
  contactPerson,
  phone,
  email,
  createdAt,
  ownerImage,
  storeImage,
  callback,
  isVerified,
  franchiseId,
  isEmailVerified,
}) => {
  const { t } = useTranslation(["common"]);

  const [verifyEmailModal, setVerifyEmailModal] = useState(false);
  const [imgPreviewModal, setImgPreviewModal] = useState(false);

  const [busyLoading, setBusyLoading] = useState<{
    show: boolean;
    message?: string;
  }>({
    show: false,
    message: "Processing...",
  });
  const toast = useAppToast();

  const handleOpenVerifyEmail = () => {
    if (AuthService.isMasterLogin()) {
      toast.show({
        msg: "You are not authorized to do this action",
        color: "danger",
      });
      return;
    }
    setVerifyEmailModal(true);
  };

  const handleImageUpload = async (response: any) => {
    try {
      setBusyLoading({ show: true, message: "Uploading owner image..." });

      // Update the franchise profile with the new owner image
      const updateData = {
        ownerDetails: {
          photoUrl: response._id,
        },
      };

      const result = await FranchiseService.updateFranchise(updateData);

      if (result.statusCode === 200 || result.statusCode === 201) {
        toast.show({
          msg: "Owner image updated successfully!",
          color: "success",
        });

        // Notify parent to refresh data
        callback?.({
          action: "refresh",
          data: { ownerImage: updateData.ownerDetails.photoUrl },
        });
      } else {
        toast.show({
          msg: "Failed to update owner image. Please try again.",
          color: "error",
        });
      }
    } catch (error) {
      console.error("Error updating owner image:", error);
      toast.show({
        msg: "An error occurred while updating the owner image.",
        color: "error",
      });
    } finally {
      setBusyLoading({ show: false });
    }
  };

  return (
    <>
      <BusyLoader show={busyLoading.show} message={busyLoading.message} />
      <div className="tw:bg-white tw:rounded-lg tw:shadow-sm tw:p-3 tw:md:p-4 tw:flex tw:flex-col tw:gap-3 tw:md:flex-row tw:md:items-center tw:md:gap-5">
        {/* Store Image */}
        <div
          className="tw:relative tw:shrink-0 tw:w-20 tw:h-20 tw:md:w-24 tw:md:h-24 tw:bg-gray-50 tw:flex tw:items-center tw:justify-center tw:rounded-lg tw:overflow-hidden tw:border tw:border-gray-200 tw:cursor-pointer"
          onClick={() => {
            if (storeImage || ownerImage) setImgPreviewModal(true);
          }}
        >
          {storeImage || ownerImage ? (
            <ImgRender
              assetId={storeImage || ownerImage}
              alt="Store"
              className="tw:w-full tw:h-full tw:object-cover"
            />
          ) : (
            <Image size={32} color="#9CA3AF" />
          )}

          {/* Upload Button */}
          <div className="tw:absolute tw:hidden tw:bottom-0 tw:inset-x-0 tw:bg-white/60 tw:flex tw:justify-center tw:py-1">
            <FileUpload
              onFileUpload={handleImageUpload}
              allowedExtensions={["jpg", "jpeg", "png"]}
              maxSizeMB={2}
              label=""
            >
              <button
                disabled={busyLoading.show}
                className="tw:flex tw:items-center tw:gap-1 tw:px-2 tw:py-0.5 tw:bg-blue-600 tw:text-white tw:rounded tw:text-xs tw:font-medium tw:hover:bg-blue-700 tw:disabled:opacity-50 tw:disabled:cursor-not-allowed tw:transition-colors"
              >
                <Camera size={11} />
                Upload
              </button>
            </FileUpload>
          </div>
        </div>

        {/* Info Section */}
        <div className="tw:flex-1 tw:min-w-0 tw:flex tw:flex-col tw:gap-1.5">
          {/* Store name + badges */}
          <div className="tw:flex tw:items-center tw:gap-2 tw:flex-wrap">
            <h2 className="tw:text-lg tw:md:text-xl tw:font-bold tw:text-gray-900 tw:truncate">
              {name}
            </h2>
            <UserBadge />
            {isVerified && (
              <AppBadge variant="success">
                <CheckCircle2Icon size={13} />
                Verified
              </AppBadge>
            )}
          </div>

          {/* Details row */}
          <div className="tw:flex tw:flex-col tw:gap-1.5 tw:md:flex-row tw:md:flex-wrap tw:md:items-center tw:md:gap-x-4 tw:md:gap-y-1 tw:text-sm tw:text-gray-600">
            <span className="tw:flex tw:items-center tw:gap-1">
              <span className="tw:text-gray-500 tw:font-medium">ID</span>
              <span className="tw:text-gray-700">{franchiseId}</span>
            </span>

            <span className="tw:hidden tw:md:inline tw:text-gray-300">|</span>

            <span className="tw:flex tw:items-center tw:gap-1">
              <Phone size={14} className="tw:text-gray-400" />
              <span className="tw:text-gray-500 tw:font-medium">Mobile</span>
              <span className="tw:text-gray-700">{phone}</span>
            </span>

            <span className="tw:hidden tw:md:inline tw:text-gray-300">|</span>

            {email && isEmailVerified ? (
              <span className="tw:inline-flex tw:items-center tw:gap-1.5 tw:flex-wrap">
                <Mail size={14} className="tw:text-gray-400" />
                <span className="tw:text-gray-500 tw:font-medium">Email</span>
                <span className="tw:text-gray-700 tw:break-all">{email}</span>
                <span
                  className="tw:inline-flex tw:items-center tw:gap-1 tw:px-1.5 tw:py-0.5 tw:rounded-full tw:bg-green-50 tw:text-green-700 tw:border tw:border-green-200 tw:text-[11px] tw:font-medium"
                  title={t("verified")}
                >
                  <CheckCircle2Icon size={11} />
                  {t("verified")}
                </span>
              </span>
            ) : email && !isEmailVerified ? (
              <span className="tw:inline-flex tw:items-center tw:gap-1.5 tw:flex-wrap">
                <Mail size={14} className="tw:text-gray-400" />
                <span className="tw:text-gray-500 tw:font-medium">Email</span>
                <span className="tw:text-gray-700 tw:break-all">{email}</span>
                <span className="tw:inline-flex tw:items-center tw:gap-1 tw:px-1.5 tw:py-0.5 tw:rounded-full tw:bg-amber-50 tw:text-amber-700 tw:border tw:border-amber-200 tw:text-[11px] tw:font-medium">
                  <AlertCircle size={11} />
                  {t("unverified")}
                </span>
                <button
                  type="button"
                  onClick={handleOpenVerifyEmail}
                  className="tw:inline-flex tw:items-center tw:gap-1 tw:px-2 tw:py-0.5 tw:rounded-md tw:text-xs tw:font-medium tw:text-white tw:bg-blue-600 tw:hover:bg-blue-700 tw:transition-colors"
                >
                  <ShieldCheck size={12} />
                  {t("verifyEmail")}
                </button>
              </span>
            ) : (
              <span className="tw:inline-flex tw:items-center tw:gap-1.5 tw:flex-wrap">
                <Mail size={14} className="tw:text-gray-400" />
                <span className="tw:text-gray-500 tw:font-medium">Email</span>
                <span className="tw:text-gray-400 tw:italic">{t("notAdded")}</span>
                <button
                  type="button"
                  onClick={handleOpenVerifyEmail}
                  className="tw:inline-flex tw:items-center tw:gap-1 tw:px-2 tw:py-0.5 tw:rounded-md tw:text-xs tw:font-medium tw:text-blue-700 tw:bg-blue-50 tw:border tw:border-blue-200 tw:hover:bg-blue-100 tw:transition-colors"
                >
                  <MailPlus size={12} />
                  {t("addEmailForNotifications")}
                </button>
              </span>
            )}

            {createdAt && (
              <>
                <span className="tw:hidden tw:md:inline tw:text-gray-300">
                  |
                </span>
                <span className="tw:flex tw:items-center tw:gap-1">
                  <Calendar size={14} className="tw:text-gray-400" />
                  <span className="tw:text-gray-500 tw:font-medium">Registered</span>
                  <DateFormat value={createdAt} formatStr="dd MMM yyyy" />
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <ImgPreviewModal
        show={imgPreviewModal}
        images={[
          ...(storeImage ? [{ id: storeImage }] : []),
          ...(ownerImage && ownerImage !== storeImage
            ? [{ id: ownerImage }]
            : []),
        ]}
        callback={(a) => {
          if (a.action === "close") setImgPreviewModal(false);
        }}
      />

      <VerifyEmailModal
        show={verifyEmailModal}
        email={email}
        updateFranchise
        callback={(a) => {
          if (a.action === "verified") {
            setVerifyEmailModal(false);
            callback?.({ action: "refresh" });
          } else if (a.action === "close") {
            setVerifyEmailModal(false);
          }
        }}
      />
    </>
  );
};

export default BasicInfo;
