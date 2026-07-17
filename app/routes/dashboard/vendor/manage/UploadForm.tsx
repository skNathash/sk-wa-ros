import { BriefcaseBusiness } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import FileUpload from "~/components/core/file-upload/FileUpload";
import ImgRender from "~/components/core/img/ImgRender";

import type { VendorFormData } from "~/types/VendorTypes";

const UploadForm = () => {
  const { control, setValue, getValues } = useFormContext();
  const { t } = useTranslation(["common"]);

  const [panImg, gstImg] = useWatch({
    control,
    name: ["panImg", "gstImg"],
  });

  const handleFileRemove = (field: keyof VendorFormData) => () => {
    setValue(field, "");
  };

  const renderAsset = (assetId: string, altText: string) => {
    return (
      <ImgRender
        assetId={assetId}
        alt={altText}
        className="tw:max-w-full tw:max-h-32 tw:object-contain tw:mx-auto"
        size="300x300"
      />
    );
  };

  const handleFileUpload = (field: keyof VendorFormData) => (response: any) => {
    if (response?._id) {
      setValue(field, response._id);
    }
  };

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-6">
      <div>
        <label className="tw:block tw:text-sm tw:font-medium tw:mb-2">
          {t("panPhoto")}
        </label>
        <div className="tw:border tw:border-gray-300 tw:rounded-lg tw:p-4 tw:text-center tw:min-h-[180px] tw:flex tw:flex-col tw:items-center tw:justify-center tw:relative">
          {panImg ? (
            <div className="tw:w-full">
              {renderAsset(panImg, t("panDocument"))}
              <button
                type="button"
                onClick={handleFileRemove("panImg")}
                className="tw:absolute tw:top-2 tw:right-2 tw:bg-red-500 tw:text-white tw:rounded-full tw:w-6 tw:h-6 tw:flex tw:items-center tw:justify-center tw:text-xs"
              >
                ×
              </button>
            </div>
          ) : (
            <FileUpload
              onFileUpload={handleFileUpload("panImg")}
              allowedExtensions={["jpg", "jpeg", "png", "pdf"]}
              maxSizeMB={5}
              note={t("max5mbAllowed")}
            >
              <div className="tw:text-center">
                <BriefcaseBusiness className="tw:text-4xl tw:text-gray-400 tw:mb-2" />
                <div className="tw:text-sm tw:text-gray-600">
                  {t("clickToUploadPan")}
                </div>
              </div>
            </FileUpload>
          )}
        </div>
      </div>

      {/* GST Upload */}
      <div>
        <label className="tw:block tw:text-sm tw:font-medium tw:mb-2">
          {t("gstPhoto")}
        </label>
        <div className="tw:border tw:border-gray-300 tw:rounded-lg tw:p-4 tw:text-center tw:min-h-[180px] tw:flex tw:flex-col tw:items-center tw:justify-center tw:relative">
          {gstImg ? (
            <div className="tw:w-full">
              {renderAsset(gstImg, t("gstDocument"))}
              <button
                type="button"
                onClick={handleFileRemove("gstImg")}
                className="tw:absolute tw:top-2 tw:right-2 tw:bg-red-500 tw:text-white tw:rounded-full tw:w-6 tw:h-6 tw:flex tw:items-center tw:justify-center tw:text-xs"
              >
                ×
              </button>
            </div>
          ) : (
            <FileUpload
              onFileUpload={handleFileUpload("gstImg")}
              allowedExtensions={["jpg", "jpeg", "png", "pdf"]}
              maxSizeMB={5}
              note={t("max5mbAllowed")}
            >
              <div className="tw:text-center">
                <BriefcaseBusiness className="tw:text-4xl tw:text-gray-400 tw:mb-2" />
                <div className="tw:text-sm tw:text-gray-600">
                  {t("clickToUploadGst")}
                </div>
              </div>
            </FileUpload>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadForm;
