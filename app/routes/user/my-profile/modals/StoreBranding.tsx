import React from "react";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { Image as ImageIcon, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AppInput } from "~/components/core/form";
import FileUpload from "~/components/core/file-upload/FileUpload";
import ImgRender from "~/components/core/img/ImgRender";

const StoreBranding: React.FC = () => {
  const { t } = useTranslation(["common", "profile"]);
  const {
    control,
    register,
    formState: { errors },
    setValue,
  } = useFormContext();

  const storeLogo = useWatch({
    control,
    name: "storeLogo",
  });

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

  return (
    <div>
      <h3 className="tw:text-sm tw:font-semibold tw:text-gray-800 tw:mb-1 tw:flex tw:items-center tw:gap-2">
        <ImageIcon className="tw:w-4 tw:h-4 tw:text-purple-600" />
        {t("profile:storeBranding")}
      </h3>
      <p className="tw:text-xs tw:text-gray-500 tw:mb-4">
        {t("profile:storeBrandingNote")}
      </p>
      <div className="tw:grid tw:grid-cols-1 tw:gap-6">
        <AppInput
          label={t("profile:storeCaption")}
          name="caption"
          type="text"
          register={register}
          error={(errors as any).caption?.message}
          placeholder={t("profile:enterStoreCaption")}
          className="tw:mb-0"
          inputClassName="tw:bg-white"
        />

        <div className="tw:space-y-3">
          <label className="tw:block tw:text-sm tw:font-medium tw:text-gray-700">
            {t("profile:storeLogo")}
            <span className="tw:text-xs tw:font-normal tw:text-gray-500 tw:ml-2">
              ({t("profile:optional")})
            </span>
          </label>

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
                accept="image/*"
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
                    {t("profile:logoUploadNote", {
                      defaultValue: "PNG, JPG up to 5MB",
                    })}
                  </p>
                </div>
              </FileUpload>
            )}
          </div>

          {(errors as any).storeLogo && (
            <p className="tw:text-xs tw:text-red-500 tw:font-medium">
              {(errors as any).storeLogo.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreBranding;
