import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Edit, Youtube, Instagram, Facebook, ExternalLink } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import KeyValue from "~/components/core/key-value/KeyValue";
import UpdateStoreBrandingModal from "../modals/UpdateStoreBrandingModal";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import ImgRender from "~/components/core/img/ImgRender";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";

interface StoreBrandingProps {
  storeLogo?: string;
  storeCaption?: string;
  socialMediaLinks?: {
    youtube?: string;
    facebook?: string;
    instagram?: string;
    google?: string;
  };
  callback?: () => void;
}

const StoreBranding: React.FC<StoreBrandingProps> = ({
  storeLogo,
  storeCaption,
  socialMediaLinks,
  callback,
}) => {
  const { t } = useTranslation(["common", "profile"]);
  const toast = useAppToast();

  const [showImgPreviewModal, setShowImgPreviewModal] = useState({
    show: false,
    imageId: undefined,
    images: [] as { id: string }[],
  });

  const [storeBrandingModalState, setStoreBrandingModalState] = useState<{
    show: boolean;
    data?: {
      storeLogo?: string;
      storeCaption?: string;
      socialMediaLinks?: {
        youtube?: string;
        facebook?: string;
        instagram?: string;
      };
    };
  }>({
    show: false,
  });

  const handleModalCallback = ({
    action,
    data,
  }: {
    action: string;
    data?: any;
  }) => {
    if (action === "close") {
      setStoreBrandingModalState({ show: false });
    } else if (action === "submit") {
      setStoreBrandingModalState({ show: false });
      callback?.();
    }
  };

  const handleEditClick = () => {
    // Allow master login to edit store branding. Previously master logins were blocked.
    setStoreBrandingModalState({
      show: true,
      data: {
        storeLogo,
        storeCaption,
        socialMediaLinks,
      },
    });
  };

  const handleLogoClick = () => {
    if (!storeLogo) return;
    setShowImgPreviewModal({
      show: true,
      imageId: storeLogo,
      images: [{ id: storeLogo }],
    });
  };

  const handleImgPreviewModalCallback = (action: {
    action: string;
    data?: any;
  }) => {
    if (action.action === "close") {
      setShowImgPreviewModal({ show: false, imageId: undefined, images: [] });
    }
  };

  return (
    <>
      <AppCard
        title={
          <div className="tw:flex tw:items-center tw:justify-between tw:w-full">
            <span>{t("profile:storeBranding")}</span>
            <AppButton
              type="button"
              color="light"
              fill="outline"
              size="small"
              onClick={handleEditClick}
              className="tw:flex tw:items-center tw:gap-1"
            >
              <Edit className="tw:w-4 tw:h-4" />
              {t("edit")}
            </AppButton>
          </div>
        }
        icon="image"
        iconClassName="tw:text-purple-600"
      >
        <div className="tw:space-y-4">
          {/* Logo and Caption Row */}
          <div className="tw:flex tw:items-start tw:gap-6">
            {/* Store Logo */}
            <div className="tw:flex-shrink-0">
              <div className="tw:text-xs tw:text-gray-500 tw:mb-1.5 tw:font-medium">
                {t("profile:storeLogo")}
              </div>
              {storeLogo ? (
                <div
                  onClick={handleLogoClick}
                  className="tw:cursor-pointer tw:relative"
                >
                  <ImgRender
                    assetId={storeLogo}
                    alt="Store Logo"
                    className="tw:h-16 tw:w-16 tw:object-contain tw:bg-white tw:border-2 tw:border-gray-200 tw:rounded-lg tw:p-2"
                  />
                </div>
              ) : (
                <div
                  onClick={handleEditClick}
                  className="tw:h-16 tw:w-16 tw:bg-gray-100 tw:border-2 tw:border-dashed tw:border-gray-300 tw:rounded-lg tw:flex tw:items-center tw:justify-center tw:text-gray-400 tw:text-xs tw:cursor-pointer tw:hover:bg-gray-200"
                >
                  No Logo
                </div>
              )}
            </div>

            {/* Store Caption */}
            <div className="tw:flex-1 tw:min-w-0">
              <div className="tw:text-xs tw:text-gray-500 tw:mb-1.5 tw:font-medium">
                {t("profile:storeCaption")}
              </div>
              <div className="tw:text-sm tw:text-gray-900">
                {storeCaption || (
                  <span className="tw:text-gray-400 tw:italic">
                    No caption added
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Social Media Links */}
          {(socialMediaLinks?.youtube ||
            socialMediaLinks?.instagram ||
            socialMediaLinks?.facebook ||
            socialMediaLinks?.google) && (
            <>
              <div className="tw:border-t tw:border-gray-200"></div>
              <div>
                <div className="tw:text-xs tw:text-gray-500 tw:mb-2 tw:font-medium">
                  Social Media Links
                </div>
                <div className="tw:flex tw:flex-wrap tw:gap-2">
                  {socialMediaLinks.youtube && (
                    <a
                      href={socialMediaLinks.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tw:inline-flex tw:items-center tw:gap-1.5 tw:px-3 tw:py-1.5 tw:bg-red-50 tw:text-red-700 tw:rounded-full tw:text-xs tw:font-medium tw:border tw:border-red-200 hover:tw:bg-red-100 tw:transition-colors"
                    >
                      <Youtube className="tw:w-3.5 tw:h-3.5" />
                      YouTube
                      <ExternalLink className="tw:w-3 tw:h-3 tw:opacity-60" />
                    </a>
                  )}
                  {socialMediaLinks.instagram && (
                    <a
                      href={socialMediaLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tw:inline-flex tw:items-center tw:gap-1.5 tw:px-3 tw:py-1.5 tw:bg-pink-50 tw:text-pink-700 tw:rounded-full tw:text-xs tw:font-medium tw:border tw:border-pink-200 hover:tw:bg-pink-100 tw:transition-colors"
                    >
                      <Instagram className="tw:w-3.5 tw:h-3.5" />
                      Instagram
                      <ExternalLink className="tw:w-3 tw:h-3 tw:opacity-60" />
                    </a>
                  )}
                  {socialMediaLinks.facebook && (
                    <a
                      href={socialMediaLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tw:inline-flex tw:items-center tw:gap-1.5 tw:px-3 tw:py-1.5 tw:bg-blue-50 tw:text-blue-700 tw:rounded-full tw:text-xs tw:font-medium tw:border tw:border-blue-200 hover:tw:bg-blue-100 tw:transition-colors"
                    >
                      <Facebook className="tw:w-3.5 tw:h-3.5" />
                      Facebook
                      <ExternalLink className="tw:w-3 tw:h-3 tw:opacity-60" />
                    </a>
                  )}
                  {socialMediaLinks.google && (
                    <a
                      href={socialMediaLinks.google}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tw:inline-flex tw:items-center tw:gap-1.5 tw:px-3 tw:py-1.5 tw:bg-amber-50 tw:text-amber-700 tw:rounded-full tw:text-xs tw:font-medium tw:border tw:border-amber-200 hover:tw:bg-amber-100 tw:transition-colors"
                    >
                      <ExternalLink className="tw:w-3.5 tw:h-3.5" />
                      Google
                      <ExternalLink className="tw:w-3 tw:h-3 tw:opacity-60" />
                    </a>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Empty state for social links */}
          {!socialMediaLinks?.youtube &&
            !socialMediaLinks?.instagram &&
            !socialMediaLinks?.facebook && (
              <>
                <div className="tw:border-t tw:border-gray-200"></div>
                <div className="tw:text-center tw:py-2">
                  <div className="tw:text-xs tw:text-gray-400 tw:italic">
                    No social media links added
                  </div>
                </div>
              </>
            )}
        </div>
      </AppCard>

      <UpdateStoreBrandingModal
        show={storeBrandingModalState.show}
        callback={handleModalCallback}
        data={storeBrandingModalState.data}
      />

      <ImgPreviewModal
        show={showImgPreviewModal.show}
        callback={handleImgPreviewModalCallback}
        initialImageId={showImgPreviewModal.imageId}
        images={showImgPreviewModal.images}
      />
    </>
  );
};

export default StoreBranding;
