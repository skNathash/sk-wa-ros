import {
  ExternalLink,
  Facebook,
  Image as ImageIcon,
  Instagram,
  X,
  Youtube,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import FileUpload from "~/components/core/file-upload/FileUpload";
import { AppInput } from "~/components/core/form";
import AppTextarea from "~/components/core/form/AppTextarea";
import ImgRender from "~/components/core/img/ImgRender";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";

interface UpdateStoreBrandingModalProps {
  show: boolean;
  callback: (data: { action: string; data?: any }) => void;
  data?: {
    storeLogo?: string;
    storeCaption?: string;
    socialMediaLinks?: {
      youtube?: string;
      facebook?: string;
      instagram?: string;
      google?: string;
    };
  };
}

interface FormValues {
  storeLogo: string | undefined;
  storeCaption: string | undefined;
  youtubeLink: string | undefined;
  instagramLink: string | undefined;
  facebookLink: string | undefined;
  googleLink: string | undefined;
}

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const isValidYouTubeUrl = (url: string): boolean => {
  if (!isValidUrl(url)) return false;
  const u = new URL(url);
  return (
    u.hostname === "youtube.com" ||
    u.hostname === "youtu.be" ||
    u.hostname === "www.youtube.com"
  );
};

const isValidInstagramUrl = (url: string): boolean => {
  if (!isValidUrl(url)) return false;
  const u = new URL(url);
  return u.hostname === "instagram.com" || u.hostname === "www.instagram.com";
};

const isValidFacebookUrl = (url: string): boolean => {
  if (!isValidUrl(url)) return false;
  const u = new URL(url);
  return (
    u.hostname === "facebook.com" ||
    u.hostname === "www.facebook.com" ||
    u.hostname === "fb.com"
  );
};

const isValidGoogleUrl = (url: string): boolean => {
  if (!isValidUrl(url)) return false;
  const u = new URL(url);
  return (
    u.hostname === "google.com" ||
    u.hostname === "www.google.com" ||
    u.hostname.endsWith("google.co") ||
    u.hostname.endsWith("google.co.in")
  );
};

const UpdateStoreBrandingModal: React.FC<UpdateStoreBrandingModalProps> = ({
  show,
  callback,
  data,
}) => {
  const { t } = useTranslation(["common", "profile"]);
  const toast = useAppToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm<FormValues>({
    defaultValues: {
      storeLogo: "",
      storeCaption: "",
      youtubeLink: "",
      instagramLink: "",
      facebookLink: "",
      googleLink: "",
    },
  });

  const { handleSubmit, reset, setValue, watch } = methods;

  const storeLogo = useWatch({ control: methods.control, name: "storeLogo" });

  useEffect(() => {
    if (show && data) {
      reset({
        storeLogo: data.storeLogo || "",
        storeCaption: data.storeCaption || "",
        youtubeLink: data.socialMediaLinks?.youtube || "",
        instagramLink: data.socialMediaLinks?.instagram || "",
        facebookLink: data.socialMediaLinks?.facebook || "",
        googleLink: data.socialMediaLinks?.google || "",
      });
    }
  }, [show, data, reset]);

  const handleLogoUpload = (response: any) => {
    if (response && (response.id || response._id)) {
      setValue("storeLogo", response.id || response._id, {
        shouldValidate: true,
      });
    }
  };

  const removeLogo = () => {
    setValue("storeLogo", "", { shouldValidate: true });
  };

  const onSubmit = async (formData: FormValues) => {
    // Allow master login to submit branding updates. Previously master logins were blocked.

    // Validate URLs
    if (formData.youtubeLink && !isValidYouTubeUrl(formData.youtubeLink)) {
      toast.show({
        msg: t("profile:pleaseProvideValidYouTubeUrl"),
        color: "error",
      });
      return;
    }
    if (
      formData.instagramLink &&
      !isValidInstagramUrl(formData.instagramLink)
    ) {
      toast.show({
        msg: t("profile:pleaseProvideValidInstagramUrl"),
        color: "error",
      });
      return;
    }
    if (formData.facebookLink && !isValidFacebookUrl(formData.facebookLink)) {
      toast.show({
        msg: t("profile:pleaseProvideValidFacebookUrl"),
        color: "error",
      });
      return;
    }
    if (formData.googleLink && !isValidGoogleUrl(formData.googleLink)) {
      toast.show({
        msg: t("profile:pleaseProvideValidGoogleUrl", {
          defaultValue: "Please provide a valid Google URL",
        }),
        color: "error",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        storeLogo: formData.storeLogo || null,
        storeCaption: formData.storeCaption || null,
        socialMediaLinks: {
          youtube: formData.youtubeLink || null,
          facebook: formData.facebookLink || null,
          instagram: formData.instagramLink || null,
          google: formData.googleLink || null,
        },
      };

      const response = await FranchiseService.updateFranchise(payload);

      if (response && response.statusCode === 200) {
        toast.show({
          msg: t("profile:storeBrandingUpdatedSuccessfully", {
            defaultValue: "Store branding updated successfully!",
          }),
          color: "success",
        });

        callback({ action: "submit", data: formData });
      } else {
        toast.show({
          msg:
            response?.data?.message || t("profile:failedToUpdateStoreBranding"),
          color: "error",
        });
      }
    } catch (error: any) {
      console.error("Error updating store branding:", error);
      toast.show({
        msg: t("profile:failedToUpdateStoreBrandingTryAgain"),
        color: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    callback({ action: "close" });
  };

  return (
    <AppModal show={show} callback={callback} className="tw:h-[90vh]">
      <AppModal.Title onClose={handleClose}>
        <div className="tw:font-semibold">
          {t("profile:updateStoreBranding")}
        </div>
      </AppModal.Title>
      <AppModal.Content className="tw:max-h-[90vh]">
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="tw:space-y-6">
            {/* Store Logo */}
            <div className="tw:space-y-3">
              <label className="tw:block tw:text-sm tw:font-medium tw:text-gray-700">
                {t("profile:storeLogo")}
                <span className="tw:text-xs tw:font-normal tw:text-gray-500 tw:ml-2">
                  ({t("profile:optional")})
                </span>
              </label>
              <p className="tw:text-xs tw:text-gray-500 tw:mb-2">
                {t("profile:storeLogoDescription", {
                  defaultValue:
                    "This logo will be displayed on WhatsApp shares, and the club app to represent your store visually.",
                })}
              </p>

              <div className="tw:flex tw:items-start tw:gap-4">
                {storeLogo ? (
                  <div className="tw:relative tw:w-32 tw:h-32 tw:bg-white tw:border tw:border-gray-200 tw:rounded-xl tw:overflow-hidden tw:shadow-sm">
                    <ImgRender
                      assetId={storeLogo}
                      alt="Store Logo"
                      className="tw:w-full tw:h-full tw:object-contain"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="tw:absolute tw:top-2 tw:right-2 tw:bg-white tw:text-red-600 tw:rounded-full tw:p-1.5 tw:shadow-md tw:border tw:border-gray-100 hover:tw:bg-red-50 tw:transition-colors tw:z-10"
                      title={t("profile:removeLogo")}
                    >
                      <X className="tw:w-4 tw:h-4" />
                    </button>
                  </div>
                ) : (
                  <FileUpload
                    onFileUpload={handleLogoUpload}
                    accept="image/*,.webp"
                    label={t("profile:uploadLogo")}
                  >
                    <div className="tw:w-full tw:border-2 tw:border-dashed tw:border-gray-200 tw:rounded-xl tw:p-8 tw:flex tw:flex-col tw:items-center tw:justify-center tw:cursor-pointer hover:tw:border-purple-300 hover:tw:bg-purple-50/30 tw:transition-all tw:group tw:bg-white">
                      <div className="tw:w-12 tw:h-12 tw:bg-purple-50 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:mb-3 group-hover:tw:scale-110 tw:transition-transform">
                        <ImageIcon className="tw:w-6 tw:h-6 tw:text-purple-600" />
                      </div>
                      <span className="tw:text-sm tw:font-medium tw:text-gray-700 group-hover:tw:text-purple-700">
                        {t("profile:clickToUploadLogo")}
                      </span>
                      <p className="tw:text-xs tw:text-gray-500 tw:mt-1 tw:text-center">
                        PNG, JPG, WEBP up to 10MB
                      </p>
                    </div>
                  </FileUpload>
                )}
              </div>
            </div>

            {/* Store Caption */}
            <div className="tw:space-y-3">
              <label className="tw:block tw:text-sm tw:font-medium tw:text-gray-700">
                {t("profile:storeCaption")}
              </label>
              <p className="tw:text-xs tw:text-gray-500 tw:mb-2">
                {t("profile:storeCaptionDescription", {
                  defaultValue:
                    "A short description or tagline for your store that will appear alongside your logo in WhatsApp shares and the club app.",
                })}
              </p>
              <AppTextarea
                label=""
                name="storeCaption"
                register={methods.register}
                placeholder={t("profile:enterStoreCaption")}
                className="tw:mb-0 tw:text-xs"
                inputClassName="tw:bg-white tw:text-xs"
                maxLength={200}
              />
              <span className="tw:text-xs tw:text-gray-500">
                Max 200 characters
              </span>
            </div>

            {/* Social Links */}
            <div className="tw:space-y-4">
              <div>
                <h3 className="tw:text-sm tw:font-semibold tw:text-gray-800 tw:flex tw:items-center tw:gap-2">
                  <span>{t("profile:socialLinks")}</span>
                </h3>
                <p className="tw:text-xs tw:text-gray-500 tw:mt-1">
                  {t("profile:socialLinksDescription", {
                    defaultValue:
                      "Add your social media links to allow customers to follow and connect with your store on various platforms. These will be displayed in customer-facing interfaces.",
                  })}
                </p>
              </div>

              <div className="tw:grid tw:grid-cols-1 tw:gap-4">
                <AppInput
                  label="YouTube Link"
                  name="youtubeLink"
                  type="text"
                  register={methods.register}
                  placeholder="https://youtube.com/..."
                  className="tw:mb-0"
                  inputClassName="tw:bg-white"
                  leftIcon={
                    <Youtube className="tw:w-4 tw:h-4 tw:text-red-600" />
                  }
                />

                <AppInput
                  label="Instagram Link"
                  name="instagramLink"
                  type="text"
                  register={methods.register}
                  placeholder="https://instagram.com/..."
                  className="tw:mb-0"
                  inputClassName="tw:bg-white"
                  leftIcon={
                    <Instagram className="tw:w-4 tw:h-4 tw:text-pink-600" />
                  }
                />

                <AppInput
                  label="Facebook Link"
                  name="facebookLink"
                  type="text"
                  register={methods.register}
                  placeholder="https://facebook.com/..."
                  className="tw:mb-0"
                  inputClassName="tw:bg-white"
                  leftIcon={
                    <Facebook className="tw:w-4 tw:h-4 tw:text-blue-600" />
                  }
                />

                <AppInput
                  label="Google Link"
                  name="googleLink"
                  type="text"
                  register={methods.register}
                  placeholder="https://google.com/..."
                  className="tw:mb-0"
                  inputClassName="tw:bg-white"
                  leftIcon={
                    <ExternalLink className="tw:w-4 tw:h-4 tw:text-amber-600" />
                  }
                />
              </div>
            </div>
          </form>
        </FormProvider>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-3">
          <AppButton
            type="button"
            color="light"
            fill="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            {t("cancel")}
          </AppButton>
          <AppButton
            color="primary"
            onClick={methods.handleSubmit(onSubmit)}
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            {t("update")}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default UpdateStoreBrandingModal;
